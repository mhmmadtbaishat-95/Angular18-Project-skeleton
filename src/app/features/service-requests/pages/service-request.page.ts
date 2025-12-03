import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MultiStepFormComponent } from '../components/multi-step-form/multi-step-form.component';
import { FormDefinition } from '../models/form-field.model';
import { ServiceRequestService } from '../services/service-request.service';
import { NotificationService } from '@core/services/notification/notification.service';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';

/**
 * Service request page component
 * Displays dynamic forms for service requests
 */
@Component({
  selector: 'app-service-request',
  standalone: true,
  imports: [
    CommonModule,
    MultiStepFormComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './service-request.page.html',
  styleUrls: ['./service-request.page.scss']
})
export class ServiceRequestPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly notificationService = inject(NotificationService);

  formDefinition: FormDefinition | null = null;
  isLoading = true;
  formId: string | null = null;
  private loadedFormId: string | null = null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.formId = params['id'] || 'default';
      // Only load if formId changed
      if (this.formId !== this.loadedFormId) {
        this.loadFormDefinition();
      } else if (this.formDefinition) {
        // If form already loaded, ensure loading is false
        this.isLoading = false;
      }
    });
  }

  /**
   * Loads form definition from service
   */
  private loadFormDefinition(): void {
    if (!this.formId) {
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.serviceRequestService.getFormDefinition(this.formId).subscribe({
      next: (definition) => {
        if (definition) {
          this.formDefinition = definition;
          this.loadedFormId = this.formId;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load form definition:', error);
        this.notificationService.error('Failed to load form. Please try again.');
        this.formDefinition = null;
        this.isLoading = false;
      }
    });
  }

  /**
   * Handles form submission
   */
  onFormSubmit(formData: any): void {
    this.isLoading = true;
    
    // Simulate payment processing if payment is included
    if (this.formDefinition?.includePayment) {
      this.processPayment(formData);
    } else {
      this.submitServiceRequest(formData);
    }
  }

  /**
   * Processes payment
   */
  private processPayment(formData: any): void {
    // Extract payment information
    const paymentData = {
      cardNumber: formData.cardNumber,
      cardExpiry: formData.cardExpiry,
      cardCVV: formData.cardCVV,
      cardholderName: formData.cardholderName,
      amount: this.formDefinition?.paymentAmount || 0,
      currency: this.formDefinition?.paymentCurrency || 'QAR'
    };

    this.serviceRequestService.processPayment(paymentData).subscribe({
      next: (paymentResult) => {
        if (paymentResult.success) {
          this.submitServiceRequest(formData, paymentResult.transactionId);
        } else {
          this.isLoading = false;
          this.notificationService.error(paymentResult.message || 'Payment failed. Please try again.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Payment processing failed. Please check your payment details.');
        console.error('Payment error:', error);
      }
    });
  }

  /**
   * Submits service request
   */
  private submitServiceRequest(formData: any, transactionId?: string): void {
    const requestData = {
      ...formData,
      formId: this.formId,
      transactionId,
      submittedAt: new Date().toISOString()
    };

    this.serviceRequestService.submitServiceRequest(requestData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.notificationService.success('Service request submitted successfully!');
        // Redirect to success page or dashboard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to submit service request. Please try again.');
        console.error('Submission error:', error);
      }
    });
  }

  /**
   * Handles form cancellation
   */
  onFormCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Gets payment amount
   */
  get paymentAmount(): number {
    return this.formDefinition?.paymentAmount || 0;
  }

  /**
   * Gets service fee (5% of amount)
   */
  get serviceFee(): number {
    return this.paymentAmount * 0.05;
  }

  /**
   * Gets tax (5% VAT for Qatar)
   */
  get tax(): number {
    return this.paymentAmount * 0.05;
  }
}

