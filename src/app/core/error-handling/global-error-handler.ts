import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ErrorHandlerService } from './error-handler.service';
import { LoggerService } from '../services/logger/logger.service';

/**
 * Global error handler
 * Catches all unhandled errors in the application
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly logger = inject(LoggerService);

  /**
   * Handles unhandled errors
   * @param error - Error object
   * @example
   * // Automatically called by Angular for unhandled errors
   */
  handleError(error: any): void {
    // Log the error
    this.logger.error('Unhandled Error', {
      message: error?.message,
      stack: error?.stack,
      error
    });

    // Handle the error
    if (error instanceof Error) {
      this.errorHandler.handleError(error);
    } else {
      this.errorHandler.handleError(
        this.errorHandler.createError(
          error?.message || 'An unexpected error occurred',
          'UNHANDLED_ERROR',
          error
        )
      );
    }

    // TODO: Send to error tracking service (e.g., Sentry)
    // Example: this.errorTrackingService.captureException(error);
  }
}

