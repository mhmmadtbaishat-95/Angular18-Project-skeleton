import { Pipe, PipeTransform } from '@angular/core';
import { getRelativeTime } from '../../core/utils/date.util';

/**
 * Time ago pipe
 * Displays relative time (e.g., "2 hours ago")
 */
@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  /**
   * Transforms date to relative time string
   * @param value - Date string or Date object
   * @returns Relative time string
   * @example
   * {{ createdAt | timeAgo }} // "2 hours ago"
   */
  transform(value: Date | string | null | undefined): string {
    if (!value) {
      return '';
    }
    return getRelativeTime(value);
  }
}

