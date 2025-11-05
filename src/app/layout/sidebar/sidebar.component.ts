import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { buildNav, RAW_NAV_ITEMS, FEATURE_FLAGS } from './app-navigation.config';
import { INavItem } from './models/nav.types';
import { TranslatePipe } from "../../shared/pipes/translate.pipe";
// ...rest of your imports

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, TranslatePipe], // ⬅️ use TranslateModule, not a custom pipe
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit, OnDestroy {
  private translateService = inject(TranslateService);
  private subscription: Subscription | null = null;

  // Replace with roles from your auth store/service
  private userRoles = signal<string[]>(['admin']);

  nav = computed<INavItem[]>(() => buildNav(RAW_NAV_ITEMS, FEATURE_FLAGS, this.userRoles()));

  forceUpdate = 0;

  ngOnInit(): void {
    this.subscription = this.translateService.onLangChange.subscribe(() => {
      this.forceUpdate++;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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
