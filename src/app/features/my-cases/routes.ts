import { Routes } from '@angular/router';

/**
 * Home feature routes
 */
export const myCasesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./my-cases.component').then((m) => m.myCasesComponent),
  },
];
