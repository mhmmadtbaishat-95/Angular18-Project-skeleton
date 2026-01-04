import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceRequestService } from '../services/service-request.service';
import { NotificationService } from '@core/services/notification/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '@core/services/i18n/i18n.service';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { DOCUMENT } from '@angular/common';
import { Subscription, filter } from 'rxjs';

/**
 * Service request page component
 * Displays dynamic forms for service requests
 */
@Component({
  selector: 'app-service-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe
  ],
  templateUrl: './service-request.page.html',
  styleUrls: ['./service-request.page.scss']
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

  constructor() {
    this.requestForm = this.fb.group({
      companyName: ['', Validators.required],
      tradeName: [''],
      commercialNumber: ['', Validators.required],
      registrationDate: ['', Validators.required],
      mainOfficeAddress: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Subscribe to language changes to update RTL state
    this.langChangeSubscription = this.translateService.onLangChange.subscribe(() => {
      this.updateRTLState();
    });
    
    // Subscribe to route changes to update RTL state
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateRTLState();
    });
    
    // Set initial RTL state
    this.updateRTLState();

    this.route.params.subscribe(params => {
      this.requestId = params['id'] || null;
      this.loadServiceData();
    });

    this.route.queryParams.subscribe(queryParams => {
      this.serviceId = queryParams['serviceId'] || null;
      if (this.serviceId) {
        this.loadServiceName();
      }
    });
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
              ? (service.nameAr || service.name || '') 
              : (service.name || service.nameAr || '');
          }
        },
        error: (error) => {
          console.error('Failed to load service:', error);
        }
      });
    }
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.requestForm.valid) {
      this.isLoading = true;
      
      const formData = {
        ...this.requestForm.value,
        requestId: this.requestId,
        serviceId: this.serviceId,
        submittedAt: new Date().toISOString()
      };

      this.serviceRequestService.submitServiceRequest(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.submittedRequestNumber = response.id || `SR-${Date.now()}`;
          this.showSuccessModal = true;
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.error('Failed to submit service request. Please try again.');
          console.error('Submission error:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.requestForm.controls).forEach(key => {
        this.requestForm.get(key)?.markAsTouched();
      });
    }
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
   * Closes success modal and navigates to services list
   */
  goToServicesList(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/service-requests/services']);
  }

  /**
   * Gets success message with parameters
   */
  getSuccessMessage(): string {
    return this.translateService.instant('serviceRequest.successMessage', {
      requestNumber: this.submittedRequestNumber,
      serviceName: this.serviceName || this.translateService.instant('serviceRequest.serviceName')
    });
  }
}

