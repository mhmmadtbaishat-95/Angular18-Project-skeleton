import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '@core/services/auth/token.service';
import { RefreshTokenService } from '@core/services/auth/refresh-token.service';
import { PUBLIC_ENDPOINTS } from '../endpoints';
import { catchError, switchMap, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

// Track refresh state globally across requests
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<boolean>(false);

/**
 * Auth interceptor
 * Adds Bearer token to requests and handles token refresh
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const refreshTokenService = inject(RefreshTokenService);

  // Skip auth for public endpoints
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  // Skip auth if skipAuth flag is set
  if (req.headers.get('skip-auth') === 'true') {
    const cloned = req.clone({
      headers: req.headers.delete('skip-auth')
    });
    return next(cloned);
  }

  // Add token to request
  const authRequest = addTokenToRequest(req, tokenService);

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && !isRefreshing) {
        return handle401Error(req, next, tokenService, refreshTokenService);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Adds Bearer token to request
 */
function addTokenToRequest(req: HttpRequest<unknown>, tokenService: TokenService): HttpRequest<unknown> {
  const token = tokenService.getAccessToken();

  if (!token) {
    return req;
  }

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Checks if endpoint is public (doesn't require auth)
 */
function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

/**
 * Handles 401 Unauthorized errors by attempting token refresh
 */
function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService,
  refreshTokenService: RefreshTokenService
) {
  if (isRefreshing) {
    // If already refreshing, wait for the refresh to complete
    return refreshSubject.pipe(
      switchMap(() => {
        return next(addTokenToRequest(req, tokenService));
      })
    );
  }

  isRefreshing = true;
  refreshSubject.next(true);

  return refreshTokenService.refreshToken().pipe(
    switchMap(() => {
      isRefreshing = false;
      refreshSubject.next(false);
      // Retry the original request with new token
      return next(addTokenToRequest(req, tokenService));
    }),
    catchError((error) => {
      isRefreshing = false;
      refreshSubject.next(false);
      // Refresh failed, clear tokens and redirect to login
      tokenService.clearTokens();
      // TODO: Navigate to login page or emit logout event
      return throwError(() => error);
    })
  );
}
