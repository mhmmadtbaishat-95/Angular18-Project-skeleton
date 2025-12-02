import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Loading spinner component
 * Displays a loading spinner indicator
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  @Input() isLoading = false;
}
