import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme/theme.service';
import { AppStateService } from '../../core/services/state/app-state.service';
import { LanguageSwitcherComponent } from '@shared/ui/language-switcher/language-switcher.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

/**
 * Header component
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent, TranslatePipe],
  template: `
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div class="flex items-center justify-between px-6 py-3">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ 'app.title' | t }}
          </h1>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- Language Switcher -->
          <app-language-switcher></app-language-switcher>
          
          <!-- Theme Toggle -->
          <button
            (click)="toggleTheme()"
            class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            [attr.aria-label]="'Toggle theme'"
            type="button"
          >
            <svg *ngIf="currentTheme === 'light' || currentTheme === 'auto'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <svg *ngIf="currentTheme === 'dark'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly appState = inject(AppStateService);
  private readonly translateService = inject(TranslateService);
  private subscription: Subscription | null = null;
  
  // Force change detection flag
  forceUpdate = 0;
  
  get currentTheme(): 'light' | 'dark' | 'auto' {
    return this.appState.getState().theme;
  }

  ngOnInit(): void {
    // Subscribe to language changes to force update
    this.subscription = this.translateService.onLangChange.subscribe(() => {
      this.forceUpdate++;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
