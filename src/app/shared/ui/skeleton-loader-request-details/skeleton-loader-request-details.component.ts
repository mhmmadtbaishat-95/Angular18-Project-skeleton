import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton loader component
 * Displays skeleton loading placeholders matching the bento grid card design
 */
@Component({
  selector: 'app-skeleton-loader-request-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader-request-details.component.html',
  styleUrls: ['./skeleton-loader-request-details.component.scss'],
})
export class SkeletonLoaderRequestDetailsComponent {
  @Input() isLoading = false;
  @Input() count = 6; // Number of skeleton cards to display
  @Input() type: 'service' | 'request' = 'service'; // Type of skeleton to show

  get skeletonArray(): number[] {
    return Array(this.count)
      .fill(0)
      .map((_, i) => i);
  }
}
