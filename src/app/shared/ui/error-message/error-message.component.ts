import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Error message component
 * Displays error messages to users
 */
@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss']
})
export class ErrorMessageComponent {
  @Input() message: string | null = null;
}
