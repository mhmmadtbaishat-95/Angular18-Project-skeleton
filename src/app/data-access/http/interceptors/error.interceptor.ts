import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ErrorHandlerService } from '@core/error-handling/error-handler.service';
import { catchError, throwError } from 'rxjs';

/**
 * Error interceptor
 * Handles HTTP errors globally
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);

  // Skip error handling if flag is set
  if (req.headers.get('skip-error-handling') === 'true') {
    const cloned = req.clone({
      headers: req.headers.delete('skip-error-handling')
    });
    return next(cloned);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle network errors
      if (!error.error && error.status === 0) {
        errorHandler.handleError(
          errorHandler.createError(
            'Network error. Please check your connection.',
            'NETWORK_ERROR'
          )
        );
        return throwError(() => error);
      }

      // Handle HTTP errors
      errorHandler.handleHttpError(error);
      return throwError(() => error);
    })
  );
};

