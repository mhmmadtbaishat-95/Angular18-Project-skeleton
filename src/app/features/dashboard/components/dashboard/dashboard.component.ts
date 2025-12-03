import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';

/**
 * Dashboard component
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private readonly translateService = inject(TranslateService);
  
  items = signal<{ id: number; name: string }[]>([]);
  vm = computed(() => ({ items: this.items() }));

  ngOnInit() {
    this.items.set([{ id: 1, name: 'Dashboard Item 1' }]);
  }

  /**
   * Gets translated service name for activity items
   */
  getServiceName(serviceName: string): string {
    const currentLang = this.translateService.currentLang || 'en';
    
    // Map service names to translation keys
    const serviceNameMap: Record<string, string> = {
      'Commercial License': 'services.commercialLicenseApplication',
      'Trade License Renewal': 'services.tradeLicenseRenewal',
      'Investment Permit': 'services.investmentLicense',
      'Consumer Complaint': 'services.consumerComplaint',
      'Industrial License': 'services.industrialLicense',
      'Trademark Registration': 'services.trademarkRegistration'
    };

    const translationKey = serviceNameMap[serviceName];
    if (translationKey) {
      const translated = this.translateService.instant(translationKey);
      return translated !== translationKey ? translated : serviceName;
    }
    
    return serviceName;
  }
}
