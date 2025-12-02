import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

/**
 * Shell component - root layout frame
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
  template: `
    <div class="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <app-header></app-header>
      <div class="flex flex-1 overflow-hidden">
        <app-sidebar class="flex-shrink-0"></app-sidebar>
        <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div class="p-6">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
      <app-footer></app-footer>
    </div>
  `
})
export class ShellComponent {}
