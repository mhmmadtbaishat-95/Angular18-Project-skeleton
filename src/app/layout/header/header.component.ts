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
    <header class="modern-header">
      <div class="header-container">
        <!-- Left Side: Sidebar Toggle, Logo and Title -->
        <div class="header-brand">
          <button 
            (click)="toggleSidebar()" 
            class="sidebar-toggle-btn"
            [attr.aria-label]="'header.toggleSidebar' | t"
            [title]="'header.toggleSidebar' | t"
            type="button"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div class="brand-logo">
            <img
              src="https://www.moci.gov.qa/wp-content/themes/2018_mec_v1/assets/images/logo-main.svg"
              alt="MOCI Logo"
              class="logo-image"
            />
          </div>
        </div>

        <!-- Right Side: Actions -->
        <div class="header-actions">
          <!-- Language Switcher -->
          <app-language-switcher></app-language-switcher>

          <!-- Theme Toggle -->
          <button
            (click)="toggleTheme()"
            class="action-btn theme-toggle-btn"
            [attr.aria-label]="'header.toggleTheme' | t"
            [title]="'header.toggleTheme' | t"
            type="button"
          >
            <svg *ngIf="currentTheme === 'light' || currentTheme === 'auto'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <svg *ngIf="currentTheme === 'dark'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </button>

          <!-- Notifications Dropdown -->
          <div class="dropdown-container">
            <button 
              (click)="toggleNotifications()" 
              class="action-btn notification-btn" 
              [title]="'header.notifications' | t"
              type="button"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span class="notification-badge">3</span>
            </button>
            <div *ngIf="showNotifications" class="dropdown-menu notification-dropdown">
              <div class="dropdown-header">
                <h3 class="dropdown-title">{{ 'header.notifications' | t }}</h3>
                <button class="dropdown-action">{{ 'header.markAllAsRead' | t }}</button>
              </div>
              <div class="dropdown-content">
                <div class="notification-item">
                  <div class="notification-icon bg-blue-100 dark:bg-blue-900/30">
                    <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div class="notification-content">
                    <p class="notification-text">{{ 'header.newServiceRequestSubmitted' | t }}</p>
                    <p class="notification-time">{{ 'header.minutesAgo' | t: {count: 2} }}</p>
                  </div>
                </div>
                <div class="notification-item">
                  <div class="notification-icon bg-green-100 dark:bg-green-900/30">
                    <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div class="notification-content">
                    <p class="notification-text">{{ 'header.requestApprovedSuccessfully' | t }}</p>
                    <p class="notification-time">{{ 'header.hourAgo' | t: {count: 1} }}</p>
                  </div>
                </div>
                <div class="notification-item">
                  <div class="notification-icon bg-yellow-100 dark:bg-yellow-900/30">
                    <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  </div>
                  <div class="notification-content">
                    <p class="notification-text">{{ 'header.actionRequiredOnApplication' | t }}</p>
                    <p class="notification-time">{{ 'header.hoursAgo' | t: {count: 3} }}</p>
                  </div>
                </div>
              </div>
              <div class="dropdown-footer">
                <a href="#" class="dropdown-link">{{ 'header.viewAllNotifications' | t }}</a>
              </div>
            </div>
          </div>

          <!-- Profile Dropdown -->
          <div class="dropdown-container">
            <button 
              (click)="toggleProfileMenu()" 
              class="profile-btn" 
              [title]="'header.profile' | t"
              type="button"
            >
              <img
                src="https://ui-avatars.com/api/?name=User+Profile&background=8B1538&color=fff&size=128"
                [alt]="'header.profile' | t"
                class="profile-avatar"
              />
              <div class="profile-info">
                <span class="profile-name">{{ 'header.profile' | t }}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </button>
            <div *ngIf="showProfileMenu" class="dropdown-menu profile-dropdown">
              <div class="dropdown-header profile-header">
                <div class="profile-header-info">
                  <img
                    src="https://ui-avatars.com/api/?name=User+Profile&background=8B1538&color=fff&size=128"
                    [alt]="'header.profile' | t"
                    class="profile-header-avatar"
                  />
                  <div>
                    <p class="profile-header-name">{{ 'header.profile' | t }}</p>
                    <p class="profile-header-email">Mohammad Tubishat</p>
                  </div>
                </div>
              </div>
              <div class="dropdown-content">
                <a href="#" class="dropdown-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>{{ 'header.myProfile' | t }}</span>
                </a>
                <a href="#" class="dropdown-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>{{ 'header.settings' | t }}</span>
                </a>
                <a href="#" class="dropdown-item">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>{{ 'header.helpSupport' | t }}</span>
                </a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item text-red-600 dark:text-red-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  <span>{{ 'header.signOut' | t }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Click outside to close dropdowns -->
      <div *ngIf="showNotifications || showProfileMenu" class="dropdown-overlay" (click)="closeDropdowns()"></div>
    </header>
  `,
  styles: [`
    .modern-header {
      @apply bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      position: relative;
    }

    .header-container {
      @apply flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 max-w-full mx-auto;
    }

    .header-brand {
      @apply flex items-center gap-3;
    }

    .sidebar-toggle-btn {
      @apply p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
    }

    .brand-logo {
      @apply flex-shrink-0;
    }

    .logo-image {
      height: 48px;
      width: auto;
      @apply dark:brightness-0 dark:invert;
    }

    .header-actions {
      @apply flex items-center gap-2 relative;
    }

    .action-btn {
      @apply relative p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
    }

    .notification-btn {
      @apply relative;
    }

    .notification-badge {
      @apply absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center;
      font-size: 10px;
    }

    .profile-btn {
      @apply flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors;
    }

    .profile-avatar {
      @apply w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700;
    }

    .profile-info {
      @apply hidden md:flex items-center gap-2;
    }

    .profile-name {
      @apply text-sm font-medium text-gray-900 dark:text-white;
    }

    /* Dropdown Styles */
    .dropdown-container {
      @apply relative;
    }

    .dropdown-overlay {
      @apply fixed inset-0 z-40;
      background: transparent;
    }

    .dropdown-menu {
      @apply absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50;
      @apply transition-opacity duration-150 ease-out;
      max-height: 24rem;
      overflow-y: auto;
    }

    .notification-dropdown {
      @apply w-80;
    }

    .profile-dropdown {
      @apply w-64;
    }

    .dropdown-header {
      @apply px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between;
    }

    .dropdown-title {
      @apply text-sm font-semibold text-gray-900 dark:text-white;
    }

    .dropdown-action {
      @apply text-xs text-qatar-maroon hover:text-qatar-maroon-light font-medium;
    }

    .profile-header {
      @apply flex-col items-start;
    }

    .profile-header-info {
      @apply flex items-center gap-3 w-full;
    }

    .profile-header-avatar {
      @apply w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700;
    }

    .profile-header-name {
      @apply text-sm font-semibold text-gray-900 dark:text-white;
    }

    .profile-header-email {
      @apply text-xs text-gray-600 dark:text-gray-400;
    }

    .dropdown-content {
      @apply py-2;
    }

    .notification-item {
      @apply flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer;
    }

    .notification-icon {
      @apply w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0;
    }

    .notification-content {
      @apply flex-1 min-w-0;
    }

    .notification-text {
      @apply text-sm text-gray-900 dark:text-white font-medium;
    }

    .notification-time {
      @apply text-xs text-gray-500 dark:text-gray-400 mt-1;
    }

    .dropdown-item {
      @apply flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors;
    }

    .dropdown-divider {
      @apply my-1 border-t border-gray-200 dark:border-gray-700;
    }

    .dropdown-footer {
      @apply px-4 py-3 border-t border-gray-200 dark:border-gray-700;
    }

    .dropdown-link {
      @apply text-sm text-qatar-maroon hover:text-qatar-maroon-light font-medium;
    }

  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly appState = inject(AppStateService);
  private readonly translateService = inject(TranslateService);
  private subscription: Subscription | null = null;
  
  // Force change detection flag
  forceUpdate = 0;
  
  // Dropdown states
  showNotifications = false;
  showProfileMenu = false;
  
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

  toggleSidebar(): void {
    this.appState.toggleSidebar();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  closeDropdowns(): void {
    this.showNotifications = false;
    this.showProfileMenu = false;
  }
}
