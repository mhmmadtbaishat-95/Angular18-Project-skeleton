import { Routes } from '@angular/router';

/**
 * Home feature routes
 */
export const finesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./fines.component').then((m) => m.finesComponent),
  },
];
