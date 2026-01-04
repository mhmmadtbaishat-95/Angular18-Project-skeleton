import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { LoadingSpinnerComponent } from './shared/ui/loading-spinner/loading-spinner.component';
import { ChatbotComponent } from './shared/ui/chatbot/chatbot.component';
import { AppStateService } from './core/services/state/app-state.service';
import { ThemeService } from './core/services/theme/theme.service';

/**
 * Root application component
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterOutlet, LoadingSpinnerComponent, ChatbotComponent],
  template: `
    <div class="h-full w-full">
      <app-loading-spinner [isLoading]="(isLoading$ | async) ?? false"></app-loading-spinner>
      <router-outlet></router-outlet>
      <app-chatbot></app-chatbot>
    </div>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  private readonly appState = inject(AppStateService);
  private readonly themeService = inject(ThemeService);
  
  isLoading$ = this.appState.state$.pipe(
    map(state => state.isLoading ?? false)
  );

  ngOnInit(): void {
    // Initialize theme on app start
    // Theme service will handle initialization
    // I18n service will handle language initialization automatically
  }
}
