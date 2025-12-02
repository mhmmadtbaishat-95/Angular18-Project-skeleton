import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from '../components/dashboard/dashboard.component';

/**
 * Dashboard page component
 */
@Component({
  standalone: true,
  imports: [CommonModule, DashboardComponent],
  template: `<app-dashboard></app-dashboard>`
})
export class DashboardPage {}
