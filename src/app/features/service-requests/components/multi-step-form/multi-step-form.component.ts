import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FormDefinition, FormField, FieldType, FormStep } from '../../models/form-field.model';
import { StepWizardComponent, StepConfig } from '../step-wizard/step-wizard.component';
import { PaymentSummaryComponent } from '../payment-summary/payment-summary.component';
import { FieldRendererComponent } from '../field-renderer/field-renderer.component';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';

/**
 * Multi-step form component
 * Handles step-based form workflow with validation per step
 */
@Component({
  selector: 'app-multi-step-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StepWizardComponent,
    PaymentSummaryComponent,
    FieldRendererComponent,
    TranslatePipe
  ],
  templateUrl: './multi-step-form.component.html',
  styleUrls: ['./multi-step-form.component.scss']
})
export class MultiStepFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() formDefinition!: FormDefinition;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() formValueChange = new EventEmitter<any>();

  form!: FormGroup;
  currentStepIndex = 0;
  steps: StepConfig[] = [];
  stepDefinitions: FormStep[] = [];
  
  private readonly fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.formDefinition) {
      this.initializeForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formDefinition'] && this.formDefinition) {
      this.initializeForm();
    }
  }

  /**
   * Initializes the form when formDefinition is available
   */
  private initializeForm(): void {
    if (!this.formDefinition) return;
    
    this.initializeSteps();
    this.buildForm();
    this.setupValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initializes steps from form definition
   */
  private initializeSteps(): void {
    if (this.formDefinition.steps && this.formDefinition.steps.length > 0) {
      this.stepDefinitions = this.formDefinition.steps.sort((a, b) => (a.order || 0) - (b.order || 0));
      this.steps = this.stepDefinitions.map((step, index) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        icon: step.icon,
        completed: false,
        active: index === 0,
        disabled: false
      }));
    } else if (this.formDefinition.sections) {
      // Convert sections to steps for backward compatibility
      this.stepDefinitions = this.formDefinition.sections.map((section, index) => ({
        id: `step-${index + 1}`,
        title: section.title || `Step ${index + 1}`,
        description: section.description,
        sections: [section],
        order: index
      }));
      this.steps = this.stepDefinitions.map((step, index) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        completed: false,
        active: index === 0,
        disabled: false
      }));
    }
    // Ensure currentStepIndex is 0
    this.currentStepIndex = 0;
  }

  /**
   * Builds the reactive form from all steps
   */
  private buildForm(): void {
    const formControls: { [key: string]: any } = {};

    this.stepDefinitions.forEach(step => {
      step.sections.forEach(section => {
        section.fields.forEach(field => {
          const validators = this.buildValidators(field);
          formControls[field.key] = [
            { value: field.defaultValue || this.getDefaultValue(field.type), disabled: field.disabled || false },
            validators
          ];
        });
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
          case 'minLength' as any:
            validators.push(Validators.minLength(rule.value));
            break;
          case 'maxLength' as any:
            validators.push(Validators.maxLength(rule.value));
            break;
          case 'min' as any:
            validators.push(Validators.min(rule.value));
            break;
          case 'max' as any:
            validators.push(Validators.max(rule.value));
            break;
          case 'pattern' as any:
            validators.push(Validators.pattern(rule.value));
            break;
          case 'email' as any:
            validators.push(Validators.email);
            break;
        }
      });
    }

    // Custom validators for payment fields
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
   * Card number validator (Luhn algorithm)
   */
  private cardNumberValidator(): (control: AbstractControl) => any {
    return (control: AbstractControl): any => {
      if (!control.value) return null;
      const value = control.value.replace(/\s/g, '');
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
  private cvvValidator(): (control: AbstractControl) => any {
    return (control: AbstractControl): any => {
      if (!control.value) return null;
      return /^\d{3,4}$/.test(control.value) ? null : { invalidCVV: true };
    };
  }

  /**
   * Card expiry validator
   */
  private cardExpiryValidator(): (control: AbstractControl) => any {
    return (control: AbstractControl): any => {
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
   * Gets current step definition
   */
  get currentStep(): FormStep | null {
    return this.stepDefinitions[this.currentStepIndex] || null;
  }

  /**
   * TrackBy function for steps
   */
  trackByStep(index: number, step: FormStep): string {
    return step.id || index.toString();
  }

  /**
   * TrackBy function for sections
   */
  trackBySection(index: number, section: any): string {
    return section.id || section.title || index.toString();
  }

  /**
   * TrackBy function for fields
   */
  trackByField(index: number, field: FormField): string {
    return field.key || index.toString();
  }

  /**
   * Gets fields for current step
   */
  get currentStepFields(): FormField[] {
    if (!this.currentStep) return [];
    return this.currentStep.sections.flatMap(section => section.fields);
  }

  /**
   * Checks if current step is valid
   */
  isCurrentStepValid(): boolean {
    if (!this.currentStep) return false;
    
    const stepFields = this.currentStepFields;
    const invalidFields = stepFields.filter(field => {
      const control = this.form.get(field.key);
      return control && control.invalid && (control.dirty || control.touched);
    });

    return invalidFields.length === 0;
  }

  /**
   * Navigates to next step
   */
  nextStep(): void {
    if (this.isCurrentStepValid() && this.currentStepIndex < this.steps.length - 1) {
      this.steps[this.currentStepIndex].completed = true;
      this.currentStepIndex++;
      this.steps[this.currentStepIndex].active = true;
      this.scrollToTop();
    } else {
      // Mark all fields in current step as touched
      this.currentStepFields.forEach(field => {
        this.form.get(field.key)?.markAsTouched();
      });
    }
  }

  /**
   * Navigates to previous step
   */
  previousStep(): void {
    if (this.currentStepIndex > 0) {
      this.steps[this.currentStepIndex].active = false;
      this.currentStepIndex--;
      this.steps[this.currentStepIndex].active = true;
      this.steps[this.currentStepIndex].completed = false;
      this.scrollToTop();
    }
  }

  /**
   * Navigates to specific step
   */
  goToStep(index: number): void {
    if (index >= 0 && index < this.steps.length && index <= this.currentStepIndex) {
      this.steps[this.currentStepIndex].active = false;
      this.currentStepIndex = index;
      this.steps[this.currentStepIndex].active = true;
      this.scrollToTop();
    }
  }

  /**
   * Checks if can proceed to next step
   */
  canProceedNext(): boolean {
    return this.currentStepIndex < this.steps.length - 1;
  }

  /**
   * Checks if can go back
   */
  canGoBack(): boolean {
    return this.currentStepIndex > 0;
  }

  /**
   * Checks if is last step
   */
  isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1;
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    } else {
      // Mark all fields as touched
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
   * Scrolls to top of page
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
}

