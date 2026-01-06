import { Routes } from '@angular/router';
import { ShellComponent } from '../../layout/shell/shell.component';

/**
 * Application routes
 */
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('../../features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () => import('../../features/home/routes').then((m) => m.homeRoutes),
      },
      {
        path: 'dashboard',
        loadChildren: () => import('../../features/dashboard/routes').then((m) => m.routes),
      },
      {
        path: 'service-requests',
        loadChildren: () => import('../../features/service-requests/routes').then((m) => m.routes),
      },
      {
        path: 'my-cases',
        loadChildren: () => import('../../features/my-cases/routes').then((m) => m.myCasesRoutes),
      },
      {
        path: 'fines',
        loadChildren: () => import('../../features/fines/routes').then((m) => m.finesRoutes),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('../../shared/ui/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
