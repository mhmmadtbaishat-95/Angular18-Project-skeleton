import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';

/**
 * Footer component
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <footer class="auth-footer">
      <div class="footer-container">
        <div class="footer-left">
          <a href="#" class="footer-link">{{ 'footer.faq' | t }}</a>
          <a href="#" class="footer-link">{{ 'footer.disclaimer' | t }}</a>
          <a href="#" class="footer-link">{{ 'footer.privacyPolicy' | t }}</a>
        </div>
        <div class="footer-right">
          <p class="footer-copyright">{{ 'footer.fullCopyright' | t }}</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .auth-footer {
    backdrop-filter: blur(10px);

      position: relative;
      z-index: 50;
    }

    .footer-container {
      @apply flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 max-w-full mx-auto;
      flex-wrap: wrap;
      gap: 1rem;
      border-top: 1px solid #FFFFFF26;
        padding: 18px;
    }

    .footer-left {
      @apply flex items-center gap-4;
      flex-wrap: wrap;
    }

    .footer-link {
      @apply text-gray-300 hover:text-white text-sm transition-colors;
      white-space: nowrap;
      font-weight: bold;
    }

    .footer-right {
      @apply flex-1;
      min-width: 0;
    }

    .footer-copyright {
      @apply text-gray-300;
      font-size: 0.6rem;
      text-align: right;
    }

    /* RTL Support */
    :host-context([dir="rtl"]) {
      .footer-container {
       
      }

      .footer-copyright {
        text-align: left;
      }
    }

    @media (max-width: 768px) {
      .footer-container {
        @apply flex-col items-start;
      }

      .footer-copyright {
        text-align: left;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
