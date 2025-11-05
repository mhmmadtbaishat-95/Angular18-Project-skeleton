import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Dashboard component
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
    <p>Hello World</p>
    </div>
  `
})
export class DashboardComponent {}
