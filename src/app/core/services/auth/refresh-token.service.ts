import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer } from 'rxjs';
import { catchError, switchMap, tap, retry } from 'rxjs/operators';
import { TokenService } from './token.service';
import { ENDPOINTS } from '@data/http/endpoints';
import { environment } from '../../../../environments/environment';
import { IRefreshTokenResponse } from '../../models/auth.model';
import { TIMEOUTS } from '../../constants/app.constants';

/**
 * Refresh token service
 * Handles automatic token refresh and token refresh scheduling
 */
@Injectable({
  providedIn: 'root'
})
export class RefreshTokenService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly isRefreshingSubject = new BehaviorSubject<boolean>(false);
  private refreshTimer: any = null;

  public readonly isRefreshing$ = this.isRefreshingSubject.asObservable();

  /**
   * Refreshes the access token using the refresh token
   * @returns Observable of refresh token response
   * @example
   * this.refreshTokenService.refreshToken().subscribe({
   *   next: (response) => console.log('Token refreshed'),
   *   error: (error) => console.error('Refresh failed', error)
   * });
   */
  refreshToken(): Observable<IRefreshTokenResponse> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    this.isRefreshingSubject.next(true);

    const url = `${environment.apiUrl}${ENDPOINTS.AUTH.REFRESH}`;

    return this.http
      .post<IRefreshTokenResponse>(url, { refreshToken })
      .pipe(
        tap((response) => {
          this.tokenService.setAccessToken(response.accessToken);
          if (response.refreshToken) {
            this.tokenService.setRefreshToken(response.refreshToken);
          }
          this.isRefreshingSubject.next(false);
          this.scheduleTokenRefresh();
        }),
        catchError((error: HttpErrorResponse) => {
          this.isRefreshingSubject.next(false);
          this.handleRefreshError(error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Handles refresh token errors
   * @param error - HTTP error response
   * @private
   */
  private handleRefreshError(error: HttpErrorResponse): void {
    if (error.status === 401 || error.status === 403) {
      // Refresh token is invalid, clear tokens
      this.tokenService.clearTokens();
      // TODO: Emit event to trigger logout or redirect to login
    }
  }

  /**
   * Schedules automatic token refresh before expiration
   * @private
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const expiration = this.tokenService.getAccessTokenExpiration();
    if (!expiration) {
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = expiration - now;
    const refreshTime =
      timeUntilExpiry - TIMEOUTS.TOKEN_REFRESH_BEFORE_EXPIRY;

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().subscribe({
          error: (error) => {
            console.error('Scheduled token refresh failed:', error);
          }
        });
      }, refreshTime);
    } else {
      // Token expires soon, refresh immediately
      this.refreshToken().subscribe({
        error: (error) => {
          console.error('Immediate token refresh failed:', error);
        }
      });
    }
  }

  /**
   * Starts automatic token refresh scheduling
   * Should be called after successful login
   * @example
   * this.refreshTokenService.startAutoRefresh();
   */
  startAutoRefresh(): void {
    if (this.tokenService.hasTokens()) {
      this.scheduleTokenRefresh();
    }
  }

  /**
   * Stops automatic token refresh
   * Should be called on logout
   * @example
   * this.refreshTokenService.stopAutoRefresh();
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Checks if token refresh is in progress
   * @returns True if refresh is in progress
   * @example
   * if (this.refreshTokenService.isRefreshing()) {
   *   // Wait for refresh to complete
   * }
   */
  isRefreshing(): boolean {
    return this.isRefreshingSubject.value;
  }
}

