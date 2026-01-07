import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RequestLogEntry } from '../../models/request-log.model';
import { RequestStatus } from '../../models/service.model';
import { ServiceRequestService } from '../../services/service-request.service';
import { SkeletonLoaderComponent } from '@shared/ui/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { TableSkeletonLoaderComponent } from '@shared/table-skeleton-loader/table-skeleton-loader.component';
import { SkeletonLoaderRequestCardComponent } from '@shared/ui/skeleton-loader-request-card/skeleton-loader-request-card.component';
import { SkeletonLoaderRequestDetailsComponent } from '@shared/ui/skeleton-loader-request-details/skeleton-loader-request-details.component';

/**
 * Request log component
 * Displays all service requests in a table format with applicant information
 */
@Component({
  selector: 'app-request-log',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SkeletonLoaderComponent,
    SkeletonLoaderRequestCardComponent,
    SkeletonLoaderRequestDetailsComponent,
    TranslatePipe,
    TableSkeletonLoaderComponent,
  ],
  templateUrl: './request-log.component.html',
  styleUrls: ['./request-log.component.scss'],
})
export class RequestLogComponent implements OnInit {
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  requestLogs: RequestLogEntry[] = [];
  filteredLogs: RequestLogEntry[] = [];
  selectedStatus: RequestStatus | 'all' = 'all';
  isLoading = false;

  statusOptions = [
    { value: 'all' as const, labelKey: 'requestLog.all' },
    { value: RequestStatus.IN_REVIEW, labelKey: 'requestLog.inReview' },
    { value: RequestStatus.APPROVED, labelKey: 'requestLog.approved' },
    { value: RequestStatus.REJECTED, labelKey: 'requestLog.rejected' },
    { value: RequestStatus.COMPLETED, labelKey: 'requestLog.completed' },
    { value: RequestStatus.CANCELLED, labelKey: 'requestLog.closed' },
  ];

  ngOnInit(): void {
    this.loadRequestLogs();
  }

  /**
   * Loads request log entries
   */
  private loadRequestLogs(): void {
    this.isLoading = true;
    this.serviceRequestService.getRequestLog().subscribe({
      next: (logs) => {
        this.requestLogs = logs;
        this.filteredLogs = logs;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load request logs:', error);
        this.isLoading = false;
      },
    });
  }

  /**
   * Filters logs by status
   */
  filterByStatus(status: RequestStatus | 'all'): void {
    this.selectedStatus = status;
    if (status === 'all') {
      this.filteredLogs = [...this.requestLogs];
    } else {
      this.filteredLogs = this.requestLogs.filter((r) => r.status === status);
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
      [RequestStatus.CANCELLED]: 'status-closed',
    };
    return classes[status] || '';
  }

  /**
   * Gets status label
   */
  getStatusLabel(status: RequestStatus): string {
    const labelKeys: Record<RequestStatus, string> = {
      [RequestStatus.DRAFT]: 'requestLog.draft',
      [RequestStatus.SUBMITTED]: 'requestLog.submitted',
      [RequestStatus.IN_REVIEW]: 'requestLog.inReview',
      [RequestStatus.APPROVED]: 'requestLog.approved',
      [RequestStatus.REJECTED]: 'requestLog.rejected',
      [RequestStatus.IN_PROGRESS]: 'requestLog.inProgress',
      [RequestStatus.COMPLETED]: 'requestLog.completed',
      [RequestStatus.CANCELLED]: 'requestLog.closed',
    };
    const key = labelKeys[status];
    return key ? this.translateService.instant(key) : status;
  }

  /**
   * Formats date in Arabic format (DD/MM/YYYY)
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  }

  /**
   * Gets applicant name (prioritizes Arabic if available and language is Arabic)
   */
  getApplicantName(entry: RequestLogEntry): string {
    const currentLang = this.translateService.currentLang || 'en';
    if (currentLang === 'ar' && entry.applicantNameAr) {
      return entry.applicantNameAr;
    }
    return entry.applicantName;
  }

  /**
   * Gets service name (translated if available)
   */
  getServiceName(entry: RequestLogEntry): string {
    const currentLang = this.translateService.currentLang || 'en';
    // Check if entry has Arabic name and we're in Arabic mode
    if (currentLang === 'ar' && (entry as any).serviceNameAr) {
      return (entry as any).serviceNameAr;
    }
    return entry.serviceName;
  }

  /**
   * Views request details
   */
  viewRequest(request: RequestLogEntry): void {
    this.router.navigate(['/service-requests/view', request.id]);
  }

  /**
   * Gets count for a status
   */
  getStatusCount(status: RequestStatus): number {
    return this.requestLogs.filter((r) => r.status === status).length;
  }
}
