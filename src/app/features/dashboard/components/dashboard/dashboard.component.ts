import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Dashboard component
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  items = signal<{ id: number; name: string }[]>([]);
  vm = computed(() => ({ items: this.items() }));

  ngOnInit() {
    this.items.set([{ id: 1, name: 'Dashboard Item 1' }]);
  }
}
