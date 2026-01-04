import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

/**
 * Auth Layout Component
 * Provides a full-screen background layout for login/register pages with header and footer
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="auth-layout-container">
      <!-- Background Video -->
      <div class="auth-background">
        <video
          autoplay
          muted
          loop
          playsinline
          class="background-video"
        >
          <source src="assets/6515549_Doha_Qatar_3840x21601.mp4" type="video/mp4" />
        </video>
        <div class="background-overlay"></div>
      </div>

      <!-- Content Overlay -->
      <div class="auth-content">
        <div class="flex flex-col min-h-screen">
          <!-- Header with transparent background -->
          <div class="header-wrapper">
            <app-header></app-header>
          </div>

          <!-- Main Content - Centered Login/Register Modal -->
          <main class="flex-1 flex items-center justify-center px-4 py-4 sm:py-8 min-h-0">
            <router-outlet></router-outlet>
          </main>

          <!-- Footer with transparent background -->
          <div class="footer-wrapper">
            <app-footer></app-footer>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout-container {
      @apply relative w-full h-screen overflow-hidden;
    }

    .auth-background {
      @apply absolute inset-0 z-0;
    }

    .background-video {
      @apply w-full h-full object-cover;
    }

    .background-overlay {
      @apply absolute inset-0 bg-black/40;
    }

    .auth-content {
      @apply relative z-10 w-full min-h-screen flex flex-col;
    }

    main {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }

    .footer-wrapper {
      @apply backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border-t border-white/20;
    }
  `]
})
export class AuthLayoutComponent {}
