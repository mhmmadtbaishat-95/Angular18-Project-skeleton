import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServiceRequest, RequestStatus } from '../../models/service.model';
import { ServiceRequestService } from '../../services/service-request.service';
import { SkeletonLoaderComponent } from '@shared/ui/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';

/**
 * Request detail component
 * Displays detailed information about a specific service request
 */
@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent, TranslatePipe],
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.scss']
})
export class RequestDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly translateService = inject(TranslateService);

  request: ServiceRequest | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const requestId = params['id'];
      this.loadRequest(requestId);
    });
  }

  /**
   * Loads request details
   */
  private loadRequest(requestId: string): void {
    this.isLoading = true;
    this.serviceRequestService.getRequestById(requestId).subscribe({
      next: (request) => {
        this.request = request;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load request:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Gets status badge class
   */
  getStatusClass(status: RequestStatus): string {
    const classes: Record<RequestStatus, string> = {
      [RequestStatus.DRAFT]: 'status-draft',
      [RequestStatus.SUBMITTED]: 'status-submitted',
      [RequestStatus.IN_REVIEW]: 'status-in-review',
      [RequestStatus.APPROVED]: 'status-approved',
      [RequestStatus.REJECTED]: 'status-rejected',
      [RequestStatus.IN_PROGRESS]: 'status-in-progress',
      [RequestStatus.COMPLETED]: 'status-completed',
      [RequestStatus.CANCELLED]: 'status-cancelled'
    };
    return classes[status] || '';
  }

  /**
   * Gets status label
   */
  getStatusLabel(status: RequestStatus): string {
    const labelKeys: Record<RequestStatus, string> = {
      [RequestStatus.DRAFT]: 'requestList.draft',
      [RequestStatus.SUBMITTED]: 'requestList.submitted',
      [RequestStatus.IN_REVIEW]: 'requestList.inReview',
      [RequestStatus.APPROVED]: 'requestList.approved',
      [RequestStatus.REJECTED]: 'requestList.rejected',
      [RequestStatus.IN_PROGRESS]: 'requestList.inProgress',
      [RequestStatus.COMPLETED]: 'requestList.completed',
      [RequestStatus.CANCELLED]: 'requestList.cancelled'
    };
    const key = labelKeys[status];
    return key ? this.translateService.instant(key) : status;
  }

  /**
   * Formats date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formats currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Gets form data items for display
   */
  getFormDataItems(): Array<{ label: string; value: string }> {
    if (!this.request?.formData) return [];
    
    const items: Array<{ label: string; value: string }> = [];
    const formData = this.request.formData;
    
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        const label = key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase());
        const value = typeof formData[key] === 'object' 
          ? JSON.stringify(formData[key]) 
          : String(formData[key]);
        items.push({ label, value });
      }
    });
    
    return items;
  }

  /**
   * Gets translated service name
   */
  getServiceName(serviceName: string): string {
    const currentLang = this.translateService.currentLang || 'en';
    
    // Map service names to translation keys
    const serviceNameMap: Record<string, string> = {
      'Commercial License Application': 'services.commercialLicenseApplication',
      'Industrial License': 'services.industrialLicense',
      'Trade License Renewal': 'services.tradeLicenseRenewal',
      'Investment License': 'services.investmentLicense',
      'Trademark Registration': 'services.trademarkRegistration',
      'Consumer Complaint': 'services.consumerComplaint'
    };

    const translationKey = serviceNameMap[serviceName];
    if (translationKey) {
      const translated = this.translateService.instant(translationKey);
      return translated !== translationKey ? translated : serviceName;
    }
    
    return serviceName;
  }
}

