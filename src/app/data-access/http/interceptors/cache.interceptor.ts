import { HttpInterceptorFn, HttpResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CacheService } from '@core/services/cache/cache.service';
import { CacheStrategy } from '@core/services/cache/cache.interface';
import { Observable, of, throwError } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { HttpEvent } from '@angular/common/http';

/**
 * Cache interceptor
 * Implements HTTP response caching with different strategies
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(CacheService);

  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Skip cache if flag is set
  if (req.headers.get('skip-cache') === 'true') {
    const cloned = req.clone({
      headers: req.headers.delete('skip-cache')
    });
    return next(cloned);
  }

  // Get cache strategy from header or use default
  const strategy = (req.headers.get('cache-strategy') as CacheStrategy) || 'cache-first';
  const cacheKey = getCacheKey(req);
  const ttl = getCacheTTL(req);

  // Handle different cache strategies
  switch (strategy) {
    case 'cache-only':
      return handleCacheOnly(cacheKey, cacheService);
    case 'network-only':
      return handleNetworkOnly(req, next, cacheKey, ttl, cacheService);
    case 'network-first':
      return handleNetworkFirst(req, next, cacheKey, ttl, cacheService);
    case 'cache-first':
    default:
      return handleCacheFirst(req, next, cacheKey, ttl, cacheService);
  }
};

/**
 * Gets cache key from request
 */
function getCacheKey(req: HttpRequest<unknown>): string {
  const url = req.urlWithParams || req.url;
  return `http_cache:${url}`;
}

/**
 * Gets cache TTL from request headers
 */
function getCacheTTL(req: HttpRequest<unknown>): number | undefined {
  const ttlHeader = req.headers.get('cache-ttl');
  if (ttlHeader) {
    return parseInt(ttlHeader, 10);
  }
  return undefined;
}

/**
 * Handles cache-only strategy
 */
function handleCacheOnly(cacheKey: string, cacheService: CacheService): Observable<HttpResponse<unknown>> {
  return cacheService.get<HttpResponse<unknown>>(cacheKey).pipe(
    switchMap((cached) => {
      if (!cached) {
        return throwError(() => new Error('Cache miss for cache-only strategy'));
      }
      return of(cached);
    })
  );
}

/**
 * Handles network-only strategy
 */
function handleNetworkOnly(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  cacheKey: string,
  ttl: number | undefined,
  cacheService: CacheService
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cacheService.set(cacheKey, event, ttl);
      }
    })
  );
}

/**
 * Handles cache-first strategy
 */
function handleCacheFirst(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  cacheKey: string,
  ttl: number | undefined,
  cacheService: CacheService
): Observable<HttpEvent<unknown>> {
  return cacheService.get<HttpResponse<unknown>>(cacheKey).pipe(
    switchMap((cached) => {
      if (cached) {
        return of(cached);
      }
      return next(req).pipe(
        tap((event) => {
          if (event instanceof HttpResponse) {
            cacheService.set(cacheKey, event, ttl);
          }
        })
      );
    })
  );
}

/**
 * Handles network-first strategy
 */
function handleNetworkFirst(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  cacheKey: string,
  ttl: number | undefined,
  cacheService: CacheService
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cacheService.set(cacheKey, event, ttl);
      }
    })
  );
}

