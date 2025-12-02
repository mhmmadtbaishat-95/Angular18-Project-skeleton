import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoggerService } from '@core/services/logger/logger.service';
import { HttpStatus } from '@core/enums/http-status.enum';
import { throwError, timer } from 'rxjs';
import { retryWhen, mergeMap, take } from 'rxjs/operators';

/**
 * Retry interceptor configuration
 */
interface IRetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
  exponentialBackoff: boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: IRetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [
    HttpStatus.INTERNAL_SERVER_ERROR,
    HttpStatus.BAD_GATEWAY,
    HttpStatus.SERVICE_UNAVAILABLE,
    HttpStatus.GATEWAY_TIMEOUT
  ],
  exponentialBackoff: true
};

/**
 * Retry interceptor
 * Automatically retries failed HTTP requests
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);

  // Skip retry if flag is set
  if (req.headers.get('skip-retry') === 'true') {
    const cloned = req.clone({
      headers: req.headers.delete('skip-retry')
    });
    return next(cloned);
  }

  // Get retry config from headers or use default
  const config = getRetryConfig(req);

  return next(req).pipe(
    retryWhen((errors) => {
      let retryCount = 0;
      return errors.pipe(
        mergeMap((error: HttpErrorResponse) => {
          // Check if error is retryable
          if (!isRetryable(error, config)) {
            return throwError(() => error);
          }

          // Check if max retries reached
          if (retryCount >= config.maxRetries) {
            logger.warn('Max retries reached', {
              url: req.url,
              retries: retryCount
            });
            return throwError(() => error);
          }

          retryCount++;
          const delay = calculateDelay(retryCount, config);

          logger.debug('Retrying request', {
            url: req.url,
            attempt: retryCount,
            delay
          });

          return timer(delay);
        }),
        take(config.maxRetries + 1)
      );
    })
  );
};

/**
 * Gets retry configuration from request or uses default
 */
function getRetryConfig(req: HttpRequest<unknown>): IRetryConfig {
  const maxRetries = parseInt(req.headers.get('max-retries') || '0', 10);
  const retryDelay = parseInt(req.headers.get('retry-delay') || '0', 10);
  const exponentialBackoff = req.headers.get('exponential-backoff') !== 'false';

  return {
    maxRetries: maxRetries || DEFAULT_RETRY_CONFIG.maxRetries,
    retryDelay: retryDelay || DEFAULT_RETRY_CONFIG.retryDelay,
    retryableStatusCodes: DEFAULT_RETRY_CONFIG.retryableStatusCodes,
    exponentialBackoff
  };
}

/**
 * Checks if error is retryable
 */
function isRetryable(error: HttpErrorResponse, config: IRetryConfig): boolean {
  // Don't retry client errors (4xx) except specific ones
  if (error.status >= 400 && error.status < 500) {
    return config.retryableStatusCodes.includes(error.status);
  }

  // Retry server errors (5xx) and network errors (0)
  return (
    error.status === 0 ||
    error.status >= 500 ||
    config.retryableStatusCodes.includes(error.status)
  );
}

/**
 * Calculates delay for retry
 */
function calculateDelay(retryCount: number, config: IRetryConfig): number {
  if (!config.exponentialBackoff) {
    return config.retryDelay;
  }

  // Exponential backoff: delay * 2^(retryCount - 1)
  return config.retryDelay * Math.pow(2, retryCount - 1);
}

