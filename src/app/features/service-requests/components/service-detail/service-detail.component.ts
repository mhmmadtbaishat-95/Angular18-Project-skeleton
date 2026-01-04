import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, NavigationEnd } from '@angular/router';
import { Service } from '../../models/service.model';
import { ServiceRequestService } from '../../services/service-request.service';
import { SkeletonLoaderComponent } from '@shared/ui/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '@core/services/i18n/i18n.service';
import { Subscription, filter } from 'rxjs';

/**
 * Service detail component
 * Shows detailed information about a service including requirements, fees, and application steps
 */
@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent, TranslatePipe],
  templateUrl: './service-detail.component.html',
  styleUrls: ['./service-detail.component.scss']
})
export class ServiceDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly translateService = inject(TranslateService);
  private readonly i18nService = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private langChangeSubscription?: Subscription;
  private routerSubscription?: Subscription;

  service: Service | null = null;
  serviceId: string = '';
  isLoading = false;
  selectedFilter: string = 'all';
  isRTL = signal(this.i18nService.isRTL());

  filters = [
    { id: 'all', labelKey: 'serviceDetail.filters.all', count: 0 },
    { id: 'new', labelKey: 'serviceDetail.filters.newRequests', count: 0 },
    { id: 'renewal', labelKey: 'serviceDetail.filters.renewal', count: 0 },
    { id: 'modification', labelKey: 'serviceDetail.filters.modification', count: 0 },
    { id: 'termination', labelKey: 'serviceDetail.filters.termination', count: 0 }
  ];

  requests: any[] = [];

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
      this.serviceId = params['id'];
      this.loadService(this.serviceId);
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
   * Loads service details and generates requests
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
            fee: 100,
            currency: 'QAR',
            estimatedProcessingTime: '5-7 business days',
            estimatedProcessingTimeAr: '5-7 أيام عمل',
            formId: 'default-form',
            requiredDocuments: [],
            eligibilityCriteria: [],
            active: true
          };
        }
        this.generateRequests();
        this.updateFilterCounts();
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
            fee: 100,
            currency: 'QAR',
            estimatedProcessingTime: '5-7 business days',
            estimatedProcessingTimeAr: '5-7 أيام عمل',
            formId: 'default-form',
            requiredDocuments: [],
            eligibilityCriteria: [],
            active: true
          };
        }
        this.generateRequests();
        this.updateFilterCounts();
        this.isLoading = false;
      }
    });
  }

  /**
   * Generates requests based on the selected service
   */
  private generateRequests(): void {
    // Generate requests based on service ID
    // For service 1 (Real Estate Developer Licensing), show all 4 request types
    const baseRequests = [
      { 
        id: `${this.serviceId}-1`, 
        type: 'new', 
        action: 'termination', 
        actionKey: 'serviceDetail.request.termination', 
        titleKey: 'serviceDetail.requests.registration' 
      },
      { 
        id: `${this.serviceId}-2`, 
        type: 'new', 
        action: 'termination', 
        actionKey: 'serviceDetail.request.termination', 
        titleKey: 'serviceDetail.requests.renewal' 
      },
      { 
        id: `${this.serviceId}-3`, 
        type: 'new', 
        action: 'termination', 
        actionKey: 'serviceDetail.request.termination', 
        titleKey: 'serviceDetail.requests.modification' 
      },
      { 
        id: `${this.serviceId}-4`, 
        type: 'new', 
        action: 'termination', 
        actionKey: 'serviceDetail.request.termination', 
        titleKey: 'serviceDetail.requests.termination' 
      }
    ];

    // Add more requests based on service type
    // For now, all services show the same 4 requests
    this.requests = [...baseRequests];
  }

  /**
   * Updates filter counts based on requests
   */
  private updateFilterCounts(): void {
    this.filters[0].count = this.requests.length; // All
    this.filters[1].count = this.requests.filter(r => r.type === 'new').length; // New
    this.filters[2].count = this.requests.filter(r => r.titleKey.includes('renewal')).length; // Renewal
    this.filters[3].count = this.requests.filter(r => r.titleKey.includes('modification')).length; // Modification
    this.filters[4].count = this.requests.filter(r => r.titleKey.includes('termination')).length; // Termination
  }

  /**
   * Starts service request
   */
  startRequest(): void {
    if (this.service) {
      this.router.navigate(['/service-requests/request', this.service.formId], {
        queryParams: { serviceId: this.service.id }
      });
    }
  }

  /**
   * Filters requests by type
   */
  filterRequests(filterId: string): void {
    this.selectedFilter = filterId;
  }

  /**
   * Gets filtered requests
   */
  getFilteredRequests() {
    if (this.selectedFilter === 'all') {
      return this.requests;
    }
    return this.requests.filter(r => r.type === this.selectedFilter || r.action === this.selectedFilter);
  }

  /**
   * Navigates to request details
   */
  viewDetails(requestId: string): void {
    // Navigate to request details page with service ID
    this.router.navigate(['/service-requests/view', requestId], {
      queryParams: { serviceId: this.serviceId }
    });
  }

  /**
   * Submits a request
   */
  submitRequest(requestId: string): void {
    // Navigate to submit request page
    this.router.navigate(['/service-requests/request', requestId]);
  }


  /**
   * Gets category icon
   */
  getCategoryIcon(category: any): string {
    const icons: Record<string, string> = {
      'commercial': '🏢',
      'industrial': '🏭',
      'trade': '📦',
      'investment': '💼',
      'intellectual_property': '📄',
      'consumer_protection': '🛡️'
    };
    return icons[category] || '📋';
  }

  /**
   * Gets required documents translation keys
   */
  getRequiredDocuments(): string[] {
    // Map of document keys to translation keys
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

    // If service has documents, return translation keys, otherwise return default keys
    if (this.service?.requiredDocuments?.length) {
      return this.service.requiredDocuments.map(doc => documentMap[doc] || doc);
    }

    return defaultDocs.map(doc => documentMap[doc] || doc);
  }

  /**
   * Gets eligibility criteria
   */
  getEligibilityCriteria(): string[] {
    return this.service?.eligibilityCriteria || [
      'Qatari citizens',
      'GCC nationals',
      'Foreign investors with valid permits',
      'Registered companies in Qatar',
      'Legal entities authorized to conduct business'
    ];
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
    let processingTime = currentLang === 'ar' && service.estimatedProcessingTimeAr 
      ? service.estimatedProcessingTimeAr 
      : service.estimatedProcessingTime;
    
    // Replace "business days" with translated version
    if (currentLang === 'ar') {
      processingTime = processingTime.replace(/business days/gi, this.translateService.instant('common.businessDays'));
    }
    
    return processingTime;
  }

  /**
   * Gets translated currency
   */
  getCurrency(currency: string = 'QAR'): string {
    const currentLang = this.translateService.currentLang || 'en';
    if (currency === 'QAR' && currentLang === 'ar') {
      return this.translateService.instant('common.currency.qar');
    }
    return currency;
  }

  /**
   * Formats currency with translation
   */
  formatCurrency(amount: number, currency: string = 'QAR'): string {
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
}

