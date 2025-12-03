import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { buildNav, RAW_NAV_ITEMS, FEATURE_FLAGS } from './app-navigation.config';
import { INavItem } from './models/nav.types';
import { TranslatePipe } from "@shared/pipes-directives/translate.pipe";
import { AppStateService } from '../../core/services/state/app-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styles: [`
    .modern-sidebar {
      @apply h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 relative;
      width: 16rem; /* 256px */
      flex-shrink: 0;
      transition: width 0.2s ease-out;
      will-change: width;
    }

    .modern-sidebar.collapsed {
      width: 4rem; /* 64px */
    }

    .sidebar-nav {
      @apply p-3;
    }

    .nav-list {
      @apply space-y-1;
    }

    .nav-item {
      @apply block;
    }

    .nav-link {
      @apply flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all;
      white-space: nowrap;
      overflow: hidden;

      &:hover {
        @apply text-gray-900 dark:text-white;
      }
    }

    .modern-sidebar.collapsed .nav-link {
      @apply justify-center px-2;
    }

    .nav-link-active {
      @apply bg-gradient-to-r from-[#8B1538] to-[#A01D45] text-white;
      box-shadow: 0 4px 6px -1px rgba(139, 21, 56, 0.1);

      &:hover {
        @apply text-white;
      }
    }

    .nav-icon {
      @apply w-5 h-5 flex-shrink-0;
    }

    .nav-text {
      @apply flex-1 transition-opacity duration-300;
      opacity: 1;
    }

    .modern-sidebar.collapsed .nav-text {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }

    .nav-badge {
      @apply ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold transition-opacity duration-300;
      opacity: 1;
    }

    .modern-sidebar.collapsed .nav-badge {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }

    .nav-group {
      @apply mt-6 transition-opacity duration-300;
      opacity: 1;
    }

    .modern-sidebar.collapsed .nav-group {
      opacity: 0;
      height: 0;
      overflow: hidden;
      margin: 0;
    }

    .nav-group-title {
      @apply px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-opacity duration-300;
      opacity: 1;
    }

    .modern-sidebar.collapsed .nav-group-title {
      opacity: 0;
      height: 0;
      overflow: hidden;
      padding: 0;
    }

    .nav-sublist {
      @apply mt-1 space-y-1 ml-2 pl-4 border-l-2 border-gray-100 dark:border-gray-800;
    }

    .nav-sublink {
      @apply py-2;
    }

    .sidebar-toggle-btn {
      @apply absolute -right-3 top-4 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10 cursor-pointer;
      @apply hover:bg-gray-50 dark:hover:bg-gray-700;
    }
    
    .modern-sidebar.collapsed .sidebar-toggle-btn {
      @apply -right-3;
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  private translateService = inject(TranslateService);
  private appState = inject(AppStateService);
  private subscription: Subscription | null = null;
  private stateSubscription: Subscription | null = null;

  // Replace with roles from your auth store/service
  private userRoles = signal<string[]>(['admin']);

  nav = computed<INavItem[]>(() => buildNav(RAW_NAV_ITEMS, FEATURE_FLAGS, this.userRoles()));

  isCollapsed = signal(false);

  forceUpdate = 0;

  ngOnInit(): void {
    // Initialize collapsed state
    this.isCollapsed.set(this.appState.getState().sidebarCollapsed);

    // Subscribe to state changes
    this.stateSubscription = this.appState.state$.subscribe(state => {
      this.isCollapsed.set(state.sidebarCollapsed);
    });

    // Subscribe to language changes
    this.subscription = this.translateService.onLangChange.subscribe(() => {
      this.forceUpdate++;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
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
