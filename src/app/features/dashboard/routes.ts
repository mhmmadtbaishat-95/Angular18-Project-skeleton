import { Routes } from '@angular/router';

/**
 * Dashboard feature routes
 */
export const routes: Routes = [
  {
    path: '',
    providers: [],
    loadComponent: () => import('./pages/dashboard.page').then(m => m.DashboardPage),
  },
];

