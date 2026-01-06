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
import { DOCUMENT } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { StepWizardComponent, StepConfig } from '../components/step-wizard/step-wizard.component';
import { IDocumentType, IUploadedDocument } from '../models/document.model';
import { IServiceRequestResponse } from '../models/api-request.model';

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

  constructor() {
    // Pre-populated developer information (read-only)
    this.requestForm = this.fb.group({
      // Developer info (read-only)
      developerRegistrationNumber: [{ value: 'DEV-2024-001234', disabled: true }],
      developerName: [{ value: 'Qatar Real Estate Development Co.', disabled: true }],
      developerType: [{ value: 'Legal', disabled: true }],
      licenseStatus: [{ value: 'Active', disabled: true }],
      licenseExpirationDate: [{ value: '2025-12-31', disabled: true }],

      // Form A: Project Licenses Request
      projectName: ['', Validators.required],
      projectType: ['', Validators.required],
      area: ['', Validators.required],
      plotNumber: ['', Validators.required],
      landArea: ['', Validators.required],
      numberOfUnits: [''],
      executionPeriod: ['', Validators.required],

      // Form B: Master Plan & Preliminary Design
      planType: ['', Validators.required],
      designStage: ['', Validators.required],
      numberOfBuildings: ['', Validators.required],
      numberOfDevelopmentStages: ['', Validators.required],
      approximateHeight: ['', Validators.required],

      // Form C: Escrow Account
      isOffPlan: [false],
      bankName: ['', Validators.required],
      estimatedProjectValue: ['', Validators.required],

      // Form D: License Application
      numberOfUnitsForSale: ['', Validators.required],
      startSaleDate: ['', Validators.required],
      expectedDeliveryDate: ['', Validators.required],
      downPaymentPercentage: ['', Validators.required],
    });
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
        // Update form with developer info from API
        this.requestForm.patchValue({
          developerRegistrationNumber: developerInfo.developerRegistrationNumber,
          developerName: developerInfo.developerName,
          developerType: developerInfo.developerType,
          licenseStatus: developerInfo.licenseStatus,
          licenseExpirationDate: developerInfo.licenseExpirationDate,
        });
      },
      error: (error) => {
        console.error('Failed to load developer information:', error);
        // Keep the default mock values if API fails
        // In production, you might want to show an error message
      },
    });
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

    // Validate all required documents are uploaded
    if (!this.areAllRequiredDocumentsUploaded()) {
      const missingDocuments = this.getMissingRequiredDocuments();
      const missingNames = missingDocuments.map((dt) => this.getDocumentTypeName(dt)).join(', ');
      this.notificationService.warning(
        this.translateService.instant('serviceRequest.uploadAllRequiredDocuments') +
          ': ' +
          missingNames
      );
      return;
    }

    // Validate at least one document is uploaded (if document types are loaded)
    if (this.documentTypes.length > 0 && this.uploadedDocuments.size === 0) {
      this.notificationService.warning(
        this.translateService.instant('serviceRequest.uploadAtLeastOneDocument')
      );
      return;
    }

    this.isLoading = true;

    // Use getRawValue() to include disabled fields (read-only developer info)
    const formData = {
      ...this.requestForm.getRawValue(),
      documents: Array.from(this.uploadedDocuments.values()).map((doc, index) => ({
        documentTypeId: doc.documentTypeId,
        name: doc.file.name,
        size: doc.file.size,
        type: doc.file.type,
        index: index,
      })),
      requestId: this.requestId,
      serviceId: this.serviceId,
      submittedAt: new Date().toISOString(),
    };

    this.serviceRequestService.submitServiceRequest(formData).subscribe({
      next: (response: IServiceRequestResponse) => {
        this.isLoading = false;
        // Store full API response
        this.submissionResponse = response;
        // Use API response fields - requestNumber is the reference number from API
        this.submittedRequestNumber = response.requestNumber || response.id || `SR-${Date.now()}`;
        // Show success modal
        this.showSuccessModal = true;
        this.notificationService.success(
          this.translateService.instant('serviceRequest.submissionSuccess')
        );
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage =
          error?.error?.message ||
          error?.message ||
          'Failed to submit service request. Please try again.';
        this.notificationService.error(errorMessage);
        console.error('Submission error:', error);
      },
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
      // Project forms step - validate all forms before proceeding
      const projectFormFields = [
        'projectName',
        'projectType',
        'area',
        'plotNumber',
        'landArea',
        'executionPeriod',
        'planType',
        'designStage',
        'numberOfBuildings',
        'numberOfDevelopmentStages',
        'approximateHeight',
        'bankName',
        'estimatedProjectValue',
        'numberOfUnitsForSale',
        'startSaleDate',
        'expectedDeliveryDate',
        'downPaymentPercentage',
      ];

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
        this.markStepCompleted(1);
        this.goToStep(2);
      } else {
        this.notificationService.warning(
          this.translateService.instant('form.pleaseCompleteAllRequiredFields')
        );
      }
    } else if (this.currentStepIndex === 2) {
      // Documents step - validate all required documents are uploaded before submitting
      if (this.areAllRequiredDocumentsUploaded()) {
        this.onSubmit();
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

      // Load document types when entering documents step
      if (index === 2 && this.documentTypes.length === 0) {
        this.loadDocumentTypes();
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
          'planType',
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
   * Handles document type selection
   */
  onDocumentTypeSelect(documentTypeId: string): void {
    const documentType = this.documentTypes.find((dt) => dt.id === documentTypeId);
    if (documentType) {
      this.selectedDocumentType = documentType;
      this.documentErrors = [];
    }
  }

  /**
   * Handles file selection for document upload (single file per document type)
   */
  onFileSelected(event: Event): void {
    if (!this.selectedDocumentType) {
      this.notificationService.warning(
        this.translateService.instant('serviceRequest.selectDocumentTypeFirst')
      );
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0]; // Only take first file
      this.documentErrors = [];

      // Validate file size
      const maxSize = this.selectedDocumentType.maxSize || 2 * 1024 * 1024; // Default 2MB
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
      const allowedFormats = this.selectedDocumentType.allowedFormats || ['pdf', 'jpg', 'png'];
      if (!allowedFormats.includes(fileExtension)) {
        this.documentErrors.push(
          this.translateService.instant('serviceRequest.invalidFileType', {
            formats: allowedFormats.join(', ').toUpperCase(),
          })
        );
        input.value = ''; // Reset input
        return;
      }

      // Create uploaded document entry
      const uploadedDoc: IUploadedDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        documentTypeId: this.selectedDocumentType.id,
        documentTypeName: this.isRTL()
          ? this.selectedDocumentType.nameAr
          : this.selectedDocumentType.name,
        file: file,
        uploadedAt: new Date(),
      };

      // Store by document type ID (only one file per type)
      this.uploadedDocuments.set(this.selectedDocumentType.id, uploadedDoc);

      // Reset selection
      this.selectedDocumentType = null;
      input.value = ''; // Reset input

      this.notificationService.success(
        this.translateService.instant('serviceRequest.documentUploadedSuccessfully')
      );
    }
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
   * Checks if all required documents are uploaded
   */
  areAllRequiredDocumentsUploaded(): boolean {
    if (this.documentTypes.length === 0) {
      // If document types haven't loaded yet, return false to prevent submission
      return false;
    }
    const requiredTypes = this.documentTypes.filter((dt) => dt.required);
    if (requiredTypes.length === 0) {
      // If no required documents, at least one document should be uploaded
      return this.uploadedDocuments.size > 0;
    }
    return requiredTypes.every((dt) => this.uploadedDocuments.has(dt.id));
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
   * Gets tab letter (A, B, C, D) for sub-form tabs
   */
  getTabLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
