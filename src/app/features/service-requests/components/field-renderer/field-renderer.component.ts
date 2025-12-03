import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, AbstractControl } from '@angular/forms';
import { FormField, FieldType } from '../../models/form-field.model';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';

/**
 * Field renderer component
 * Renders individual form fields based on field definition
 */
@Component({
  selector: 'app-field-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ErrorMessageComponent],
  templateUrl: './field-renderer.component.html',
  styleUrls: ['./field-renderer.component.scss']
})
export class FieldRendererComponent implements OnInit {
  @Input() field!: FormField;
  @Input() form!: FormGroup;

  FieldType = FieldType;

  ngOnInit(): void {
    if (!this.field || !this.form) {
      console.error('FieldRendererComponent: field and form are required');
    }
  }

  /**
   * Gets form control for the field
   */
  getControl(): AbstractControl | null {
    return this.form.get(this.field.key);
  }

  /**
   * Checks if field has error
   */
  hasError(): boolean {
    const control = this.getControl();
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Gets error message for the field
   */
  getErrorMessage(): string | null {
    const control = this.getControl();
    if (!control || !control.errors) return null;

    const errors = control.errors;

    if (errors['required']) {
      return `${this.field.label} is required`;
    }

    if (this.field.validations) {
      for (const rule of this.field.validations) {
        if (errors[rule.type]) {
          return rule.message;
        }
      }
    }

    if (errors['minlength']) {
      return `${this.field.label} must be at least ${errors['minlength'].requiredLength} characters`;
    }

    if (errors['maxlength']) {
      return `${this.field.label} must be at most ${errors['maxlength'].requiredLength} characters`;
    }

    if (errors['email']) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  /**
   * Formats card number with spaces
   */
  formatCardNumber(value: string): string {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return v;
  }

  /**
   * Formats card expiry date (MM/YY)
   */
  formatCardExpiry(value: string): string {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  }

  /**
   * Handles card number input
   */
  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatCardNumber(input.value);
    this.form.get(this.field.key)?.setValue(formatted, { emitEvent: false });
  }

  /**
   * Handles card expiry input
   */
  onCardExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatCardExpiry(input.value);
    this.form.get(this.field.key)?.setValue(formatted, { emitEvent: false });
  }
}

