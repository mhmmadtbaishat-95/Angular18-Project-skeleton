import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Service, ServiceCategory } from '../../models/service.model';
import { ServiceRequestService } from '../../services/service-request.service';
import { SkeletonLoaderComponent } from '@shared/ui/skeleton-loader/skeleton-loader.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';

/**
 * Service catalog component
 * Displays available services for citizens to request
 */
@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SkeletonLoaderComponent, TranslatePipe],
  templateUrl: './service-catalog.component.html',
  styleUrls: ['./service-catalog.component.scss']
})
export class ServiceCatalogComponent implements OnInit {
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  services: Service[] = [];
  filteredServices: Service[] = [];
  selectedCategory: ServiceCategory | 'all' = 'all';
  searchQuery: string = '';
  isLoading = true;

  categories = [
    { value: 'all' as const, labelKey: 'catalog.all' },
    { value: ServiceCategory.COMMERCIAL, labelKey: 'catalog.commercial' },
    { value: ServiceCategory.INDUSTRIAL, labelKey: 'catalog.industrial' },
    { value: ServiceCategory.TRADE, labelKey: 'catalog.trade' },
    { value: ServiceCategory.INVESTMENT, labelKey: 'catalog.investment' },
    { value: ServiceCategory.INTELLECTUAL_PROPERTY, labelKey: 'catalog.intellectualProperty' },
    { value: ServiceCategory.CONSUMER_PROTECTION, labelKey: 'catalog.consumerProtection' }
  ];

  ngOnInit(): void {
    this.loadServices();
  }

  /**
   * Loads available services
   */
  private loadServices(): void {
    this.isLoading = true;
    this.serviceRequestService.getAvailableServices().subscribe({
      next: (services) => {
        this.services = services;
        this.filteredServices = services;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load services:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Filters services by category
   */
  filterByCategory(category: ServiceCategory | 'all'): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  /**
   * Filters services by search query
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Applies all filters
   */
  private applyFilters(): void {
    let filtered = [...this.services];

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      const currentLang = this.translateService.currentLang || 'en';
      filtered = filtered.filter(s => {
        const name = currentLang === 'ar' && s.nameAr ? s.nameAr : s.name;
        const description = currentLang === 'ar' && s.descriptionAr ? s.descriptionAr : s.description;
        return name.toLowerCase().includes(query) ||
               description.toLowerCase().includes(query) ||
               s.code.toLowerCase().includes(query);
      });
    }

    this.filteredServices = filtered;
  }

  /**
   * Navigates to service detail page
   */
  requestService(service: Service): void {
    this.router.navigate(['/service-requests/service', service.id]);
  }

  /**
   * Gets category icon
   */
  getCategoryIcon(category: ServiceCategory | 'all'): string {
    if (category === 'all') {
      return '📋';
    }
    const icons: Record<ServiceCategory, string> = {
      [ServiceCategory.COMMERCIAL]: '🏢',
      [ServiceCategory.INDUSTRIAL]: '🏭',
      [ServiceCategory.TRADE]: '📦',
      [ServiceCategory.INVESTMENT]: '💼',
      [ServiceCategory.INTELLECTUAL_PROPERTY]: '📄',
      [ServiceCategory.CONSUMER_PROTECTION]: '🛡️'
    };
    return icons[category] || '📋';
  }

  /**
   * Gets translated service name
   */
  getServiceName(service: Service): string {
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'ar' && service.nameAr ? service.nameAr : service.name;
  }

  /**
   * Gets translated service description
   */
  getServiceDescription(service: Service): string {
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'ar' && service.descriptionAr ? service.descriptionAr : service.description;
  }

  /**
   * Gets translated processing time
   */
  getProcessingTime(service: Service): string {
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
}

