import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validators
 * Collection of reusable form validators
 */

/**
 * Validates that password and confirm password match
 * @param passwordField - Name of password field
 * @param confirmPasswordField - Name of confirm password field
 * @returns Validator function
 * @example
 * this.form = this.fb.group({
 *   password: ['', Validators.required],
 *   confirmPassword: ['', [Validators.required, matchValidator('password')]]
 * });
 */
export function matchValidator(
  passwordField: string,
  confirmPasswordField: string = 'confirmPassword'
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordField);
    const confirmPassword = control.get(confirmPasswordField);

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    return null;
  };
}

/**
 * Validates that value is not whitespace only
 * @returns Validator function
 * @example
 * this.form = this.fb.group({
 *   name: ['', [Validators.required, noWhitespaceValidator()]]
 * });
 */
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || typeof control.value !== 'string') {
      return null;
    }
    const isWhitespace = control.value.trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  };
}

/**
 * Validates email format
 * @returns Validator function
 * @example
 * this.form = this.fb.group({
 *   email: ['', [Validators.required, emailValidator()]]
 * });
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(control.value);
    return isValid ? null : { invalidEmail: true };
  };
}

/**
 * Validates password strength
 * @returns Validator function
 * @example
 * this.form = this.fb.group({
 *   password: ['', [Validators.required, passwordStrengthValidator()]]
 * });
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value as string;
    const errors: ValidationErrors = {};

    if (value.length < 8) {
      errors['minLength'] = true;
    }
    if (!/[A-Z]/.test(value)) {
      errors['uppercase'] = true;
    }
    if (!/[a-z]/.test(value)) {
      errors['lowercase'] = true;
    }
    if (!/[0-9]/.test(value)) {
      errors['number'] = true;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors['special'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

