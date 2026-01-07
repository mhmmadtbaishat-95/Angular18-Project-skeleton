import { Component, inject, OnInit, OnDestroy, computed, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme/theme.service';
import { AppStateService } from '../../core/services/state/app-state.service';
import { LanguageSwitcherComponent } from '@shared/ui/language-switcher/language-switcher.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';
import { ClickOutsideDirective } from '@shared/pipes-directives/click-outside.directive';

/**
 * Header component
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, LanguageSwitcherComponent, TranslatePipe, ClickOutsideDirective],
  template: `
    <header class="auth-header">
      <div class="header-container">
        <!-- Left Side: Logo and Navigation Links -->
        <div class="header-left">
          <div class="header-brand">
            <div class="brand-logo-icon">
              <img 
                src="assets/logo.png" 
                alt="AQARAT"
                class="logo-image"
              />
            </div>
          </div>
          <nav class="header-nav">
            <a href="#" class="nav-link">{{ 'header.mainWebsite' | t }}</a>
            <a href="#" class="nav-link">{{ 'header.inquiryByCadastral' | t }}</a>
            <a href="#" class="nav-link">{{ 'header.inquiryByAddress' | t }}</a>
          </nav>
        </div>

        <!-- Right Side: Login Button and Icons (CTAs) -->
        <div class="header-right">
          <app-language-switcher></app-language-switcher>
          <div class="header-icons">
            <button class="icon-btn" type="button" aria-label="Contact">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            <button class="icon-btn" type="button" aria-label="Email">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </button>
            <button class="icon-btn" type="button" aria-label="Search">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            
            <!-- Authenticated: Profile Dropdown -->
            <div *ngIf="isAuthenticated()" class="profile-dropdown-container" (clickOutside)="closeProfileDropdown()">
              <button 
                class="profile-btn" 
                type="button" 
                (click)="toggleProfileDropdown()"
                [attr.aria-label]="'Profile menu'"
                [attr.aria-expanded]="isProfileDropdownOpen()"
              >
                <div class="profile-avatar">
                  <i class="fas fa-user" aria-hidden="true"></i>
                </div>
                <span class="profile-name">{{ getDisplayName() }}</span>
                <i class="fas fa-chevron-down profile-chevron" [class.rotated]="isProfileDropdownOpen()"></i>
              </button>
              
              <div *ngIf="isProfileDropdownOpen()" class="profile-dropdown">
                <div class="profile-dropdown-header">
                  <div class="profile-dropdown-avatar">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="profile-dropdown-info">
                    <div class="profile-dropdown-name">{{ getDisplayName() }}</div>
                    <div class="profile-dropdown-email">{{ getCurrentUserEmail() }}</div>
                  </div>
                </div>
                <div class="profile-dropdown-divider"></div>
                <a routerLink="/profile" class="profile-dropdown-item" (click)="closeProfileDropdown()">
                  <i class="fas fa-user-circle"></i>
                  <span>{{ 'header.profile' | t }}</span>
                </a>
                <a routerLink="/settings" class="profile-dropdown-item" (click)="closeProfileDropdown()">
                  <i class="fas fa-cog"></i>
                  <span>{{ 'header.settings' | t }}</span>
                </a>
                <a href="#" class="profile-dropdown-item" (click)="closeProfileDropdown()">
                  <i class="fas fa-question-circle"></i>
                  <span>{{ 'header.help' | t }}</span>
                </a>
                <div class="profile-dropdown-divider"></div>
                <button class="profile-dropdown-item logout-item" type="button" (click)="onLogout()">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>{{ 'header.signOut' | t }}</span>
                </button>
              </div>
            </div>
            
            <!-- Not Authenticated: Login Button -->
            <button *ngIf="!isAuthenticated()" class="login-btn" routerLink="/auth/login" type="button">
              {{ 'header.login' | t }}
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .auth-header {
      position: relative;
      z-index: 50;
    }

    .header-container {
      @apply flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 max-w-full mx-auto;
      border-bottom: 1px solid #FFFFFF26;
    }

    .header-left {
      @apply flex items-center gap-6;
      justify-content: space-between;
      width: 50%;
    }

    .header-right {
      @apply flex items-center gap-4;
    }

    .login-btn {
      @apply bg-qatar-maroon hover:bg-qatar-maroon-dark text-white font-medium rounded transition-colors;
      padding: 10px;
      font-size: 10px;
    }

    .header-icons {
      @apply flex items-center gap-2;
    }

    .icon-btn {
      @apply p-2 text-gray-300 hover:text-white transition-colors;
    }

    .header-nav {
      @apply hidden lg:flex items-center gap-4;
    }

    .nav-link {
      @apply text-gray-300 hover:text-white  transition-colors;
      white-space: nowrap;
      font-size: 0.7rem;
      font-weight: bold;
    }

    .header-brand {
      @apply flex items-center gap-3;
    }

    .brand-logo-icon {
      @apply flex-shrink-0;
    }

    .logo-image {
      height: 40px;
      width: auto;
      object-fit: contain;
    }

    .brand-text {
      @apply flex flex-col;
    }

    .brand-name {
      @apply text-white text-sm font-medium;
      white-space: nowrap;
    }

    .brand-name-short {
      @apply text-white text-xs;
    }

    /* Profile Dropdown Styles */
    .profile-dropdown-container {
      @apply relative;
    }

    .profile-btn {
      @apply flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all;
      @apply text-white text-sm;
      border: none;
      cursor: pointer;
      min-width: fit-content;
    }

    .profile-avatar {
      @apply w-8 h-8 rounded-full bg-qatar-maroon flex items-center justify-center;
      @apply text-white text-xs font-semibold;
      flex-shrink: 0;
    }
    
    .profile-avatar i {
      font-size: 0.875rem;
      display: block;
    }

    .profile-name {
      @apply hidden md:block;
      font-size: 0.875rem;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .profile-chevron {
      @apply hidden md:block text-xs transition-transform duration-200;
      font-size: 0.625rem;
      margin-left: 0.25rem;
    }
    
    /* Show at least the avatar on mobile */
    @media (max-width: 768px) {
      .profile-btn {
        padding: 0.5rem;
      }
    }

    .profile-chevron.rotated {
      transform: rotate(180deg);
    }

    .profile-dropdown {
      @apply absolute top-full mt-2 right-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl;
      @apply border border-gray-200 dark:border-gray-700 z-50;
      min-width: 240px;
    }

    .profile-dropdown-header {
      @apply flex items-center gap-3 p-4;
    }

    .profile-dropdown-avatar {
      @apply w-12 h-12 rounded-full bg-qatar-maroon flex items-center justify-center;
      @apply text-white text-lg;
      flex-shrink: 0;
    }

    .profile-dropdown-info {
      @apply flex-1 min-w-0;
    }

    .profile-dropdown-name {
      @apply text-gray-900 dark:text-white font-semibold text-sm;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .profile-dropdown-email {
      @apply text-gray-500 dark:text-gray-400 text-xs mt-1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .profile-dropdown-divider {
      @apply border-t border-gray-200 dark:border-gray-700 my-1;
    }

    .profile-dropdown-item {
      @apply flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300;
      @apply hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
      @apply text-sm cursor-pointer;
      text-decoration: none;
      display: flex;
      width: 100%;
      border: none;
      background: none;
    }

    .profile-dropdown-item i {
      @apply w-5 text-center;
      color: #6b7280;
    }

    .profile-dropdown-item:hover i {
      color: #8B1538;
    }

    .logout-item {
      @apply text-red-600 dark:text-red-400;
    }

    .logout-item:hover {
      @apply bg-red-50 dark:bg-red-900/20;
    }

    .logout-item i {
      color: #dc2626;
    }

    /* RTL Support */
    :host-context([dir="rtl"]) {
      .header-container {
      
      }
      
      .profile-dropdown {
        right: auto;
        left: 0;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly appState = inject(AppStateService);
  private readonly translateService = inject(TranslateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  
  // Force change detection flag
  forceUpdate = 0;
  isProfileDropdownOpen = signal(false);
  isAuthenticated = signal(false);
  
  get currentTheme(): 'light' | 'dark' | 'auto' {
    return this.appState.getState().theme;
  }

  ngOnInit(): void {
    // Subscribe to auth state changes FIRST to catch initial state
    this.authSubscription = this.authService.authState$.subscribe((authState) => {
      const wasAuthenticated = this.isAuthenticated();
      this.isAuthenticated.set(authState.isAuthenticated);
      
      // Force change detection
      this.forceUpdate++;
      this.cdr.markForCheck();
      
      // Close dropdown if user logs out
      if (!authState.isAuthenticated && wasAuthenticated) {
        this.isProfileDropdownOpen.set(false);
      }
    });
    
    // Also get initial state immediately (auth service initializes in constructor)
    // Use setTimeout to ensure auth service has finished initializing
    setTimeout(() => {
      const authState = this.authService.getAuthState();
      const currentAuth = this.authService.isAuthenticated();
      if (this.isAuthenticated() !== currentAuth) {
        this.isAuthenticated.set(currentAuth);
        this.cdr.markForCheck();
      }
    }, 0);
    
    // Subscribe to language changes to force update
    this.subscription = this.translateService.onLangChange.subscribe(() => {
      this.forceUpdate++;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen.update(value => !value);
  }

  closeProfileDropdown(): void {
    this.isProfileDropdownOpen.set(false);
  }

  getDisplayName(): string {
    const user = this.authService.getCurrentUser();
    if (user) {
      return `${user.firstName} ${user.lastName}`.trim() || user.username || user.email;
    }
    return 'User';
  }

  getCurrentUserEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || '';
  }

  onLogout(): void {
    this.closeProfileDropdown();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if logout fails, navigate to login
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
