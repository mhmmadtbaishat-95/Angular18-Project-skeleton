import { Routes } from '@angular/router';

/**
 * Service requests feature routes
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'services',
    pathMatch: 'full'
  },
  {
    path: 'services',
    loadComponent: () => import('./components/services/services.component').then(m => m.ServicesComponent)
  },
  {
    path: 'catalog',
    loadComponent: () => import('./components/service-catalog/service-catalog.component').then(m => m.ServiceCatalogComponent)
  },
  {
    path: 'service/:id',
    loadComponent: () => import('./components/service-detail/service-detail.component').then(m => m.ServiceDetailComponent)
  },
  {
    path: 'my-requests',
    loadComponent: () => import('./components/request-list/request-list.component').then(m => m.RequestListComponent)
  },
  {
    path: 'request/:id',
    loadComponent: () => import('./pages/service-request.page').then(m => m.ServiceRequestPage)
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./components/request-detail/request-detail.component').then(m => m.RequestDetailComponent)
  }
];

