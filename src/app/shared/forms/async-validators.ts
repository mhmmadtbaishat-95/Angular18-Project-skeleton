import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

/**
 * Async validators
 * Collection of asynchronous form validators
 */

/**
 * Validates that email is unique (async)
 * @param checkEmailFn - Function to check if email exists
 * @returns Async validator function
 * @example
 * this.form = this.fb.group({
 *   email: ['', {
 *     validators: [Validators.required, Validators.email],
 *     asyncValidators: [emailUniqueValidator(this.authService.checkEmailExists.bind(this.authService))]
 *   }]
 * });
 */
export function emailUniqueValidator(
  checkEmailFn: (email: string) => Observable<boolean>
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }

    return checkEmailFn(control.value).pipe(
      map((exists) => (exists ? { emailExists: true } : null)),
      delay(500) // Debounce delay
    );
  };
}

/**
 * Validates that username is unique (async)
 * @param checkUsernameFn - Function to check if username exists
 * @returns Async validator function
 * @example
 * this.form = this.fb.group({
 *   username: ['', {
 *     validators: [Validators.required],
 *     asyncValidators: [usernameUniqueValidator(this.authService.checkUsernameExists.bind(this.authService))]
 *   }]
 * });
 */
export function usernameUniqueValidator(
  checkUsernameFn: (username: string) => Observable<boolean>
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }

    return checkUsernameFn(control.value).pipe(
      map((exists) => (exists ? { usernameExists: true } : null)),
      delay(500) // Debounce delay
    );
  };
}

