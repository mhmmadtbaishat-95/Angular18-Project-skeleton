import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, NavigationEnd } from '@angular/router';
import { ServiceRequest, RequestStatus, Service } from '../../models/service.model';
import { ServiceRequestService } from '../../services/service-request.service';
import { SkeletonLoaderComponent } from '@shared/ui/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '@core/services/i18n/i18n.service';
import { Subscription, filter } from 'rxjs';

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
export class RequestDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly translateService = inject(TranslateService);
  private readonly i18nService = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private langChangeSubscription?: Subscription;
  private routerSubscription?: Subscription;

  request: ServiceRequest | null = null;
  service: Service | null = null;
  isLoading = false;
  isServiceDetailView = false;
  serviceId: string = '';
  isRTL = signal(this.i18nService.isRTL());

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
      const requestId = params['id'];
      this.route.queryParams.subscribe(queryParams => {
        if (queryParams['serviceId']) {
          this.isServiceDetailView = true;
          this.serviceId = queryParams['serviceId'];
          this.loadService(this.serviceId);
        } else {
          this.isServiceDetailView = false;
          this.loadRequest(requestId);
        }
      });
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
   * Loads service details
   */
  private loadService(serviceId: string): void {
    this.isLoading = true;
    this.serviceRequestService.getAvailableServices().subscribe({
      next: (services) => {
        this.service = services.find(s => s.id === serviceId) || null;
        // If service not found, create a mock service based on ID
        if (!this.service && serviceId >= '1' && serviceId <= '8') {
          this.service = {
            id: serviceId,
            name: this.translateService.instant(`services.service${serviceId}.title`),
            nameAr: this.translateService.instant(`services.service${serviceId}.title`),
            description: this.translateService.instant(`services.service${serviceId}.description`),
            descriptionAr: this.translateService.instant(`services.service${serviceId}.description`),
            code: `SRV-${serviceId}`,
            category: 'commercial' as any,
            fee: 1000,
            currency: 'QAR',
            estimatedProcessingTime: 'One working day',
            estimatedProcessingTimeAr: 'يوم عمل واحد',
            formId: 'default-form',
            requiredDocuments: [],
            eligibilityCriteria: [],
            active: true
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load service:', error);
        // Create mock service based on ID
        if (this.serviceId >= '1' && this.serviceId <= '8') {
          this.service = {
            id: this.serviceId,
            name: this.translateService.instant(`services.service${this.serviceId}.title`),
            nameAr: this.translateService.instant(`services.service${this.serviceId}.title`),
            description: this.translateService.instant(`services.service${this.serviceId}.description`),
            descriptionAr: this.translateService.instant(`services.service${this.serviceId}.description`),
            code: `SRV-${this.serviceId}`,
            category: 'commercial' as any,
            fee: 1000,
            currency: 'QAR',
            estimatedProcessingTime: 'One working day',
            estimatedProcessingTimeAr: 'يوم عمل واحد',
            formId: 'default-form',
            requiredDocuments: [],
            eligibilityCriteria: [],
            active: true
          };
        }
        this.isLoading = false;
      }
    });
  }

  /**
   * Gets translated service name
   */
  getServiceName(service: Service | null): string {
    if (!service) return '';
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'ar' && service.nameAr ? service.nameAr : service.name;
  }

  /**
   * Gets translated service description
   */
  getServiceDescription(service: Service | null): string {
    if (!service) return '';
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'ar' && service.descriptionAr ? service.descriptionAr : service.description;
  }

  /**
   * Gets translated processing time
   */
  getProcessingTime(service: Service | null): string {
    if (!service) return '';
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'ar' && service.estimatedProcessingTimeAr 
      ? service.estimatedProcessingTimeAr 
      : service.estimatedProcessingTime;
  }

  /**
   * Gets required documents translation keys
   */
  getRequiredDocuments(): string[] {
    const documentMap: Record<string, string> = {
      'Valid QID (Qatar ID)': 'serviceDetail.documents.validQid',
      'Trade License (if applicable)': 'serviceDetail.documents.tradeLicense',
      'Company Registration Certificate': 'serviceDetail.documents.companyRegistration',
      'Memorandum of Association': 'serviceDetail.documents.memorandumOfAssociation',
      'Power of Attorney (if applicable)': 'serviceDetail.documents.powerOfAttorney'
    };

    const defaultDocs = [
      'Valid QID (Qatar ID)',
      'Trade License (if applicable)',
      'Company Registration Certificate',
      'Memorandum of Association',
      'Power of Attorney (if applicable)'
    ];

    if (this.service?.requiredDocuments?.length) {
      return this.service.requiredDocuments.map(doc => documentMap[doc] || doc);
    }

    return defaultDocs.map(doc => documentMap[doc] || doc);
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
    const currentLang = this.translateService.currentLang || 'en';
    const formatted = new Intl.NumberFormat(currentLang === 'ar' ? 'ar-QA' : 'en-US', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 0
    }).format(amount);
    
    // Replace QAR with translated version
    if (currentLang === 'ar') {
      return formatted.replace('QAR', this.translateService.instant('common.currency.qar'));
    }
    
    return formatted;
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
   * Gets translated service name from string (for request view)
   */
  getServiceNameFromString(serviceName: string): string {
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

