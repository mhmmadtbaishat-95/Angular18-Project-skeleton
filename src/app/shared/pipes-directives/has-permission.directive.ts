import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';

/**
 * Has permission directive
 * Conditionally renders content based on user permissions
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private hasView = false;

  /**
   * Permissions required to show content
   * @example
   * <div *appHasPermission="['settings.view', 'settings.edit']">
   *   Content shown only if user has permission
   * </div>
   */
  @Input() set appHasPermission(permissions: string[]) {
    // TODO: Implement permission checking logic
    // For now, this is a placeholder
    const user = this.authService.getCurrentUser();
    const hasPermission = user ? true : false; // Replace with actual permission check

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

