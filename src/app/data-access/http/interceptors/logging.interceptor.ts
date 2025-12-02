import { HttpInterceptorFn, HttpResponse, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoggerService } from '@core/services/logger/logger.service';
import { environment } from '@environments/environment';
import { tap } from 'rxjs/operators';

/**
 * Logging interceptor
 * Logs all HTTP requests and responses
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);

  // Skip logging in production or if flag is set
  if (environment.production || req.headers.get('skip-logging') === 'true') {
    const cloned = req.headers.get('skip-logging')
      ? req.clone({
          headers: req.headers.delete('skip-logging')
        })
      : req;
    return next(cloned);
  }

  const startTime = Date.now();
  const method = req.method;
  const url = req.urlWithParams || req.url;

  // Log request
  logger.debug(`HTTP ${method} Request`, {
    url,
    headers: sanitizeHeaders(req.headers),
    body: req.body
  });

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          logger.debug(`HTTP ${method} Response`, {
            url,
            status: event.status,
            statusText: event.statusText,
            duration: `${duration}ms`,
            headers: sanitizeHeaders(event.headers),
            body: event.body
          });
        }
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        logger.error(`HTTP ${method} Error`, {
          url,
          status: error.status,
          statusText: error.statusText,
          duration: `${duration}ms`,
          error: error.message
        });
      }
    })
  );
};

/**
 * Sanitizes headers for logging (removes sensitive data)
 */
function sanitizeHeaders(headers: HttpHeaders): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  headers.keys().forEach((key: string) => {
    const lowerKey = key.toLowerCase();
    if (sensitiveHeaders.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else {
      sanitized[key] = headers.get(key) || '';
    }
  });

  return sanitized;
}

