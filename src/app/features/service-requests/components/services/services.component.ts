import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '@core/services/i18n/i18n.service';
import { Subscription, filter } from 'rxjs';

interface ServiceItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  route?: string;
}

/**
 * Services page component
 * Displays the main services grid
 */
@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <div class="services-page" [dir]="isRTL() ? 'rtl' : 'ltr'">
      <!-- Header Section -->
      <div class="services-header">
        <div class="header-content">
          <div class="breadcrumb-nav">
            <a routerLink="/" class="breadcrumb-link">{{ 'services.breadcrumbHome' | t }}</a>
            <span class="breadcrumb-separator">{{ isRTL() ? '>' : '<' }}</span>
            <span class="breadcrumb-current">{{ 'services.breadcrumbServices' | t }}</span>
          </div>
          <div class="title-section">
            <h1 class="page-title">{{ 'services.title' | t }}</h1>
            <button class="refresh-btn" type="button" aria-label="Refresh">
              <svg class="refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Services Grid -->
      <div class="services-grid">
        <div
          *ngFor="let service of services"
          class="service-card"
          [routerLink]="service.route || '#'"
        >
          <div class="service-content">
            <h3 class="service-title">{{ service.titleKey | t }}</h3>
            <p class="service-description">{{ service.descriptionKey | t }}</p>
          </div>
          <div class="service-arrow">
            <i [class]="isRTL() ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .services-page {
      @apply w-full;
      min-height: calc(100vh - 12rem);
    }

    .services-header {
      @apply mb-8;
    }

    .header-content {
      @apply flex flex-col gap-4;
    }

    .breadcrumb-nav {
      @apply flex items-center gap-2 mb-4;
      font-size: 0.75rem;
    }

    .breadcrumb-link {
      @apply text-gray-300 hover:text-white transition-colors;
    }

    .breadcrumb-separator {
      @apply text-gray-400;
    }

    .breadcrumb-current {
      @apply text-white font-medium;
    }

    .title-section {
      @apply flex items-center gap-3;
    }

    .page-title {
      @apply text-2xl md:text-3xl lg:text-4xl font-bold text-white;
      margin: 0;
    }

    .refresh-btn {
      @apply w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all;
      @apply hover:scale-110;
    }

    .refresh-icon {
      @apply w-5 h-5;
    }

    .services-grid {
      @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
    }

    .service-card {
      @apply rounded-xl p-6 border border-gray-700/50;
      @apply hover:bg-gray-800/95 hover:border-gray-600 hover:shadow-xl transition-all cursor-pointer;
      @apply flex flex-col;
      min-height: 190px;
      position: relative;
      backdrop-filter: blur(30px);
background: transparent;
font-size: 10px;
    }

    .service-content {
      @apply flex-1 mb-4;
    }

    .service-title {
      @apply text-white font-semibold mb-2;
      font-size: 0.875rem;
      line-height: 1.4;
      text-align: left;
    }

    .service-description {
      @apply text-gray-300 leading-relaxed;
      font-size: 0.75rem;
      text-align: left;
    }

    .service-arrow {
      @apply absolute bottom-4 left-4;
      @apply w-8 h-8 rounded-full bg-qatar-maroon flex items-center justify-center;
      @apply hover:bg-qatar-maroon-dark transition-all;
      @apply shadow-lg;
      color: white;
      
      i {
        font-size: 0.875rem;
      }
    }

    .arrow-icon {
      @apply w-4 h-4 text-white;
    }

    /* RTL Support */
    .services-page[dir="rtl"],
    [dir="rtl"] .services-page,
    :host-context([dir="rtl"]) .services-page,
    :host-context(.rtl) .services-page {
      direction: rtl !important;
      text-align: right !important;

      .breadcrumb-nav {
       
        text-align: right !important;
        direction: rtl !important;
      }

      .breadcrumb-link,
      .breadcrumb-current {
        text-align: right !important;
        direction: rtl !important;
      }

      .title-section {
       
        text-align: right !important;
        direction: rtl !important;
      }

      .page-title {
        text-align: right !important;
        direction: rtl !important;
      }

      .service-card {
        text-align: right !important;
        direction: rtl !important;
      }

      .service-content {
        text-align: right !important;
        direction: rtl !important;
      }

      .service-title {
        text-align: right !important;
        direction: rtl !important;
      }

      .service-description {
        text-align: right !important;
        direction: rtl !important;
      }

      .service-arrow {
        left: auto !important;
        right: 1rem !important;
      }

      .arrow-icon {
        transform: scaleX(-1);
      }

      .header-content {
        text-align: right !important;
        direction: rtl !important;
      }
    }

    @media (max-width: 1024px) {
      .services-grid {
        @apply grid-cols-2;
      }
    }

    @media (max-width: 768px) {
      .services-grid {
        @apply grid-cols-1;
      }

      .page-title {
        @apply text-xl md:text-2xl;
      }

      .title-section {
        @apply flex-col items-start;
      }

      .service-title {
        font-size: 0.8125rem;
      }

      .service-description {
        font-size: 0.6875rem;
      }
    }
  `]
})
export class ServicesComponent implements OnInit, OnDestroy {
  private i18nService = inject(I18nService);
  private translateService = inject(TranslateService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private langChangeSubscription?: Subscription;
  private routerSubscription?: Subscription;
  
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
  
  services: ServiceItem[] = [
    {
      id: '1',
      titleKey: 'services.service1.title',
      descriptionKey: 'services.service1.description',
      route: '/service-requests/service/1'
    },
    {
      id: '2',
      titleKey: 'services.service2.title',
      descriptionKey: 'services.service2.description',
      route: '/service-requests/service/2'
    },
    {
      id: '3',
      titleKey: 'services.service3.title',
      descriptionKey: 'services.service3.description',
      route: '/service-requests/service/3'
    },
    {
      id: '4',
      titleKey: 'services.service4.title',
      descriptionKey: 'services.service4.description',
      route: '/service-requests/service/4'
    },
    {
      id: '5',
      titleKey: 'services.service5.title',
      descriptionKey: 'services.service5.description',
      route: '/service-requests/service/5'
    },
    {
      id: '6',
      titleKey: 'services.service6.title',
      descriptionKey: 'services.service6.description',
      route: '/service-requests/service/6'
    },
    {
      id: '7',
      titleKey: 'services.service7.title',
      descriptionKey: 'services.service7.description',
      route: '/service-requests/service/7'
    },
    {
      id: '8',
      titleKey: 'services.service8.title',
      descriptionKey: 'services.service8.description',
      route: '/service-requests/service/8'
    }
  ];
}

