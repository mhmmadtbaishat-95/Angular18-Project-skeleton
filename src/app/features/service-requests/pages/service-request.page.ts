import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink, NavigationEnd } from '@angular/router';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ServiceRequestService } from '../services/service-request.service';
import { NotificationService } from '@core/services/notification/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '@core/services/i18n/i18n.service';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { NumberFormatDirective } from '@shared/pipes-directives/number-format.directive';
import { DOCUMENT } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { StepWizardComponent, StepConfig } from '../components/step-wizard/step-wizard.component';
import { IDocumentType, IUploadedDocument } from '../models/document.model';
import { IServiceRequestResponse, ICreateAndSubmitRequestPayload, ICreateAndSubmitRequestResponse, IRequestDocument, ICreateDocumentPayload, IAttachment } from '../models/api-request.model';
import { environment } from '../../../../environments/environment';
import { MapSelectorComponent, LandDetails } from '@shared/ui/map-selector/map-selector.component';

/**
 * Service request page component
 * Displays dynamic forms for service requests with step wizard
 */
@Component({
  selector: 'app-service-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    StepWizardComponent,
    MapSelectorComponent,
    NumberFormatDirective,
  ],
  templateUrl: './service-request.page.html',
  styleUrls: ['./service-request.page.scss'],
})
export class ServiceRequestPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly i18nService = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private readonly fb = inject(FormBuilder);
  private langChangeSubscription?: Subscription;
  private routerSubscription?: Subscription;

  requestForm: FormGroup;
  isLoading = false;
  requestId: string | null = null;
  serviceId: string | null = null;
  serviceName: string = '';
  isRTL = signal(this.i18nService.isRTL());
  showSuccessModal = false;
  showEligibilityModal = false;
  isEligible = true; // Track eligibility status
  submittedRequestNumber: string = '';
  submissionResponse: IServiceRequestResponse | null = null;

  // Step wizard properties
  currentStepIndex = 0;
  steps: StepConfig[] = [];

  // Sub-form navigation within step 2
  currentSubFormIndex = 0;
  subForms: Array<{ id: string; title: string }> = [];

  // Document upload properties
  documentTypes: IDocumentType[] = [];
  selectedDocumentType: IDocumentType | null = null;
  uploadedDocuments: Map<string, IUploadedDocument> = new Map(); // Key: documentTypeId
  documentErrors: string[] = [];
  isLoadingDocumentTypes = false;
  
  // API response data
  requestDocuments: IRequestDocument[] = []; // Documents from API response for stage 3
  requestGuid: string = ''; // Request GUID from API response

  // Map modal properties
  showMapModal = false;
  pendingLandDetails: LandDetails | null = null;
  isLocationSelectedFromMap = false; // Track if location was selected from map

  // AI Document Analysis properties
  documentAnalysis: Map<string, {
    summary: string;
    warnings: string[];
    extractedData?: any;
  }> = new Map();
  
  // Track AI analysis loading state for each document
  documentAnalysisLoading: Map<string, boolean> = new Map();

  // Static OCR extracted data (pre-defined JSON)
  private staticExtractedData: Map<string, any> = new Map([
    // License documents
    ['license', {
      licenseNumber: 'CR-AX-2026-45872',
      issueDate: '1 يناير 2026',
      expiryDate: '31 ديسمبر 2026',
      licenseStatus: 'Active',
      licenseHolder: 'شركة AX للبناء ذ.م.م',
      licenseHolderEn: 'AX Building LLC'
    }],
    // Plan documents
    ['plan', {
      plotArea: '2500 m²',
      coordinates: { lat: '25.2854', lng: '51.5310' },
      zone: 'المنطقة السكنية',
      zoneEn: 'Residential Zone',
      approvalDate: '20 يونيو 2023'
    }],
    // Building permit documents
    ['permit', {
      permitNumber: 'BP-2024-56789',
      buildingHeight: '18 meters',
      numberOfFloors: 6,
      issueDate: '10 يناير 2024',
      validUntil: '10 يناير 2026'
    }]
  ]);

  constructor() {
    // Demo dates - set to future dates for realistic demo
    const today = new Date();
    const startSaleDate = new Date(today);
    startSaleDate.setMonth(today.getMonth() + 2); // 2 months from now
    const expectedDeliveryDate = new Date(today);
    expectedDeliveryDate.setFullYear(today.getFullYear() + 2); // 2 years from now

    // Pre-populated developer information (read-only, populated dynamically from API)
    this.requestForm = this.fb.group({
      // Developer info (read-only, populated from API)
      developerRegistrationNumber: [{ value: '', disabled: true }],
      developerName: [{ value: '', disabled: true }],
      developerType: [{ value: '', disabled: true }],
      licenseStatus: [{ value: '', disabled: true }],
      licenseExpirationDate: [{ value: '', disabled: true }],

        // Form A: Project Licenses Request (No pre-populated data)
        projectName: ['', Validators.required],
        projectType: ['', Validators.required],
        area: [{ value: '', disabled: true }, Validators.required], // Disabled until map selection
        plotNumber: [{ value: '', disabled: true }, Validators.required], // Disabled until map selection
        landArea: ['', Validators.required],
      numberOfUnits: [''],
      executionPeriod: ['', Validators.required],

      // Form B: Master Plan & Preliminary Design
      designStage: ['', Validators.required],
      numberOfBuildings: ['', Validators.required],
      numberOfDevelopmentStages: ['', Validators.required],
      approximateHeight: ['', Validators.required],

      // Form C: Escrow Account (optional initially, will be required if isOffPlan is 0 (yes))
      // 0 = Yes (off-plan), 1 = No (not off-plan)
      isOffPlan: [1], // Default to 1 (No)
      bankName: ['', ''],
      estimatedProjectValue: ['', ''],

      // Form D: License Application (optional initially, will be required if isOffPlan is true)
      numberOfUnitsForSale: ['', ''],
      startSaleDate: ['', ''],
      expectedDeliveryDate: ['', ''],
      downPaymentPercentage: ['', ''],
    });
  }

  /**
   * Formats date for input[type="date"] (YYYY-MM-DD format)
   */
  /**
   * Opens map modal
   */
  openMapModal(): void {
    this.showMapModal = true;
  }

  /**
   * Closes map modal
   */
  closeMapModal(): void {
    this.showMapModal = false;
    this.pendingLandDetails = null;
  }

  /**
   * Handle land selection from map in modal
   */
  onLandSelectedFromModal(landDetails: LandDetails): void {
    this.pendingLandDetails = landDetails;
  }

  /**
   * Confirms map selection and updates form
   */
  confirmMapSelection(): void {
    if (this.pendingLandDetails) {
      this.isLocationSelectedFromMap = true; // Mark that location was selected
      this.requestForm.patchValue({
        area: this.pendingLandDetails.area,
        plotNumber: this.pendingLandDetails.plotNumber,
      }, { emitEvent: false });
      
      // Enable fields for editing after map selection
      this.requestForm.get('area')?.enable();
      this.requestForm.get('plotNumber')?.enable();
      
      this.notificationService.success(
        this.translateService.instant('serviceRequest.mapSelector.locationSelected')
      );
    }
    this.closeMapModal();
  }

  /**
   * Handle land selection from map (legacy - kept for compatibility)
   */
  onLandSelected(landDetails: LandDetails): void {
    // This is called from modal, so we just store it
    this.pendingLandDetails = landDetails;
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    // Initialize steps and sub-forms with translations
    this.initializeSteps();
    this.initializeSubForms();

    // Subscribe to language changes to update RTL state and translations
    this.langChangeSubscription = this.translateService.onLangChange.subscribe(() => {
      this.updateRTLState();
      this.initializeSteps();
      this.initializeSubForms();
    });

    // Subscribe to route changes to update RTL state
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateRTLState();
      });

    // Set initial RTL state
    this.updateRTLState();

    this.route.params.subscribe((params) => {
      this.requestId = params['id'] || null;
      this.loadServiceData();
    });

    this.route.queryParams.subscribe((queryParams) => {
      this.serviceId = queryParams['serviceId'] || null;
      if (this.serviceId) {
        this.loadServiceName();
      }
    });
  }

  /**
   * Initializes steps with translated titles and descriptions
   */
  private initializeSteps(): void {
    this.steps = [
      {
        id: 'request-info',
        title: this.translateService.instant('serviceRequest.steps.requestInformation.title'),
        description: this.translateService.instant(
          'serviceRequest.steps.requestInformation.description'
        ),
        completed: false,
        active: this.currentStepIndex === 0,
        disabled: false,
      },
      {
        id: 'project-forms',
        title: this.translateService.instant('serviceRequest.steps.projectInformation.title'),
        description: this.translateService.instant(
          'serviceRequest.steps.projectInformation.description'
        ),
        completed: false,
        active: this.currentStepIndex === 1,
        disabled: this.currentStepIndex < 1,
      },
      {
        id: 'documents',
        title: this.translateService.instant('serviceRequest.steps.documents.title'),
        description: this.translateService.instant('serviceRequest.steps.documents.description'),
        completed: false,
        active: this.currentStepIndex === 2,
        disabled: this.currentStepIndex < 2,
      },
    ];
  }

  /**
   * Initializes sub-forms with translated titles
   */
  private initializeSubForms(): void {
    this.subForms = [
      {
        id: 'project-licenses',
        title: this.translateService.instant('serviceRequest.formA.title'),
      },
      { id: 'master-plan', title: this.translateService.instant('serviceRequest.formB.title') },
      { id: 'escrow-account', title: this.translateService.instant('serviceRequest.formC.title') },
      {
        id: 'license-application',
        title: this.translateService.instant('serviceRequest.formD.title'),
      },
    ];
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  /**
   * Updates RTL state from document or service
   */
  private updateRTLState(): void {
    const htmlDir = this.document.documentElement.getAttribute('dir');
    const currentRTL = htmlDir === 'rtl' || this.i18nService.isRTL();
    this.isRTL.set(currentRTL);
  }

  /**
   * Loads service data
   */
  private loadServiceData(): void {
    // Load service data if needed
    // TODO: Load developer information from API and populate form
    // For now, using pre-populated mock data
    this.loadDeveloperInfo();
  }

  /**
   * Loads developer information from API
   * When API is ready, this will automatically use the real endpoint
   */
  private loadDeveloperInfo(): void {
    this.serviceRequestService.getDeveloperInfo().subscribe({
      next: (developerInfo) => {
        console.log('Developer info received from API:', developerInfo);
        
        // Check license status eligibility (only if enabled in configuration)
        if (environment.enableLicenseEligibilityCheck) {
          const licenseStatus = developerInfo.licenseStatus || '';
          this.isEligible = licenseStatus === 'Active';
          
          if (!this.isEligible) {
            // Show eligibility modal
            this.showEligibilityModal = true;
            // Disable the entire form
            this.requestForm.disable();
            // Show error notification
            this.notificationService.error(
              this.translateService.instant('serviceRequest.notEligibleMessage') || 
              'Your license is not active. You are not eligible to submit service requests.'
            );
          } else {
            // Enable form if eligible
            this.requestForm.enable();
            // Re-disable the read-only fields
            const readOnlyFields = [
              'developerRegistrationNumber',
              'developerName',
              'developerType',
              'licenseStatus',
              'licenseExpirationDate'
            ];
            readOnlyFields.forEach(field => {
              this.requestForm.get(field)?.disable({ emitEvent: false });
            });
          }
        } else {
          // Eligibility check is disabled - allow form submission
          console.log('⚠️ License eligibility check is disabled (enableLicenseEligibilityCheck: false)');
          this.isEligible = true;
          this.requestForm.enable();
          // Re-disable the read-only fields
          const readOnlyFields = [
            'developerRegistrationNumber',
            'developerName',
            'developerType',
            'licenseStatus',
            'licenseExpirationDate'
          ];
          readOnlyFields.forEach(field => {
            this.requestForm.get(field)?.disable({ emitEvent: false });
          });
        }
        
        // Update form with developer info from API
        // For disabled fields, we need to enable them temporarily, update, then disable again
        const fieldsToUpdate = [
          'developerRegistrationNumber',
          'developerName',
          'developerType',
          'licenseStatus',
          'licenseExpirationDate'
        ];

        // Enable fields temporarily to update values
        fieldsToUpdate.forEach(field => {
          this.requestForm.get(field)?.enable({ emitEvent: false });
        });

        // Update values
        this.requestForm.patchValue({
          developerRegistrationNumber: developerInfo.developerRegistrationNumber || '',
          developerName: developerInfo.developerName || '',
          developerType: developerInfo.developerType || '',
          licenseStatus: developerInfo.licenseStatus || '',
          licenseExpirationDate: developerInfo.licenseExpirationDate || '',
        }, { emitEvent: false });

        // Disable fields again (only if eligible, otherwise form is already disabled)
        if (this.isEligible) {
          fieldsToUpdate.forEach(field => {
            this.requestForm.get(field)?.disable({ emitEvent: false });
          });
        }

        // Initialize toggle based on initial value first
        // Use setTimeout to ensure form is fully initialized
        setTimeout(() => {
          const initialIsOffPlan = this.requestForm.get('isOffPlan')?.value;
          if (initialIsOffPlan !== undefined) {
            this.toggleOffPlanForms(initialIsOffPlan);
          }

          // Subscribe to isOffPlan changes to toggle Form C and D validators
          this.requestForm.get('isOffPlan')?.valueChanges.subscribe(isOffPlan => {
            this.toggleOffPlanForms(isOffPlan);
          });
        }, 0);
      },
      error: (error) => {
        console.error('Failed to load developer information:', error);
        // On error, only show eligibility modal if check is enabled
        if (environment.enableLicenseEligibilityCheck) {
          this.isEligible = false;
          this.showEligibilityModal = true;
          this.requestForm.disable();
          this.notificationService.error(
            this.translateService.instant('serviceRequest.errorLoadingDeveloperInfo') ||
            'Failed to load developer information. Please contact support.'
          );
        } else {
          // Eligibility check is disabled - allow form to continue
          console.warn('⚠️ Failed to load developer info, but eligibility check is disabled. Form will remain enabled.');
          this.isEligible = true;
          this.requestForm.enable();
        }
      },
    });
  }

  /**
   * Toggles Form C and D validators based on isOffPlan value
   * If isOffPlan is true, makes forms required; if false, makes them optional
   */
  toggleOffPlanForms(isOffPlan: any): void {
    // Convert to number: 0 = Yes (off-plan), 1 = No (not off-plan)
    const isOffPlanValue = typeof isOffPlan === 'string' ? parseInt(isOffPlan, 10) : isOffPlan;
    const isOffPlanSelected = isOffPlanValue === 0; // 0 means Yes (off-plan)
    const formCFields = ['bankName', 'estimatedProjectValue'];
    const formDFields = ['numberOfUnitsForSale', 'startSaleDate', 'expectedDeliveryDate', 'downPaymentPercentage'];
    
    if (isOffPlanSelected) {
      // Make Form C and D fields required
      formCFields.forEach(field => {
        this.requestForm.get(field)?.setValidators([Validators.required]);
        this.requestForm.get(field)?.updateValueAndValidity({ emitEvent: false });
      });
      formDFields.forEach(field => {
        this.requestForm.get(field)?.setValidators([Validators.required]);
        this.requestForm.get(field)?.updateValueAndValidity({ emitEvent: false });
      });
    } else {
      // Make Form C and D fields optional (clear validators)
      formCFields.forEach(field => {
        this.requestForm.get(field)?.clearValidators();
        this.requestForm.get(field)?.updateValueAndValidity({ emitEvent: false });
      });
      formDFields.forEach(field => {
        this.requestForm.get(field)?.clearValidators();
        this.requestForm.get(field)?.updateValueAndValidity({ emitEvent: false });
      });
    }
  }

  /**
   * Handles draft button click (showcase functionality)
   */
  onSaveDraft(): void {
    // Showcase functionality - just show a notification
    this.notificationService.info(
      this.translateService.instant('serviceRequest.draftSaved') || 'Draft saved successfully'
    );
    console.log('📝 Draft saved (showcase):', this.requestForm.getRawValue());
  }

  /**
   * Closes the eligibility modal
   */
  closeEligibilityModal(): void {
    this.showEligibilityModal = false;
    // Navigate back to services page
    this.router.navigate(['/service-requests/services']);
  }

  /**
   * Loads service name
   */
  private loadServiceName(): void {
    if (this.serviceId) {
      this.serviceRequestService.getService(this.serviceId).subscribe({
        next: (service) => {
          if (service) {
            this.serviceName = this.i18nService.isRTL()
              ? service.nameAr || service.name || ''
              : service.name || service.nameAr || '';
          }
        },
        error: (error) => {
          console.error('Failed to load service:', error);
        },
      });
    }
  }

  /**
   * Handles form submission
   * Called from stage 2 (Project Information) - documents will be uploaded separately in stage 3
   */
  onSubmit(): void {
    // Validate form
    if (!this.requestForm.valid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.requestForm.controls).forEach((key) => {
        this.requestForm.get(key)?.markAsTouched();
      });
      this.notificationService.warning(
        this.translateService.instant('form.pleaseCompleteAllRequiredFields')
      );
      return;
    }

    // Note: Document validation removed since we're submitting from stage 2
    // Documents will be handled separately in stage 3 using RequestDocuments from API response

    this.isLoading = true;

    // Map form data to API payload format
    const formValues = this.requestForm.getRawValue();
    const apiPayload: ICreateAndSubmitRequestPayload = {
      RequestGuid: '00000000-0000-0000-0000-000000000000', // Empty GUID for new requests
      ProjectName: formValues.projectName || '',
      ProjectType: this.parseToNumber(formValues.projectType) || 0,
      Area: formValues.area || '',
      PlotNumber: formValues.plotNumber || '',
      LandArea: formValues.landArea || '',
      NumberOfUnits: String(formValues.numberOfUnits || ''),
      ExecutionPeriod: String(formValues.executionPeriod || ''),
      DesignStage: this.parseToNumber(formValues.designStage) || 0,
      NumberOfBuildings: String(formValues.numberOfBuildings || ''),
      NumberOfDevelopmentStages: String(formValues.numberOfDevelopmentStages || ''),
      ApproximateHeight: String(formValues.approximateHeight || ''),
      IsTheProjectOffPlanSale: formValues.isOffPlan === 0 ? 0 : 1, // 0 = Yes, 1 = No
      BankName: formValues.bankName || '',
      EstimatedValueOfProject: String(formValues.estimatedProjectValue || ''),
      NumberOfUnitsForSale: String(formValues.numberOfUnitsForSale || ''),
      StartSaleDate: formValues.startSaleDate || new Date().toISOString(),
      ExpectedDeliveryDate: formValues.expectedDeliveryDate || new Date().toISOString(),
      DownPaymentPercentage: String(formValues.downPaymentPercentage || ''),
      DeveloperComments: formValues.developerComments || '',
      AqaratComments: formValues.aqaratComments || ''
    };

    console.log('📤 Submitting request with payload:', apiPayload);

    this.serviceRequestService.createAndSubmitRequest(apiPayload).subscribe({
      next: (response: ICreateAndSubmitRequestResponse) => {
        this.isLoading = false;
        console.log('✅ Request submitted successfully:', response);
        
        // Store request number and GUID
        this.submittedRequestNumber = response.RequestNumber || '';
        this.requestGuid = response.RequestGuid || '';
        
        // Store request documents for stage 3
        this.requestDocuments = response.RequestDocuments || [];
        
        // Convert RequestDocuments to IDocumentType format
        this.documentTypes = this.convertRequestDocumentsToDocumentTypes(response.RequestDocuments || []);
        
        // Mark step 1 as completed
        this.markStepCompleted(1);
        
        // Navigate to document upload step (step 2)
        this.goToStep(2);
        
        // Show success notification
        this.notificationService.success(
          this.translateService.instant('serviceRequest.submissionSuccess') + 
          ' ' + 
          this.translateService.instant('serviceRequest.pleaseUploadDocuments')
        );
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage =
          error?.error?.Message ||
          error?.error?.message ||
          error?.message ||
          'Failed to submit service request. Please try again.';
        this.notificationService.error(errorMessage);
        console.error('❌ Submission error:', error);
      },
    });
  }

  /**
   * Helper method to parse string to number safely
   */
  private parseToNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Converts RequestDocuments from API response to IDocumentType format
   * Only Commercial Registration is required, all others are optional
   */
  private convertRequestDocumentsToDocumentTypes(requestDocuments: IRequestDocument[]): IDocumentType[] {
    return requestDocuments.map((doc, index) => {
      const docName = (doc.DocumentName || '').toLowerCase();
      const docNameAr = (doc.DocumentNameAr || '').toLowerCase();
      
      // Check if this is a commercial registration document
      // Look for keywords: commercial, registration, certificate, trade license, company registration
      const isCommercialRegistration = 
        docName.includes('commercial') && (docName.includes('registration') || docName.includes('certificate')) ||
        docName.includes('trade') && docName.includes('license') ||
        docName.includes('company') && docName.includes('registration') ||
        docNameAr.includes('تجاري') && (docNameAr.includes('قيد') || docNameAr.includes('شهادة')) ||
        docNameAr.includes('ترخيص') && docNameAr.includes('تجاري') ||
        docNameAr.includes('شركة') && docNameAr.includes('قيد');
      
      return {
        id: doc.DocumentGuid,
        name: doc.DocumentName || `Document ${index + 1}`,
        nameAr: doc.DocumentNameAr || doc.DocumentName || `مستند ${index + 1}`, // Use DocumentNameAr if available
        required: isCommercialRegistration, // Only commercial registration is required
        description: doc.DocumentDescription || '',
        descriptionAr: doc.ProcessTemplateAr || doc.DocumentDescription || '', // Use ProcessTemplateAr if available
        allowedFormats: ['pdf', 'jpg', 'png', 'doc', 'docx'], // Default formats
        maxSize: 10 * 1024 * 1024 // 10MB default
      };
    });
  }

  /**
   * Navigates to next step
   */
  nextStep(): void {
    if (this.currentStepIndex === 0) {
      // Request information step - all fields are pre-populated and read-only
      // No validation needed, just proceed to next step
      this.markStepCompleted(0);
      this.goToStep(1);
    } else if (this.currentStepIndex === 1) {
      // Project forms step - validate all forms before submitting
      const isOffPlan = this.isOffPlanSelected();
      
      // Always required fields (Forms A and B)
      const projectFormFields = [
        'projectName',
        'projectType',
        'area',
        'plotNumber',
        'landArea',
        'executionPeriod',
        'designStage',
        'numberOfBuildings',
        'numberOfDevelopmentStages',
        'approximateHeight',
      ];

      // Add Form C and D fields only if isOffPlan is true
      if (isOffPlan) {
        projectFormFields.push(
          'bankName',
          'estimatedProjectValue',
          'numberOfUnitsForSale',
          'startSaleDate',
          'expectedDeliveryDate',
          'downPaymentPercentage'
        );
      }

      // Mark all project form fields as touched
      projectFormFields.forEach((field) => {
        const control = this.requestForm.get(field);
        if (control) {
          control.markAsTouched();
        }
      });

      // Check if all required fields are valid
      const invalidFields = projectFormFields.filter((field) => {
        const control = this.requestForm.get(field);
        return control && control.invalid && control.hasError('required');
      });

      if (invalidFields.length === 0) {
        // All fields valid - submit the form
        this.markStepCompleted(1);
        this.onSubmit();
      } else {
        this.notificationService.warning(
          this.translateService.instant('form.pleaseCompleteAllRequiredFields')
        );
      }
    } else if (this.currentStepIndex === 2) {
      // Documents step - validate all required documents are uploaded before showing success modal
      if (this.areAllRequiredDocumentsUploaded()) {
        this.showSubmissionSuccessModal();
      } else {
        this.notificationService.warning(
          this.translateService.instant('serviceRequest.uploadAllRequiredDocuments')
        );
      }
    }
  }

  /**
   * Navigates to previous step
   */
  previousStep(): void {
    if (this.currentStepIndex > 0) {
      // Navigate to previous main step
      this.currentStepIndex--;
      this.initializeSteps(); // Re-initialize to update active state
      this.scrollToTop();
    }
  }

  /**
   * Navigates to specific step
   */
  goToStep(index: number): void {
    if (index >= 0 && index < this.steps.length && index <= this.currentStepIndex + 1) {
      this.currentStepIndex = index;
      this.initializeSteps(); // Re-initialize to update active state
      this.steps[this.currentStepIndex].disabled = false;

      // Load document types when entering documents step (only if not already loaded from API response)
      if (index === 2 && this.documentTypes.length === 0) {
        // If we have requestDocuments from API, use those instead
        if (this.requestDocuments.length > 0) {
          this.documentTypes = this.convertRequestDocumentsToDocumentTypes(this.requestDocuments);
        } else {
          // Otherwise, load from API
          this.loadDocumentTypes();
        }
      }

      this.scrollToTop();
    }
  }

  /**
   * Handles step click from wizard
   */
  onStepClick(index: number): void {
    this.goToStep(index);
  }

  /**
   * Marks a step as completed
   */
  markStepCompleted(index: number): void {
    if (index < this.steps.length) {
      this.steps[index].completed = true;
      if (index + 1 < this.steps.length) {
        this.steps[index + 1].disabled = false;
      }
      this.initializeSteps(); // Re-initialize to update completed state
    }
  }

  /**
   * Checks if can proceed to next step
   */
  canProceedNext(): boolean {
    return this.currentStepIndex < this.steps.length - 1;
  }

  /**
   * Checks if can go back
   */
  canGoBack(): boolean {
    return this.currentStepIndex > 0;
  }

  /**
   * Checks if is last step
   */
  isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1;
  }

  /**
   * Checks if is project forms step
   */
  isProjectFormsStep(): boolean {
    return this.currentStepIndex === 1;
  }

  /**
   * Checks if off-plan is selected
   * Returns true if value is 0 (Yes), false if value is 1 (No)
   */
  isOffPlanSelected(): boolean {
    const value = this.requestForm.get('isOffPlan')?.value;
    // Convert to number: 0 = Yes (off-plan), 1 = No (not off-plan)
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    return numValue === 0; // 0 means Yes (off-plan)
  }

  /**
   * Checks if is last sub-form
   */
  isLastSubForm(): boolean {
    return this.currentSubFormIndex === this.subForms.length - 1;
  }

  /**
   * Checks if can proceed to next sub-form
   */
  canProceedNextSubForm(): boolean {
    return this.currentSubFormIndex < this.subForms.length - 1;
  }

  /**
   * Checks if can go back to previous sub-form
   */
  canGoBackSubForm(): boolean {
    return this.currentSubFormIndex > 0;
  }

  /**
   * Gets fields for current sub-form
   */
  getCurrentSubFormFields(): string[] {
    switch (this.currentSubFormIndex) {
      case 0: // Form A: Project Licenses Request
        return [
          'projectName',
          'projectType',
          'area',
          'plotNumber',
          'landArea',
          'numberOfUnits',
          'executionPeriod',
        ];
      case 1: // Form B: Master Plan & Preliminary Design
        return [
          'designStage',
          'numberOfBuildings',
          'numberOfDevelopmentStages',
          'approximateHeight',
        ];
      case 2: // Form C: Escrow Account
        return ['bankName', 'estimatedProjectValue'];
      case 3: // Form D: License Application
        return [
          'numberOfUnitsForSale',
          'startSaleDate',
          'expectedDeliveryDate',
          'downPaymentPercentage',
        ];
      default:
        return [];
    }
  }

  /**
   * Checks if current sub-form is valid
   */
  isCurrentSubFormValid(): boolean {
    const fields = this.getCurrentSubFormFields();
    return fields.every((field) => {
      const control = this.requestForm.get(field);
      // Optional fields don't need validation
      if (field === 'numberOfUnits') {
        return true;
      }
      return control ? control.valid : true;
    });
  }

  /**
   * Marks current sub-form fields as touched
   */
  markCurrentSubFormFieldsAsTouched(): void {
    const fields = this.getCurrentSubFormFields();
    fields.forEach((field) => {
      const control = this.requestForm.get(field);
      if (control && field !== 'numberOfUnits') {
        control.markAsTouched();
      }
    });
  }

  /**
   * Navigates to specific sub-form
   */
  goToSubForm(index: number): void {
    if (index >= 0 && index < this.subForms.length) {
      // Validate current sub-form before navigating
      if (this.isCurrentSubFormValid() || index < this.currentSubFormIndex) {
        this.currentSubFormIndex = index;
        this.scrollToTop();
      } else {
        this.markCurrentSubFormFieldsAsTouched();
      }
    }
  }

  /**
   * Checks if is submission step (now always false as submission happens on documents step)
   */
  isSubmissionStep(): boolean {
    return false;
  }

  /**
   * Loads document types from API
   */
  private loadDocumentTypes(): void {
    this.isLoadingDocumentTypes = true;
    this.serviceRequestService.getDocumentTypes(this.serviceId || undefined).subscribe({
      next: (documentTypes) => {
        this.documentTypes = documentTypes;
        this.isLoadingDocumentTypes = false;
      },
      error: (error) => {
        console.error('Error loading document types:', error);
        this.isLoadingDocumentTypes = false;
        this.notificationService.error('Failed to load document types. Please try again.');
      },
    });
  }

  /**
   * Handles document type selection (deprecated - no longer needed with new UI)
   */
  onDocumentTypeSelect(documentTypeId: string): void {
    const documentType = this.documentTypes.find((dt) => dt.id === documentTypeId);
    if (documentType) {
      this.selectedDocumentType = documentType;
      this.documentErrors = [];
    }
  }

  /**
   * Handles file selection for a specific document type
   * Uploads document immediately using the API
   */
  onFileSelectedForType(event: Event, documentType: IDocumentType): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0]; // Only take first file
      this.documentErrors = [];
      
      // Set selected document type for validation
      this.selectedDocumentType = documentType;

      // Validate file size
      const maxSize = this.selectedDocumentType.maxSize || 10 * 1024 * 1024; // Default 10MB
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        this.documentErrors.push(
          this.translateService.instant('serviceRequest.fileSizeExceeded', { maxSize: maxSizeMB })
        );
        input.value = ''; // Reset input
        return;
      }

      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedFormats = this.selectedDocumentType.allowedFormats || ['pdf', 'jpg', 'png', 'doc', 'docx'];
      if (!allowedFormats.includes(fileExtension)) {
        this.documentErrors.push(
          this.translateService.instant('serviceRequest.invalidFileType', {
            formats: allowedFormats.join(', ').toUpperCase(),
          })
        );
        input.value = ''; // Reset input
        return;
      }

      // Find the corresponding RequestDocument from API response
      const requestDocument = this.requestDocuments.find(rd => rd.DocumentGuid === this.selectedDocumentType!.id);
      if (!requestDocument) {
        this.notificationService.error('Document type not found in request. Please try again.');
        input.value = '';
        return;
      }

      // Create uploaded document entry (for UI tracking)
      const uploadedDoc: IUploadedDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        documentTypeId: this.selectedDocumentType.id,
        documentTypeName: this.isRTL()
          ? this.selectedDocumentType.nameAr
          : this.selectedDocumentType.name,
        file: file,
        uploadedAt: new Date(),
        uploadProgress: 0
      };

      // Store by document type ID (for UI)
      this.uploadedDocuments.set(this.selectedDocumentType.id, uploadedDoc);

      // Upload document immediately
      this.uploadSingleDocument(file, requestDocument, uploadedDoc);

      // Reset selection
      this.selectedDocumentType = null;
      input.value = ''; // Reset input
    }
  }

  /**
   * Uploads a single document to the API
   */
  private uploadSingleDocument(file: File, requestDocument: IRequestDocument, uploadedDoc: IUploadedDocument): void {
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1]; // Remove data:type;base64, prefix
      const mimeType = file.type || 'application/octet-stream';

      // Create attachment payload
      const attachment: IAttachment = {
        AttachmentGuid: '00000000-0000-0000-0000-000000000000', // Empty GUID for new attachment
        MimeType: mimeType,
        FileName: file.name,
        Size: file.size,
        AttachmentBody: base64String
      };

      // Create document payload
      const payload: ICreateDocumentPayload = {
        DocumentName: requestDocument.DocumentName,
        DocumentGuid: requestDocument.DocumentGuid,
        DocumentDescription: requestDocument.DocumentDescription || '',
        Attachment: attachment,
        pageIndex: requestDocument.pageIndex || 0,
        entityName: requestDocument.entityName || ''
      };

      // Update upload progress
      uploadedDoc.uploadProgress = 50;

      // Call API to upload document
      this.serviceRequestService.createDocument(payload).subscribe({
        next: (response) => {
          uploadedDoc.uploadProgress = 100;
          uploadedDoc.uploadError = undefined;
          this.notificationService.success(
            this.translateService.instant('serviceRequest.documentUploadedSuccessfully')
          );
          console.log('✅ Document uploaded successfully:', response);
          
          // Perform AI analysis on uploaded document
          this.analyzeDocument(uploadedDoc.documentTypeId, file, requestDocument);
        },
        error: (error) => {
          uploadedDoc.uploadProgress = 0;
          const errorMessage = error?.error?.Message || error?.message || 'Failed to upload document';
          uploadedDoc.uploadError = errorMessage;
          this.notificationService.error(errorMessage);
          console.error('❌ Document upload error:', error);
          // Remove from uploaded documents on error
          this.uploadedDocuments.delete(uploadedDoc.documentTypeId);
        }
      });
    };

    reader.onerror = () => {
      this.notificationService.error('Failed to read file. Please try again.');
      this.uploadedDocuments.delete(uploadedDoc.documentTypeId);
    };

    reader.readAsDataURL(file);
  }

  /**
   * Removes a document from the upload list
   */
  removeDocument(documentTypeId: string): void {
    this.uploadedDocuments.delete(documentTypeId);
    this.notificationService.success(
      this.translateService.instant('serviceRequest.documentRemoved')
    );
  }

  /**
   * Gets uploaded document for a specific document type
   */
  getUploadedDocument(documentTypeId: string): IUploadedDocument | undefined {
    return this.uploadedDocuments.get(documentTypeId);
  }

  /**
   * Checks if all required documents are uploaded successfully
   */
  areAllRequiredDocumentsUploaded(): boolean {
    if (this.documentTypes.length === 0) {
      // If document types haven't loaded yet, return false
      return false;
    }
    const requiredTypes = this.documentTypes.filter((dt) => dt.required);
    if (requiredTypes.length === 0) {
      // If no required documents, check if at least one document is uploaded successfully
      return Array.from(this.uploadedDocuments.values()).some(
        doc => doc.uploadProgress === 100 && !doc.uploadError
      );
    }
    // Check that all required documents are uploaded and successfully completed (progress 100%, no errors)
    return requiredTypes.every((dt) => {
      const uploadedDoc = this.uploadedDocuments.get(dt.id);
      return uploadedDoc && uploadedDoc.uploadProgress === 100 && !uploadedDoc.uploadError;
    });
  }

  /**
   * Gets list of missing required documents
   */
  getMissingRequiredDocuments(): IDocumentType[] {
    const requiredTypes = this.documentTypes.filter((dt) => dt.required);
    return requiredTypes.filter((dt) => !this.uploadedDocuments.has(dt.id));
  }

  /**
   * Gets document type name (localized)
   */
  getDocumentTypeName(documentType: IDocumentType): string {
    return this.isRTL() ? documentType.nameAr : documentType.name;
  }

  /**
   * Gets document type description (localized)
   */
  getDocumentDescription(documentType: IDocumentType): string {
    return this.isRTL() ? (documentType.descriptionAr || '') : (documentType.description || '');
  }

  /**
   * Performs AI analysis on uploaded document (static/mock analysis)
   */
  private analyzeDocument(documentTypeId: string, file: File, requestDocument: IRequestDocument): void {
    // Set loading state
    this.documentAnalysisLoading.set(documentTypeId, true);
    
    // Simulate OCR/AI processing delay (2-3 seconds to feel realistic)
    const processingTime = 2500;
    setTimeout(() => {
      const analysis = this.generateMockAIAnalysis(documentTypeId, file, requestDocument);
      this.documentAnalysis.set(documentTypeId, analysis);
      this.documentAnalysisLoading.set(documentTypeId, false);
    }, processingTime);
  }

  /**
   * Checks if AI analysis is loading for a document
   */
  isDocumentAnalysisLoading(documentTypeId: string): boolean {
    return this.documentAnalysisLoading.get(documentTypeId) || false;
  }

  /**
   * Generates mock AI analysis for document (static data from pre-defined JSON)
   */
  private generateMockAIAnalysis(documentTypeId: string, file: File, requestDocument: IRequestDocument): {
    summary: string;
    warnings: string[];
    extractedData?: any;
  } {
    const docName = requestDocument.DocumentName || '';
    
    // Determine document type key
    let docTypeKey = 'generic';
    const docNameLower = docName.toLowerCase();
    if (docNameLower.includes('license') || docNameLower.includes('ترخيص') || docNameLower.includes('lic')) {
      docTypeKey = 'license';
    } else if (docNameLower.includes('plan') || docNameLower.includes('مخطط')) {
      docTypeKey = 'plan';
    } else if (docNameLower.includes('permit') || docNameLower.includes('رخصة بناء') || docNameLower.includes('building')) {
      docTypeKey = 'permit';
    }

    // Get static extracted data from JSON
    const staticData = this.staticExtractedData.get(docTypeKey) || {};
    
    // Debug logs
    console.log('Document Name:', docName);
    console.log('Document Type Key:', docTypeKey);
    console.log('Static Data Retrieved:', staticData);
    
    // Prepare extracted data (localized) - copy all static data
    const extractedData: any = {
      documentType: docName,
      fileSize: file.size,
      analyzedAt: new Date().toISOString()
    };

    // Copy static data to extractedData based on document type
    // Always add data if staticData exists (for debugging, we'll use license data as default)
    if (docTypeKey === 'license' && staticData.licenseNumber) {
      extractedData.licenseNumber = staticData.licenseNumber;
      extractedData.issueDate = staticData.issueDate;
      extractedData.expiryDate = staticData.expiryDate;
      extractedData.licenseStatus = staticData.licenseStatus;
      extractedData.licenseHolder = this.isRTL() ? staticData.licenseHolder : staticData.licenseHolderEn;
    } else if (docTypeKey === 'plan' && staticData.plotArea) {
      extractedData.plotArea = staticData.plotArea;
      extractedData.coordinates = { ...staticData.coordinates }; // Deep copy
      extractedData.zone = this.isRTL() ? staticData.zone : staticData.zoneEn;
      extractedData.approvalDate = staticData.approvalDate;
    } else if (docTypeKey === 'permit' && staticData.permitNumber) {
      extractedData.permitNumber = staticData.permitNumber;
      extractedData.buildingHeight = staticData.buildingHeight;
      extractedData.numberOfFloors = staticData.numberOfFloors;
      extractedData.issueDate = staticData.issueDate;
      extractedData.validUntil = staticData.validUntil;
    } else {
      // Default: Use license data for any document type if no match found
      const defaultLicenseData = this.staticExtractedData.get('license');
      if (defaultLicenseData) {
        extractedData.licenseNumber = defaultLicenseData.licenseNumber;
        extractedData.issueDate = defaultLicenseData.issueDate;
        extractedData.expiryDate = defaultLicenseData.expiryDate;
        extractedData.licenseStatus = defaultLicenseData.licenseStatus;
        extractedData.licenseHolder = this.isRTL() ? defaultLicenseData.licenseHolder : defaultLicenseData.licenseHolderEn;
      }
    }
    
    // Debug log
    console.log('Document Type Key:', docTypeKey);
    console.log('Static Data:', staticData);
    console.log('Extracted Data:', extractedData);

    // Static summary (localized)
    let summary = '';
    if (docTypeKey === 'license') {
      summary = this.isRTL() 
        ? `تم تحليل المستند بنجاح. تم استخراج معلومات الترخيص: رقم الترخيص ${extractedData.licenseNumber}، تاريخ الإصدار ${extractedData.issueDate}، تاريخ الانتهاء ${extractedData.expiryDate}. حامل الترخيص: ${extractedData.licenseHolder}.`
        : `Document analyzed successfully. Extracted license information: License Number ${extractedData.licenseNumber}, Issue Date ${extractedData.issueDate}, Expiry Date ${extractedData.expiryDate}. License Holder: ${extractedData.licenseHolder}.`;
    } else if (docTypeKey === 'plan') {
      summary = this.isRTL()
        ? `تم تحليل المخطط بنجاح. المساحة: ${extractedData.plotArea}، الإحداثيات: ${extractedData.coordinates.lat}, ${extractedData.coordinates.lng}، المنطقة: ${extractedData.zone}، تاريخ الموافقة: ${extractedData.approvalDate}.`
        : `Plan analyzed successfully. Area: ${extractedData.plotArea}, Coordinates: ${extractedData.coordinates.lat}, ${extractedData.coordinates.lng}, Zone: ${extractedData.zone}, Approval Date: ${extractedData.approvalDate}.`;
    } else if (docTypeKey === 'permit') {
      summary = this.isRTL()
        ? `تم تحليل رخصة البناء بنجاح. رقم الرخصة: ${extractedData.permitNumber}، الارتفاع: ${extractedData.buildingHeight} (${extractedData.numberOfFloors} طابق)، تاريخ الإصدار: ${extractedData.issueDate}، صالحة حتى: ${extractedData.validUntil}.`
        : `Building permit analyzed successfully. Permit Number: ${extractedData.permitNumber}, Height: ${extractedData.buildingHeight} (${extractedData.numberOfFloors} floors), Issue Date: ${extractedData.issueDate}, Valid Until: ${extractedData.validUntil}.`;
    } else {
      summary = this.isRTL()
        ? 'تم تحليل المستند بنجاح. تم استخراج المعلومات الأساسية والتحقق من صحة البيانات. المستند يحتوي على جميع المعلومات المطلوبة.'
        : 'Document analyzed successfully. Basic information extracted and data validated. Document contains all required information.';
    }

    // Static warnings (pre-defined)
    const warnings: string[] = [];
    if (docTypeKey === 'license') {
      // License is active, so no expiration warning
      warnings.push(
        this.isRTL()
          ? '📄 جودة الصورة منخفضة. يرجى التأكد من وضوح جميع المعلومات والنصوص.'
          : '📄 Image quality is low. Please ensure all information and text are clearly visible.'
      );
    } else if (docTypeKey === 'plan') {
      warnings.push(
        this.isRTL()
          ? '📅 عدم تطابق في التواريخ المكتوبة. يرجى التحقق من صحة جميع التواريخ في المستند.'
          : '📅 Date mismatch detected in document. Please verify accuracy of all dates.'
      );
    } else if (docTypeKey === 'permit') {
      warnings.push(
        this.isRTL()
          ? '⚠️ ارتفاع المبنى (18 متر) يتجاوز الحد المسموح (15 متر). قد تحتاج إلى موافقة إضافية.'
          : '⚠️ Building height (18 meters) exceeds allowed limit (15 meters). Additional approval may be required.'
      );
      warnings.push(
        this.isRTL()
          ? '✍️ التوقيع غير واضح أو مفقود. يرجى التحقق من وجود توقيع صحيح وواضح.'
          : '✍️ Signature is unclear or missing. Please verify a valid and clear signature is present.'
      );
    } else {
      warnings.push(
        this.isRTL()
          ? '📄 جودة الصورة منخفضة. يرجى التأكد من وضوح جميع المعلومات والنصوص.'
          : '📄 Image quality is low. Please ensure all information and text are clearly visible.'
      );
    }

    return {
      summary,
      warnings,
      extractedData
    };
  }

  /**
   * Gets AI analysis for a document type
   */
  getDocumentAnalysis(documentTypeId: string): { summary: string; warnings: string[]; extractedData?: any } | undefined {
    return this.documentAnalysis.get(documentTypeId);
  }

  /**
   * Gets extracted data items as key-value pairs for display
   */
  getExtractedDataItems(documentTypeId: string): Array<{ key: string; value: string }> {
    const analysis = this.documentAnalysis.get(documentTypeId);
    if (!analysis || !analysis.extractedData) {
      console.log('No analysis or extractedData for', documentTypeId, 'Analysis:', analysis);
      return [];
    }

    const items: Array<{ key: string; value: string }> = [];
    const data = analysis.extractedData;
    
    console.log('Processing extracted data for', documentTypeId, 'Data keys:', Object.keys(data));

    // License-specific data
    if (data.licenseNumber) {
      items.push({
        key: this.isRTL() ? 'رقم الترخيص' : 'License Number',
        value: data.licenseNumber
      });
    }
    if (data.issueDate) {
      items.push({
        key: this.isRTL() ? 'تاريخ الإصدار' : 'Issue Date',
        value: data.issueDate
      });
    }
    if (data.expiryDate) {
      items.push({
        key: this.isRTL() ? 'تاريخ الانتهاء' : 'Expiry Date',
        value: data.expiryDate
      });
    }
    if (data.licenseStatus) {
      items.push({
        key: this.isRTL() ? 'حالة الترخيص' : 'License Status',
        value: data.licenseStatus === 'Active' ? (this.isRTL() ? 'نشط' : 'Active') : (this.isRTL() ? 'منتهي' : 'Expired')
      });
    }
    if (data.licenseHolder) {
      items.push({
        key: this.isRTL() ? 'حامل الترخيص' : 'License Holder',
        value: data.licenseHolder
      });
    }

    // Plan-specific data
    if (data.plotArea) {
      items.push({
        key: this.isRTL() ? 'مساحة القطعة' : 'Plot Area',
        value: data.plotArea
      });
    }
    if (data.coordinates) {
      items.push({
        key: this.isRTL() ? 'الإحداثيات' : 'Coordinates',
        value: `${data.coordinates.lat}, ${data.coordinates.lng}`
      });
    }
    if (data.zone) {
      items.push({
        key: this.isRTL() ? 'المنطقة' : 'Zone',
        value: data.zone
      });
    }
    if (data.approvalDate) {
      items.push({
        key: this.isRTL() ? 'تاريخ الموافقة' : 'Approval Date',
        value: data.approvalDate
      });
    }

    // Building permit data
    if (data.permitNumber) {
      items.push({
        key: this.isRTL() ? 'رقم الرخصة' : 'Permit Number',
        value: data.permitNumber
      });
    }
    if (data.buildingHeight) {
      items.push({
        key: this.isRTL() ? 'ارتفاع المبنى' : 'Building Height',
        value: data.buildingHeight
      });
    }
    if (data.numberOfFloors) {
      items.push({
        key: this.isRTL() ? 'عدد الطوابق' : 'Number of Floors',
        value: data.numberOfFloors.toString()
      });
    }
    if (data.validUntil) {
      items.push({
        key: this.isRTL() ? 'صالح حتى' : 'Valid Until',
        value: data.validUntil
      });
    }

    return items;
  }

  /**
   * Gets accepted file formats string for input accept attribute
   */
  getAcceptedFormats(documentType: IDocumentType): string {
    const formats = documentType.allowedFormats || ['pdf', 'jpg', 'png'];
    return formats.map((f) => `.${f}`).join(',');
  }

  /**
   * Gets upload hint text based on document type
   */
  getUploadHint(documentType: IDocumentType): string {
    const maxSizeMB = Math.round((documentType.maxSize || 2 * 1024 * 1024) / (1024 * 1024));
    const formats = (documentType.allowedFormats || ['pdf', 'jpg', 'png']).join(', ').toUpperCase();
    return this.translateService.instant('serviceRequest.uploadHintWithDetails', {
      maxSize: maxSizeMB,
      formats: formats,
    });
  }

  /**
   * Scrolls to top of page
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Handles form cancellation
   */
  onCancel(): void {
    if (this.serviceId) {
      this.router.navigate(['/service-requests/service', this.serviceId]);
    } else {
      this.router.navigate(['/service-requests/services']);
    }
  }

  /**
   * Gets field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.requestForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.translateService.instant('form.fieldRequired');
      }
      if (field.errors['email']) {
        return this.translateService.instant('form.invalidEmail');
      }
    }
    return '';
  }

  /**
   * Gets developer information for display
   */
  getDeveloperInfo() {
    return {
      registrationNumber: this.requestForm.get('developerRegistrationNumber')?.value || '',
      name: this.requestForm.get('developerName')?.value || '',
      type: this.requestForm.get('developerType')?.value || '',
      licenseStatus: this.requestForm.get('licenseStatus')?.value || '',
      expirationDate: this.requestForm.get('licenseExpirationDate')?.value || '',
    };
  }

  /**
   * Shows the submission success modal
   * Called when user clicks the complete/submit button after uploading all documents
   */
  private showSubmissionSuccessModal(): void {
    // Ensure we have the submission response data
    if (!this.submissionResponse) {
      this.submissionResponse = {
        id: this.requestGuid,
        requestNumber: this.submittedRequestNumber,
        status: this.translateService.instant('serviceRequest.statusSubmitted'), // Localized status
        submittedAt: new Date().toISOString(),
        message: this.translateService.instant('serviceRequest.submissionSuccess')
      };
    } else {
      // Update status to be localized
      this.submissionResponse.status = this.translateService.instant('serviceRequest.statusSubmitted');
    }
    this.showSuccessModal = true;
    this.notificationService.success(
      this.translateService.instant('serviceRequest.submissionSuccess')
    );
  }

  /**
   * Closes success modal and navigates to services list
   */
  goToServicesList(): void {
    this.showSuccessModal = false;
    this.submissionResponse = null;
    this.submittedRequestNumber = '';
    this.router.navigate(['/service-requests/services']);
  }

  /**
   * Gets success message with parameters
   */
  getSuccessMessage(): string {
    return this.translateService.instant('serviceRequest.successMessage', {
      requestNumber: this.submittedRequestNumber,
      serviceName: this.serviceName || this.translateService.instant('serviceRequest.serviceName'),
    });
  }

  /**
   * Formats file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Formats date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Formats date as YYYY-MM-DD (year-month-day only)
   * Used for readonly fields like license expiration date
   */
  formatDateShort(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Gets tab letter (A, B, C, D) for sub-form tabs
   */
  getTabLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
