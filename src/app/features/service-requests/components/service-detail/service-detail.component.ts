import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Service } from '../../models/service.model';
import { ServiceRequestService } from '../../services/service-request.service';
import { SkeletonLoaderComponent } from '@shared/ui/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';

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
export class ServiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly translateService = inject(TranslateService);

  service: Service | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const serviceId = params['id'];
      this.loadService(serviceId);
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
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load service:', error);
        this.isLoading = false;
      }
    });
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
    const processingTime = currentLang === 'ar' && service.estimatedProcessingTimeAr 
      ? service.estimatedProcessingTimeAr 
      : service.estimatedProcessingTime;
    
    // Replace "business days" with translated version if not already translated
    if (currentLang === 'ar' && !service.estimatedProcessingTimeAr) {
      return processingTime.replace(/business days/gi, this.translateService.instant('common.businessDays'));
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

