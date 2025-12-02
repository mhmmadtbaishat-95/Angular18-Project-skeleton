import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { UserRole } from '../enums/user-role.enum';

/**
 * Role guard
 * Protects routes based on user roles
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Checks if route can be activated based on user role
   * @param route - Activated route snapshot
   * @param state - Router state snapshot
   * @returns True if route can be activated
   * @example
   * // Use in route configuration:
   * {
   *   path: 'admin',
   *   component: AdminComponent,
   *   canActivate: [RoleGuard],
   *   data: { roles: [UserRole.ADMIN] }
   * }
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const allowedRoles = route.data['roles'] as UserRole[];

    if (!allowedRoles || allowedRoles.length === 0) {
      // No roles specified, allow access
      return true;
    }

    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        const hasRole = allowedRoles.includes(user.role);
        if (!hasRole) {
          // User doesn't have required role
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

