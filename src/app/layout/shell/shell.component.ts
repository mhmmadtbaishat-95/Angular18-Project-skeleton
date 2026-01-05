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
    <div class="shell-container">
      <!-- Background Video -->
      <div class="shell-background">
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
      <div class="shell-content">
        <div class="flex flex-col h-screen overflow-hidden">
          <app-header></app-header>
          <div class="flex flex-1 overflow-hidden relative">
            <!-- Sidebar -->
            <app-sidebar
              class="flex-shrink-0 transition-all duration-300 ease-in-out"
            ></app-sidebar>

            <!-- Main Content -->
            <main
              class="flex-1 overflow-y-auto transition-all duration-300"
            >
              <div class="p-6">
                <router-outlet></router-outlet>
              </div>
            </main>
          </div>
          <app-footer></app-footer>
        </div>
      </div>
    </div>
  `,
  styles: [`
  @font-face {
  font-family: 'Montserrat Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url(https://cdn.jsdelivr.net/fontsource/fonts/montserrat:vf@latest/latin-wght-normal.woff2) format('woff2-variations');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}
  main{
    scrollbar-width: none;  
  }
    .shell-container {
      @apply relative w-full h-screen overflow-hidden;
    }

    .shell-background {
      @apply absolute inset-0 z-0;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .background-video {
      @apply w-full h-full object-cover;
      position: absolute;
      top: 0;
      left: 0;
      min-width: 100%;
      min-height: 100%;
      z-index: 0;
      transition: filter 0.3s ease-in-out;
    }

    .background-overlay {
      @apply absolute inset-0 bg-black/40;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .shell-content {
      @apply relative z-10 w-full h-full;
    }
  `]
})
export class ShellComponent {
  private appState = inject(AppStateService);
  
  isSidebarCollapsed = computed(() => this.appState.getState().sidebarCollapsed);
}
