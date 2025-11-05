Refactor this Angular 18 project to the structure and patterns below. Make minimal, mechanical changes; preserve behavior. Use standalone APIs (no NgModules), signals, lazy routes, and SSR/hydration if already present.

1) Target folder structure
src/app/
├─ core/
│  ├─ app.config.ts                # bootstrap providers (http, interceptors, error handler)
│  ├─ auth/                        # auth utilities/guards
│  ├─ error-handling/
│  └─ routing/
├─ config/
│  ├─ runtime-config.service.ts    # loads /assets/runtime-config.json at bootstrap
│  └─ tokens.ts
├─ shared/
│  ├─ ui/                          # presentational components only (no HTTP)
│  ├─ pipes-directives/
│  ├─ forms/
│  └─ utils/
├─ data-access/
│  ├─ http/                        # raw clients, types, interceptors
│  ├─ repositories/                # DTO↔domain mappers, retries
│  └─ stores/                      # SignalStore (only if cross-feature)
├─ layout/
│  ├─ shell.component.ts
│  └─ nav/
└─ features/
   └─ <feature>/
      ├─ pages/
      ├─ components/
      ├─ services/
      ├─ store/
      ├─ models/
      └─ routes.ts                 # standalone lazy routes

2) Create/move folders

Keep existing core/, layout/, features/, shared/, config/.

Split shared/ into shared/ui, shared/pipes-directives, shared/forms, shared/utils and move files accordingly (no HTTP calls inside shared/ui).

Create data-access/http, data-access/repositories, data-access/stores and move HTTP clients/interceptors there.

3) Routing (standalone + lazy)

Convert any NgModules in features/* to standalone.

For every feature features/<name>/routes.ts export lazy routes:

// features/<name>/routes.ts
import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    providers: [], // put feature-scoped services/SignalStore here
    loadComponent: () => import('./pages/<name>.page').then(m => m.<Name>Page),
  },
];


Update the app root routes to lazy-load each feature:

// core/routing/app.routes.ts (or wherever routes live)
import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadChildren: () => import('../features/dashboard/routes').then(m => m.routes) },
  { path: 'accounts',  loadChildren: () => import('../features/accounts/routes').then(m => m.routes) },
  { path: '**', loadComponent: () => import('../shared/ui/not-found/not-found.component').then(m => m.NotFoundComponent) },
];

4) Example feature page (signals + defer)

Create a simple page template all features can clone:

// features/accounts/pages/accounts.page.ts
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Accounts</h1>
    @defer (on viewport) {
      <div *ngFor="let a of vm().items">{{ a.name }}</div>
    } @placeholder { <p>Loading…</p> }
  `,
})
export class AccountsPage {
  private items = signal<{ id:number; name:string }[]>([]);
  vm = computed(() => ({ items: this.items() }));
  ngOnInit() { this.items.set([{id:1,name:'Acme Co.'}]); }
}

5) HTTP client & interceptors (centralized in app.config)

Ensure one place wires interceptors with provideHttpClient.

Move interceptors under data-access/http/interceptors/.

// core/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './routing/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../data-access/http/interceptors/auth.interceptor';
import { errorInterceptor } from '../data-access/http/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ]
};

6) Runtime config loader (no rebuilds per env)

Create service + bootstrap initializer and a sample JSON.

// config/runtime-config.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type RuntimeConfig = { apiBaseUrl: string };
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private http = inject(HttpClient);
  private cfg: RuntimeConfig | null = null;
  load = () => this.http.get<RuntimeConfig>('/assets/runtime-config.json').toPromise().then(c => this.cfg = c);
  get config(): RuntimeConfig {
    if (!this.cfg) throw new Error('Runtime config not loaded');
    return this.cfg;
  }
}

// core/app.config.ts (append)
import { APP_INITIALIZER } from '@angular/core';
import { RuntimeConfigService } from '../config/runtime-config.service';
function loadRuntimeConfig(cfg: RuntimeConfigService) { return () => cfg.load(); }
// add to providers:
{ provide: APP_INITIALIZER, useFactory: loadRuntimeConfig, deps: [RuntimeConfigService], multi: true },

// src/assets/runtime-config.json
{ "apiBaseUrl": "https://api.example.com" }

7) Data layer conventions

Put raw HTTP clients/types in data-access/http.

Wrap them with data-access/repositories/<domain>.repository.ts for DTO↔domain mapping and retries.

Only introduce data-access/stores/* (SignalStore) when state crosses routes/features.

8) Layout shell

Keep layout/shell.component.ts as the root frame (header/sidebar/footer) and nest <router-outlet /> inside.

Ensure global layout pieces live in layout/, not in features.

9) Lint & strictness

Ensure tsconfig.json has "strict": true.

Add an ESLint rule to forbid imports from another feature (if using path aliases). Prefer local barrels per folder (index.ts), never a mega-barrel for all shared.

10) Path aliases (optional)

Add in tsconfig.json:

"paths": {
  "@core/*": ["src/app/core/*"],
  "@config/*": ["src/app/config/*"],
  "@shared/*": ["src/app/shared/*"],
  "@data/*": ["src/app/data-access/*"],
  "@features/*": ["src/app/features/*"],
  "@layout/*": ["src/app/layout/*"]
}


Update imports accordingly.

11) Acceptance checks

App builds and runs.

All routes lazy-load.

No component in shared/ui performs HTTP.

Interceptors wired once in core/app.config.ts.

RuntimeConfigService loads before first route is activated.

Make the changes, adjust imports after file moves, and delete obsolete NgModules.