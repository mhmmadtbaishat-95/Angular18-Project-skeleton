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
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-6">
      <p class="text-center text-xs text-gray-500 dark:text-gray-400">
        {{ 'footer.copyright' | t: {year: currentYear} }}
      </p>
    </footer>
  `
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
