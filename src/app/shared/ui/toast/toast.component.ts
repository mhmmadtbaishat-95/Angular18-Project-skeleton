import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * Toast notification component
 * Displays temporary notifications
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  @Input() toast: Toast | null = null;
  @Input() onClose: () => void = () => {};

  get toastClasses(): string {
    const base = 'bg-white dark:bg-gray-800 border';
    const types = {
      success: 'border-green-200 dark:border-green-800',
      error: 'border-red-200 dark:border-red-800',
      warning: 'border-yellow-200 dark:border-yellow-800',
      info: 'border-blue-200 dark:border-blue-800'
    };
    return `${base} ${types[this.toast?.type || 'info']}`;
  }

  get messageClasses(): string {
    const types = {
      success: 'text-green-800 dark:text-green-200',
      error: 'text-red-800 dark:text-red-200',
      warning: 'text-yellow-800 dark:text-yellow-200',
      info: 'text-blue-800 dark:text-blue-200'
    };
    return types[this.toast?.type || 'info'];
  }
}
