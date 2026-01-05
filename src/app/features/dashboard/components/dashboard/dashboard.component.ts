import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from '@core/services/i18n/i18n.service';
import { DOCUMENT } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';

/**
 * Dashboard component - Real Estate Indicators
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly translateService = inject(TranslateService);
  private readonly i18nService = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private langChangeSubscription?: Subscription;
  private routerSubscription?: Subscription;

  isRTL = signal(this.i18nService.isRTL());
  currentYear = new Date().getFullYear();
  selectedFilter = 'sales';

  ngOnInit(): void {
    // Subscribe to language changes to update RTL state
    this.langChangeSubscription = this.translateService.onLangChange.subscribe(() => {
      this.updateRTLState();
    });

    // Subscribe to route changes to update RTL state
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
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

  /**
   * Selects a filter
   */
  selectFilter(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedFilter = target.value;
    // TODO: Implement filter logic
  }
}
