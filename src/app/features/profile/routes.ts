import { Routes } from '@angular/router';

/**
 * Profile feature routes
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile.page').then((m) => m.ProfilePage),
  },
];
