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

/**
 * Permission guard
 * Protects routes based on user permissions
 * Note: This is a basic implementation. You may need to extend this
 * based on your permission system (e.g., permissions stored in user object or separate service)
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Checks if route can be activated based on user permissions
   * @param route - Activated route snapshot
   * @param state - Router state snapshot
   * @returns True if route can be activated
   * @example
   * // Use in route configuration:
   * {
   *   path: 'settings',
   *   component: SettingsComponent,
   *   canActivate: [PermissionGuard],
   *   data: { permissions: ['settings.view', 'settings.edit'] }
   * }
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredPermissions = route.data['permissions'] as string[];

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // No permissions specified, allow access
      return true;
    }

    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        // TODO: Implement permission checking logic
        // This is a placeholder - adjust based on your permission system
        const userPermissions = this.getUserPermissions(user);
        const hasPermission = requiredPermissions.some((permission) =>
          userPermissions.includes(permission)
        );

        if (!hasPermission) {
          // User doesn't have required permission
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }

  /**
   * Gets user permissions
   * TODO: Implement based on your permission system
   * @param user - User object
   * @returns Array of permission strings
   * @private
   */
  private getUserPermissions(user: any): string[] {
    // TODO: Replace with actual permission retrieval logic
    // Example: return user.permissions || [];
    // Example: return this.permissionService.getPermissions(user.id);
    return [];
  }
}

