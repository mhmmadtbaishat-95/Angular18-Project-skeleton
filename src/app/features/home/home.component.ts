import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { RouterLink } from '@angular/router';

/**
 * Home page component
 * Landing page with platform title and navigation icons
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  template: `
    <div class="home-container">
      <!-- Main Title Section -->
      <div class="title-section">
        <h1 class="main-title-ar">منصة قطر العقارية</h1>
        <h2 class="main-title-en">Qatar Real Estate Platform</h2>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      @apply relative w-full h-full flex items-center justify-center;
      min-height: calc(100vh - 12rem);
      margin: -1.5rem;
      padding: 0;
    }

    .title-section {
      @apply text-center z-10;
      flex: 1;
    }

    .main-title-ar {
      @apply text-6xl md:text-7xl lg:text-8xl font-bold mb-4;
      background: #A19576;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
    }

    .main-title-en {
      @apply text-3xl md:text-4xl lg:text-5xl font-semibold;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      color: #A19576;
    }

    .sidebar-icons {
      @apply fixed right-6 top-1/2 transform -translate-y-1/2 z-20;
      @apply flex flex-col gap-6;
    }

    .icon-item {
      @apply w-14 h-14 rounded-lg bg-white/10 backdrop-blur-md border border-white/20;
      @apply flex items-center justify-center text-white;
      @apply hover:bg-white/20 hover:scale-110 transition-all duration-300;
      @apply shadow-lg;
    }

    .icon-svg {
      @apply w-7 h-7;
    }

    /* RTL Support */
    :host-context([dir="rtl"]) {
      .sidebar-icons {
        right: auto;
        left: 1.5rem;
      }
    }

    @media (max-width: 768px) {
      .main-title-ar {
        @apply text-4xl md:text-5xl;
      }

      .main-title-en {
        @apply text-2xl md:text-3xl;
      }

      .sidebar-icons {
        @apply right-4;
        @apply gap-4;
      }

      .icon-item {
        @apply w-12 h-12;
      }

      .icon-svg {
        @apply w-6 h-6;
      }
    }
  `]
})
export class HomeComponent {}

