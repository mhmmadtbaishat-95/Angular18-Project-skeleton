import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
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
      @apply h-full bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 relative;
      width: 16rem; /* 256px */
      flex-shrink: 0;
      transition: width 0.2s ease-out;
      will-change: width;
    }

    :host-context(.rtl) .modern-sidebar {
      @apply border-r-0 border-l border-l-gray-200 dark:border-l-slate-800;
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
      @apply flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all;
      white-space: nowrap;
      overflow: hidden;

      &:hover {
        @apply text-gray-900 dark:text-slate-100;
      }
    }

    :host-context(.rtl) .nav-link {
      flex-direction: row-reverse;
    }

    .modern-sidebar.collapsed .nav-link {
      @apply justify-center px-2;
    }

    .nav-link-active {
      @apply bg-gradient-to-r from-[#8B1538] to-[#A01D45] text-white dark:from-[#A01D45] dark:to-[#C1284C] shadow-lg;

      &:hover {
        @apply text-white;
      }
    }

    .nav-icon {
      @apply w-5 h-5 flex-shrink-0;
    }

    :host-context(.rtl) .nav-icon {
      transform: scaleX(-1);
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
      @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold transition-opacity duration-300;
      opacity: 1;
      margin-left: auto;
    }

    :host-context(.rtl) .nav-badge {
      margin-left: 0;
      margin-right: auto;
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
      @apply px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 transition-opacity duration-300;
      opacity: 1;
    }

    .modern-sidebar.collapsed .nav-group-title {
      opacity: 0;
      height: 0;
      overflow: hidden;
      padding: 0;
    }

    .nav-sublist {
      @apply mt-1 space-y-1 ml-2 pl-4 border-l-2 border-gray-100 dark:border-slate-800;
    }

    :host-context(.rtl) .nav-sublist {
      margin-left: 0;
      margin-right: 2px;
      padding-left: 0;
      padding-right: 1rem;
      border-left: none;
      border-right: 2px solid;
      border-right-color: rgb(243 244 246);
    }

    :host-context(.rtl) .dark .nav-sublist {
      border-right-color: rgb(30 41 59);
    }

    .nav-sublink {
      @apply py-2;
    }

    .sidebar-toggle-btn {
      @apply absolute top-4 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10 cursor-pointer;
      @apply hover:bg-gray-50 dark:hover:bg-slate-700 -right-3;
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
  private subscription: Subscription | null = null;
  private stateSubscription: Subscription | null = null;

  // Replace with roles from your auth store/service
  private userRoles = signal<string[]>(['admin']);

  nav = computed<INavItem[]>(() => buildNav(RAW_NAV_ITEMS, FEATURE_FLAGS, this.userRoles()));

  isCollapsed = signal(false);
  isRTL = computed(() => this.i18nService.isRTL());

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
