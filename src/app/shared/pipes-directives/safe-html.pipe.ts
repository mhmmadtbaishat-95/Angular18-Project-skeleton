import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Safe HTML pipe
 * Bypasses Angular's sanitization for HTML content
 * Use with caution - only for trusted content
 */
@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Transforms HTML string to safe HTML
   * @param value - HTML string
   * @returns Sanitized HTML
   * @example
   * <div [innerHTML]="htmlContent | safeHtml"></div>
   */
  transform(value: string): SafeHtml {
    if (!value) {
      return '';
    }
    return this.sanitizer.sanitize(1, value) || '';
  }
}

