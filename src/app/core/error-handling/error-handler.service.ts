import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from '@core/services/logger/logger.service';
import { NotificationService } from '@core/services/notification/notification.service';
import { HttpStatus } from '@core/enums/http-status.enum';
import {
  HttpError,
  ValidationError,
  AuthenticationError,
  BusinessLogicError,
  IAppError
} from '@core/models/error.model';

/**
 * Error handler service
 * Centralized error handling and processing
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private readonly logger = inject(LoggerService);
  private readonly notificationService = inject(NotificationService);

  /**
   * Handles HTTP errors
   * @param error - HTTP error response
   * @returns User-friendly error message
   * @example
   * this.errorHandler.handleHttpError(error).subscribe(message => {
   *   // Handle error message
   * });
   */
  handleHttpError(error: HttpErrorResponse): string {
    let message = 'An unexpected error occurred';

    if (!error.error) {
      message = this.getErrorMessageForStatus(error.status);
      this.logger.error('HTTP Error', { status: error.status, message });
      this.notificationService.error(message);
      return message;
    }

    // Handle different error types
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      message = error.error.message || 'A client-side error occurred';
      this.logger.error('Client Error', error.error);
    } else {
      // Server-side error
      const serverError = error.error;
      message = serverError.message || this.getErrorMessageForStatus(error.status);

      // Handle validation errors
      if (error.status === HttpStatus.UNPROCESSABLE_ENTITY && serverError.errors) {
        message = this.formatValidationErrors(serverError.errors);
      }

      this.logger.error('Server Error', {
        status: error.status,
        error: serverError
      });
    }

    this.notificationService.error(message);
    return message;
  }

  /**
   * Handles application errors
   * @param error - Application error
   * @returns User-friendly error message
   * @example
   * this.errorHandler.handleError(error);
   */
  handleError(error: Error | IAppError): string {
    let message = 'An unexpected error occurred';

    if (error instanceof HttpError) {
      message = error.message;
      this.logger.error('HTTP Error', error);
    } else if (error instanceof ValidationError) {
      message = this.formatValidationErrors(error.errors);
      this.logger.warn('Validation Error', error);
    } else if (error instanceof AuthenticationError) {
      message = error.message;
      this.logger.warn('Authentication Error', error);
    } else if (error instanceof BusinessLogicError) {
      message = error.message;
      this.logger.error('Business Logic Error', error);
    } else {
      message = error.message || 'An unexpected error occurred';
      this.logger.error('Unknown Error', error);
    }

    this.notificationService.error(message);
    return message;
  }

  /**
   * Gets error message for HTTP status code
   * @param status - HTTP status code
   * @returns Error message
   * @private
   */
  private getErrorMessageForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Invalid request. Please check your input.';
      case HttpStatus.UNAUTHORIZED:
        return 'You are not authorized to perform this action.';
      case HttpStatus.FORBIDDEN:
        return 'Access denied. You do not have permission.';
      case HttpStatus.NOT_FOUND:
        return 'The requested resource was not found.';
      case HttpStatus.CONFLICT:
        return 'A conflict occurred. The resource may already exist.';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Validation failed. Please check your input.';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'An internal server error occurred. Please try again later.';
      case HttpStatus.BAD_GATEWAY:
        return 'Bad gateway. The server is temporarily unavailable.';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service is temporarily unavailable. Please try again later.';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'Request timeout. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Formats validation errors into a readable message
   * @param errors - Validation errors object
   * @returns Formatted error message
   * @private
   */
  private formatValidationErrors(errors: Record<string, string[]> | string[]): string {
    if (Array.isArray(errors)) {
      return errors.join(', ');
    }

    const messages: string[] = [];
    for (const [field, fieldErrors] of Object.entries(errors)) {
      if (Array.isArray(fieldErrors)) {
        messages.push(`${field}: ${fieldErrors.join(', ')}`);
      } else {
        messages.push(`${field}: ${fieldErrors}`);
      }
    }

    return messages.join('; ');
  }

  /**
   * Creates an application error object
   * @param message - Error message
   * @param code - Error code
   * @param details - Additional details
   * @returns Application error object
   * @example
   * const error = this.errorHandler.createError('Operation failed', 'OP001', { userId: '123' });
   */
  createError(message: string, code?: string, details?: any): IAppError {
    return {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    };
  }
}

