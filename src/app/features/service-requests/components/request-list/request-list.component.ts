import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ServiceRequest, RequestStatus } from '../../models/service.model';
import { ServiceRequestService } from '../../services/service-request.service';
import { SkeletonLoaderComponent } from '@shared/ui/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { TableSkeletonLoaderComponent } from '@shared/table-skeleton-loader/table-skeleton-loader.component';

/**
 * Request list component
 * Displays all service requests with status tracking
 */
@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SkeletonLoaderComponent,
    TableSkeletonLoaderComponent,
    TranslatePipe,
  ],
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss'],
})
export class RequestListComponent implements OnInit {
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  requests: ServiceRequest[] = [];
  filteredRequests: ServiceRequest[] = [];
  selectedStatus: RequestStatus | 'all' = 'all';
  isLoading = false;

  statusOptions = [
    { value: 'all' as const, labelKey: 'requestList.all' },
    { value: RequestStatus.SUBMITTED, labelKey: 'requestList.submitted' },
    { value: RequestStatus.IN_REVIEW, labelKey: 'requestList.inReview' },
    { value: RequestStatus.APPROVED, labelKey: 'requestList.approved' },
    { value: RequestStatus.IN_PROGRESS, labelKey: 'requestList.inProgress' },
    { value: RequestStatus.COMPLETED, labelKey: 'requestList.completed' },
    { value: RequestStatus.REJECTED, labelKey: 'requestList.rejected' },
  ];

  ngOnInit(): void {
    this.loadRequests();
  }

  /**
   * Loads user's service requests
   */
  private loadRequests(): void {
    this.isLoading = true;
    this.serviceRequestService.getUserRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.filteredRequests = requests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load requests:', error);
        this.isLoading = false;
      },
    });
  }

  /**
   * Filters requests by status
   */
  filterByStatus(status: RequestStatus | 'all'): void {
    this.selectedStatus = status;
    if (status === 'all') {
      this.filteredRequests = [...this.requests];
    } else {
      this.filteredRequests = this.requests.filter((r) => r.status === status);
    }
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
      [RequestStatus.CANCELLED]: 'status-cancelled',
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
      [RequestStatus.CANCELLED]: 'requestList.cancelled',
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
    });
  }

  /**
   * Gets count for a status
   */
  getStatusCount(status: RequestStatus): number {
    return this.requests.filter((r) => r.status === status).length;
  }

  /**
   * Views request details
   */
  viewRequest(request: ServiceRequest): void {
    this.router.navigate(['/service-requests/view', request.id]);
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
      'Consumer Complaint': 'services.consumerComplaint',
    };

    const translationKey = serviceNameMap[serviceName];
    if (translationKey) {
      const translated = this.translateService.instant(translationKey);
      return translated !== translationKey ? translated : serviceName;
    }

    return serviceName;
  }
}
