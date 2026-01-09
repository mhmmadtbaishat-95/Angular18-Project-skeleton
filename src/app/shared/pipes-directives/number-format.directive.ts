import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * Directive to format number inputs with thousand separators
 * Automatically formats numbers as user types (e.g., 1000000 -> 1,000,000)
 */
@Directive({
  selector: '[appNumberFormat]',
  standalone: true
})
export class NumberFormatDirective implements OnInit, OnDestroy {
  @Input() decimals: number = 2; // Number of decimal places
  @Input() allowDecimals: boolean = true; // Whether to allow decimal values

  private el: HTMLInputElement;
  private control?: NgControl;
  private subscription?: Subscription;

  constructor(
    private elementRef: ElementRef,
    private ngControl?: NgControl
  ) {
    this.el = this.elementRef.nativeElement;
    this.control = this.ngControl;
  }

  ngOnInit(): void {
    // Format initial value if present
    if (this.control?.value !== null && this.control?.value !== undefined && this.control?.value !== '') {
      const formatted = this.formatNumber(this.control.value);
      this.el.value = formatted;
    }

    // Subscribe to form control value changes (from programmatic updates)
    if (this.control?.valueChanges) {
      this.subscription = this.control.valueChanges.subscribe(value => {
        if (value !== null && value !== undefined && value !== '') {
          const formatted = this.formatNumber(value);
          if (this.el.value !== formatted) {
            this.el.value = formatted;
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const originalLength = input.value.length;

    // Remove all non-numeric characters except decimal point
    let value = input.value.replace(/[^\d.]/g, '');

    // Handle decimal point
    if (this.allowDecimals) {
      // Only allow one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      // Limit decimal places
      if (parts.length === 2 && parts[1].length > this.decimals) {
        value = parts[0] + '.' + parts[1].substring(0, this.decimals);
      }
    } else {
      // Remove decimal point if decimals not allowed
      value = value.replace('.', '');
    }

    // Format the number
    const formatted = this.formatNumber(value);

    // Update input value
    input.value = formatted;

    // Restore cursor position
    const newLength = formatted.length;
    const lengthDiff = newLength - originalLength;
    const newCursorPosition = Math.max(0, cursorPosition + lengthDiff);
    input.setSelectionRange(newCursorPosition, newCursorPosition);

    // Update form control with numeric value (without formatting)
    if (this.control) {
      const numericValue = value === '' ? null : parseFloat(value);
      this.control.control?.setValue(numericValue, { emitEvent: false });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value === '' || value === null || value === undefined) {
      if (this.control) {
        this.control.control?.setValue(null, { emitEvent: true });
      }
      return;
    }

    // Ensure the value is formatted on blur
    const numericValue = this.parseNumber(value);
    if (numericValue !== null) {
      const formatted = this.formatNumber(numericValue);
      input.value = formatted;
      
      if (this.control) {
        this.control.control?.setValue(numericValue, { emitEvent: true });
      }
    }
  }

  @HostListener('focus', ['$event'])
  onFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Optionally, you can remove formatting on focus for easier editing
    // For now, we'll keep the formatting
  }

  /**
   * Formats a number with thousand separators
   */
  private formatNumber(value: string | number): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Convert to string and remove existing formatting
    let numStr = value.toString().replace(/,/g, '');

    // Handle empty string
    if (numStr === '' || numStr === '.') {
      return '';
    }

    // Parse to number
    const num = parseFloat(numStr);
    if (isNaN(num)) {
      return '';
    }

    // Format with Intl.NumberFormat
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: this.allowDecimals ? this.decimals : 0,
      useGrouping: true // Enable thousand separators
    };

    return new Intl.NumberFormat('en-US', options).format(num);
  }

  /**
   * Parses a formatted number string to a number
   */
  private parseNumber(value: string): number | null {
    if (!value || value === '') {
      return null;
    }

    // Remove thousand separators
    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);

    return isNaN(num) ? null : num;
  }
}
