import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppStateService } from '@core/services/state/app-state.service';
import { finalize } from 'rxjs';

// Track active requests globally
let activeRequests = 0;

/**
 * Loading interceptor
 * Manages global loading state for HTTP requests
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const appState = inject(AppStateService);

  // Skip loading for specific requests
  if (req.headers.get('skip-loading') === 'true') {
    const cloned = req.clone({
      headers: req.headers.delete('skip-loading')
    });
    return next(cloned);
  }

  // Increment active requests
  activeRequests++;
  if (activeRequests === 1) {
    appState.setLoading(true);
  }

  return next(req).pipe(
    finalize(() => {
      // Decrement active requests
      activeRequests--;
      if (activeRequests === 0) {
        appState.setLoading(false);
      }
    })
  );
};
