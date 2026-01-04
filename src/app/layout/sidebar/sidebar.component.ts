import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription, filter } from 'rxjs';
import { buildNav, RAW_NAV_ITEMS, FEATURE_FLAGS } from './app-navigation.config';
import { INavItem } from './models/nav.types';
import { TranslatePipe } from "@shared/pipes-directives/translate.pipe";
import { AppStateService } from '../../core/services/state/app-state.service';
import { I18nService } from '../../core/services/i18n/i18n.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styles: [`
    .modern-sidebar {
      @apply h-full relative;
      width: 5rem; /* 80px - just enough for icons */
      flex-shrink: 0;
      transition: width 0.2s ease-out;
      will-change: width;
     
      display: flex;
      flex-direction: column;
    }

    .modern-sidebar.collapsed {
      width: 5rem; /* Keep same width - no collapse for icon-only sidebar */
    }

    .sidebar-header-lines {
      @apply w-full;
      padding-top: 0.5rem;
    }

    .line-blue {
      height: 2px;
      background: #3b82f6;
      width: 100%;
      margin-bottom: 2px;
    }

    .line-purple {
      height: 4px;
      background: #8b5cf6;
      width: 100%;
    }

    :host-context(.rtl) .modern-sidebar {
      
    }

    .modern-sidebar.collapsed {
      width: 4rem; /* 64px */
    }

    .sidebar-nav {
      @apply p-4 flex-1 flex items-center justify-center;
      border-left: 1px solid #FFFFFF26;
    }

    .nav-list {
      @apply space-y-8 flex flex-col items-center;
      width: 100%;
    }

    .nav-item {
      @apply block w-full flex justify-center;
    }

    .nav-link {
      @apply flex items-center justify-center p-3 transition-all;
      background: transparent;
      border: none;
      width: 3rem;
      height: 3rem;
      border-radius: 0.5rem;

      &:hover {
        @apply bg-white/5;
      }
    }


    .nav-icon {
      @apply w-8 h-8 flex-shrink-0;
      color: white;
      transition: color 0.3s ease;
    }

    .nav-link-active .nav-icon {
      color: #D4AF37;
    }

    :host-context(.rtl) .nav-icon {
      transform: scaleX(-1);
    }

    .sidebar-toggle-btn {
      display: none; /* Hide toggle button for icon-only sidebar */
    }

    .sidebar-footer {
      @apply p-4 flex items-center justify-center border-t border-white/20;
      margin-top: auto;
    }

    .person-avatar {
      @apply w-16 h-16;
    }

    .avatar-svg {
      @apply w-full h-full;
    }

    :host-context(.rtl) .sidebar-toggle-btn {
      right: auto;
      left: -0.75rem;
    }

    .modern-sidebar.collapsed .sidebar-toggle-btn {
      @apply -right-3;
    }

    :host-context(.rtl) .modern-sidebar.collapsed .sidebar-toggle-btn {
      right: auto;
      left: -0.75rem;
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  private translateService = inject(TranslateService);
  private appState = inject(AppStateService);
  private i18nService = inject(I18nService);
  private router = inject(Router);
  private subscription: Subscription | null = null;
  private stateSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  // Replace with roles from your auth store/service
  private userRoles = signal<string[]>(['admin']);

  nav = computed<INavItem[]>(() => buildNav(RAW_NAV_ITEMS, FEATURE_FLAGS, this.userRoles()));

  isCollapsed = signal(false);
  isRTL = computed(() => this.i18nService.isRTL());
  hasActiveRoute = signal(false);

  forceUpdate = 0;

  ngOnInit(): void {
    // Initialize collapsed state
    this.isCollapsed.set(this.appState.getState().sidebarCollapsed);

    // Check initial route
    this.checkActiveRoute();

    // Subscribe to state changes
    this.stateSubscription = this.appState.state$.subscribe(state => {
      this.isCollapsed.set(state.sidebarCollapsed);
    });

    // Subscribe to router events to detect active routes
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkActiveRoute();
    });

    // Subscribe to language changes
    this.subscription = this.translateService.onLangChange.subscribe(() => {
      this.forceUpdate++;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  checkActiveRoute(): void {
    const url = this.router.url;
    // Check if current route is not the home page (any route that's not just '/')
    const isActive = url !== '/' && !url.startsWith('/auth');
    this.hasActiveRoute.set(isActive);
    
    // Apply blur to background video when any sidebar item is selected
    const video = document.querySelector('.background-video') as HTMLElement;
    if (video) {
      if (isActive) {
        video.style.filter = 'blur(10px)';
      } else {
        video.style.filter = 'none';
      }
    }
  }

  toggleSidebar(): void {
    this.appState.toggleSidebar();
  }

  trackById = (_: number, item: INavItem) => item.id;

  badgeClass(variant: string | undefined) {
    switch (variant) {
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'danger': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
    }
  }
}
