import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

/**
 * Auth guard
 * Protects routes that require authentication
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Checks if route can be activated
   * @param route - Activated route snapshot
   * @param state - Router state snapshot
   * @returns True if route can be activated
   * @example
   * // Use in route configuration:
   * { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  /**
   * Checks if child route can be activated
   * @param route - Activated route snapshot
   * @param state - Router state snapshot
   * @returns True if child route can be activated
   */
  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  /**
   * Checks authentication status
   * @param redirectUrl - URL to redirect to after login
   * @returns Observable of boolean
   * @private
   */
  private checkAuth(redirectUrl: string): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map((isAuthenticated) => {
        if (!isAuthenticated) {
          // Store redirect URL for after login
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: redirectUrl }
          });
          return false;
        }
        return true;
      })
    );
  }
}

