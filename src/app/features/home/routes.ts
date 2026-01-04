import { Routes } from '@angular/router';

/**
 * Home feature routes
 */
export const homeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home.component').then(m => m.HomeComponent)
  }
];

