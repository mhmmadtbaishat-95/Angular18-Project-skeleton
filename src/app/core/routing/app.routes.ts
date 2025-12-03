import { Routes } from '@angular/router';
import { ShellComponent } from '../../layout/shell/shell.component';

/**
 * Application routes
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'auth',
    loadChildren: () => import('../../features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../../features/dashboard/routes').then(m => m.routes)
      },
      {
        path: 'service-requests',
        loadChildren: () => import('../../features/service-requests/routes').then(m => m.routes)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('../../shared/ui/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
