import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncate pipe
 * Truncates text to a specified length
 */
@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  /**
   * Truncates text to specified length
   * @param value - Text to truncate
   * @param length - Maximum length (default: 50)
   * @param suffix - Suffix to append (default: '...')
   * @returns Truncated text
   * @example
   * {{ longText | truncate: 20 }} // Truncates to 20 characters
   */
  transform(value: string | null | undefined, length: number = 50, suffix: string = '...'): string {
    if (!value) {
      return '';
    }
    if (value.length <= length) {
      return value;
    }
    return value.substring(0, length) + suffix;
  }
}

