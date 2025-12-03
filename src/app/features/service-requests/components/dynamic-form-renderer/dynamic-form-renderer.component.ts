import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FormDefinition, FormField, FieldType, ValidationRule, ValidationType } from '../../models/form-field.model';
import { ErrorMessageComponent } from '@shared/ui/error-message/error-message.component';

/**
 * Dynamic form renderer component
 * Renders forms dynamically from JSON form definitions
 */
@Component({
  selector: 'app-dynamic-form-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ErrorMessageComponent],
  templateUrl: './dynamic-form-renderer.component.html',
  styleUrls: ['./dynamic-form-renderer.component.scss']
})
export class DynamicFormRendererComponent implements OnInit, OnDestroy {
  @Input() formDefinition!: FormDefinition;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() formValueChange = new EventEmitter<any>();

  form!: FormGroup;
  private readonly fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.buildForm();
    this.setupConditionalLogic();
    this.setupValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Builds the reactive form from form definition
   */
  private buildForm(): void {
    const formControls: { [key: string]: any } = {};

    const sections = this.formDefinition.sections || [];
    sections.forEach(section => {
      section.fields.forEach(field => {
        const validators = this.buildValidators(field);
        formControls[field.key] = [
          { value: field.defaultValue || this.getDefaultValue(field.type), disabled: field.disabled || false },
          validators
        ];
      });
    });

    this.form = this.fb.group(formControls);
  }

  /**
   * Gets default value based on field type
   */
  private getDefaultValue(type: FieldType): any {
    switch (type) {
      case FieldType.CHECKBOX:
        return false;
      case FieldType.NUMBER:
        return null;
      default:
        return '';
    }
  }

  /**
   * Builds validators array from field validation rules
   */
  private buildValidators(field: FormField): any[] {
    const validators: any[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.validations) {
      field.validations.forEach(rule => {
        switch (rule.type) {
          case ValidationType.MIN_LENGTH:
            validators.push(Validators.minLength(rule.value));
            break;
          case ValidationType.MAX_LENGTH:
            validators.push(Validators.maxLength(rule.value));
            break;
          case ValidationType.MIN:
            validators.push(Validators.min(rule.value));
            break;
          case ValidationType.MAX:
            validators.push(Validators.max(rule.value));
            break;
          case ValidationType.PATTERN:
            validators.push(Validators.pattern(rule.value));
            break;
          case ValidationType.EMAIL:
            validators.push(Validators.email);
            break;
        }
      });
    }

    // Custom validators for specific field types
    if (field.type === FieldType.CARD_NUMBER) {
      validators.push(this.cardNumberValidator());
    }
    if (field.type === FieldType.CARD_CVV) {
      validators.push(this.cvvValidator());
    }
    if (field.type === FieldType.CARD_EXPIRY) {
      validators.push(this.cardExpiryValidator());
    }

    return validators;
  }

  /**
   * Sets up conditional logic for fields
   */
  private setupConditionalLogic(): void {
    const sections = this.formDefinition.sections || [];
    sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.conditionalLogic && field.conditionalLogic.length > 0) {
          field.conditionalLogic.forEach(logic => {
            const control = this.form.get(logic.field);
            if (control) {
              control.valueChanges
                .pipe(takeUntil(this.destroy$))
                .subscribe(value => {
                  this.applyConditionalLogic(field, logic, value);
                });
            }
          });
        }
      });
    });
  }

  /**
   * Applies conditional logic to a field
   */
  private applyConditionalLogic(field: FormField, logic: any, value: any): void {
    const fieldControl = this.form.get(field.key);
    if (!fieldControl) return;

    let conditionMet = false;

    switch (logic.operator) {
      case 'equals':
        conditionMet = value === logic.value;
        break;
      case 'notEquals':
        conditionMet = value !== logic.value;
        break;
      case 'contains':
        conditionMet = String(value).includes(String(logic.value));
        break;
      case 'greaterThan':
        conditionMet = Number(value) > Number(logic.value);
        break;
      case 'lessThan':
        conditionMet = Number(value) < Number(logic.value);
        break;
      case 'isEmpty':
        conditionMet = !value || value === '';
        break;
      case 'isNotEmpty':
        conditionMet = !!value && value !== '';
        break;
    }

    switch (logic.action) {
      case 'show':
      case 'hide':
        // Handle visibility through CSS class or *ngIf in template
        break;
      case 'enable':
        if (conditionMet) {
          fieldControl.enable();
        } else {
          fieldControl.disable();
        }
        break;
      case 'disable':
        if (conditionMet) {
          fieldControl.disable();
        } else {
          fieldControl.enable();
        }
        break;
      case 'require':
        if (conditionMet) {
          fieldControl.addValidators(Validators.required);
        } else {
          fieldControl.removeValidators(Validators.required);
        }
        fieldControl.updateValueAndValidity();
        break;
      case 'optional':
        if (conditionMet) {
          fieldControl.removeValidators(Validators.required);
        } else {
          fieldControl.addValidators(Validators.required);
        }
        fieldControl.updateValueAndValidity();
        break;
    }
  }

  /**
   * Sets up form value changes subscription
   */
  private setupValueChanges(): void {
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.formValueChange.emit(value);
      });
  }

  /**
   * Gets all fields from all sections
   */
  get allFields(): FormField[] {
    const sections = this.formDefinition.sections || [];
    return sections.flatMap(section => section.fields);
  }

  /**
   * Gets fields for a specific section
   */
  getFieldsForSection(sectionIndex: number): FormField[] {
    const sections = this.formDefinition.sections || [];
    return sections[sectionIndex]?.fields || [];
  }

  /**
   * Gets form control for a field
   */
  getControl(fieldKey: string): AbstractControl | null {
    return this.form.get(fieldKey);
  }

  /**
   * Checks if field has error
   */
  hasError(fieldKey: string): boolean {
    const control = this.getControl(fieldKey);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Gets error message for a field
   */
  getErrorMessage(field: FormField): string | null {
    const control = this.getControl(field.key);
    if (!control || !control.errors) return null;

    const errors = control.errors;

    if (errors['required']) {
      return `${field.label} is required`;
    }

    if (field.validations) {
      for (const rule of field.validations) {
        if (errors[rule.type]) {
          return rule.message;
        }
      }
    }

    if (errors['minlength']) {
      return `${field.label} must be at least ${errors['minlength'].requiredLength} characters`;
    }

    if (errors['maxlength']) {
      return `${field.label} must be at most ${errors['maxlength'].requiredLength} characters`;
    }

    if (errors['min']) {
      return `${field.label} must be at least ${errors['min'].min}`;
    }

    if (errors['max']) {
      return `${field.label} must be at most ${errors['max'].max}`;
    }

    if (errors['email']) {
      return 'Please enter a valid email address';
    }

    if (errors['pattern']) {
      return 'Invalid format';
    }

    if (errors['invalidCardNumber']) {
      return 'Invalid card number';
    }

    if (errors['invalidCVV']) {
      return 'Invalid CVV';
    }

    if (errors['invalidExpiry']) {
      return 'Invalid expiry date';
    }

    return null;
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Handles form cancellation
   */
  onCancel(): void {
    this.formCancel.emit();
  }

  /**
   * Card number validator
   */
  private cardNumberValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/\s/g, '');
      // Luhn algorithm check
      if (!/^\d{13,19}$/.test(value)) {
        return { invalidCardNumber: true };
      }
      let sum = 0;
      let isEven = false;
      for (let i = value.length - 1; i >= 0; i--) {
        let digit = parseInt(value[i], 10);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }
      return sum % 10 === 0 ? null : { invalidCardNumber: true };
    };
  }

  /**
   * CVV validator
   */
  private cvvValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return /^\d{3,4}$/.test(control.value) ? null : { invalidCVV: true };
    };
  }

  /**
   * Card expiry validator
   */
  private cardExpiryValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const match = control.value.match(/^(\d{2})\/(\d{2})$/);
      if (!match) return { invalidExpiry: true };
      const month = parseInt(match[1], 10);
      const year = parseInt(match[2], 10);
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      if (month < 1 || month > 12) return { invalidExpiry: true };
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { invalidExpiry: true };
      }
      return null;
    };
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
   * Handles card number input
   */
  onCardNumberInput(event: Event, fieldKey: string): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatCardNumber(input.value);
    this.form.get(fieldKey)?.setValue(formatted, { emitEvent: false });
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
   * Handles card expiry input
   */
  onCardExpiryInput(event: Event, fieldKey: string): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatCardExpiry(input.value);
    this.form.get(fieldKey)?.setValue(formatted, { emitEvent: false });
  }

  /**
   * Field type enum for template
   */
  FieldType = FieldType;
}

