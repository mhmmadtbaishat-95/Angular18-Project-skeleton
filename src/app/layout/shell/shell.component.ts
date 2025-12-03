import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { AppStateService } from '../../core/services/state/app-state.service';

/**
 * Shell component - root layout frame with collapsible sidebar
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
  template: `
    <div class="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <app-header></app-header>
      <div class="flex flex-1 overflow-hidden relative">
        <!-- Sidebar -->
        <app-sidebar
          class="flex-shrink-0 transition-all duration-300 ease-in-out"
        ></app-sidebar>

        <!-- Main Content -->
        <main 
          class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-all duration-300"
        >
          <div class="p-6">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
      <app-footer></app-footer>
    </div>
  `
})
export class ShellComponent {
  private appState = inject(AppStateService);
  
  isSidebarCollapsed = computed(() => this.appState.getState().sidebarCollapsed);
}
