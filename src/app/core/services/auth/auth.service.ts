import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { TokenService } from './token.service';
import { RefreshTokenService } from './refresh-token.service';
import { StorageService } from '../storage/storage.service';
import { CacheType } from '../../enums/cache-type.enum';
import { STORAGE_KEYS } from '../../constants/storage-keys.constants';
import { ENDPOINTS } from '@data/http/endpoints';
import { environment } from '../../../../environments/environment';
import {
  ILoginRequest,
  IRegisterRequest,
  IAuthResponse,
  IAuthState
} from '../../models/auth.model';
import { IUser } from '../../models/user.model';
import { IApiResponse } from '../../models/api-response.model';
import { AuthenticationError } from '../../models/error.model';

/**
 * Authentication service
 * Handles user authentication, login, logout, and registration
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly refreshTokenService = inject(RefreshTokenService);
  private readonly storageService = inject(StorageService);

  private readonly authStateSubject = new BehaviorSubject<IAuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    error: null
  });

  public readonly authState$ = this.authStateSubject.asObservable();
  public readonly isAuthenticated$ = this.authState$.pipe(
    map((state) => state.isAuthenticated)
  );
  public readonly currentUser$ = this.authState$.pipe(
    map((state) => state.user)
  );
  public readonly isLoading$ = this.authState$.pipe(
    map((state) => state.isLoading)
  );

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initializes authentication state from storage
   * @private
   */
  private initializeAuth(): void {
    const user = this.storageService.getItem<IUser>(
      STORAGE_KEYS.USER,
      CacheType.LOCAL_STORAGE
    );
    const accessToken = this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();

    if (user && accessToken && !this.tokenService.isAccessTokenExpired()) {
      this.updateAuthState({
        isAuthenticated: true,
        user,
        accessToken,
        refreshToken,
        isLoading: false,
        error: null
      });
      this.refreshTokenService.startAutoRefresh();
    } else {
      this.clearAuth();
    }
  }

  /**
   * Updates the authentication state
   * @param updates - Partial state updates
   * @private
   */
  private updateAuthState(updates: Partial<IAuthState>): void {
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({ ...currentState, ...updates });
  }

  /**
   * Logs in a user
   * @param credentials - Login credentials
   * @returns Observable of authentication response
   * @example
   * this.authService.login({ email: 'user@example.com', password: 'password' })
   *   .subscribe({
   *     next: (response) => console.log('Login successful'),
   *     error: (error) => console.error('Login failed', error)
   *   });
   */
  login(credentials: ILoginRequest): Observable<IAuthResponse> {
    this.updateAuthState({ isLoading: true, error: null });

    const url = `${environment.apiUrl}${ENDPOINTS.AUTH.LOGIN}`;

    return this.http.post<IApiResponse<IAuthResponse>>(url, credentials).pipe(
      map((response) => response.data),
      tap((authResponse) => {
        this.handleAuthSuccess(authResponse, credentials.rememberMe);
      }),
      catchError((error) => {
        this.updateAuthState({
          isLoading: false,
          error: error.message || 'Login failed'
        });
        return throwError(() => new AuthenticationError(error.message));
      })
    );
  }

  /**
   * Registers a new user
   * @param userData - Registration data
   * @returns Observable of authentication response
   * @example
   * this.authService.register({
   *   email: 'user@example.com',
   *   username: 'username',
   *   password: 'password',
   *   firstName: 'John',
   *   lastName: 'Doe'
   * }).subscribe({
   *   next: (response) => console.log('Registration successful'),
   *   error: (error) => console.error('Registration failed', error)
   * });
   */
  register(userData: IRegisterRequest): Observable<IAuthResponse> {
    this.updateAuthState({ isLoading: true, error: null });

    const url = `${environment.apiUrl}${ENDPOINTS.AUTH.REGISTER}`;

    return this.http.post<IApiResponse<IAuthResponse>>(url, userData).pipe(
      map((response) => response.data),
      tap((authResponse) => {
        this.handleAuthSuccess(authResponse, false);
      }),
      catchError((error) => {
        this.updateAuthState({
          isLoading: false,
          error: error.message || 'Registration failed'
        });
        return throwError(() => new AuthenticationError(error.message));
      })
    );
  }

  /**
   * Handles successful authentication
   * @param authResponse - Authentication response
   * @param rememberMe - Whether to remember the user
   * @private
   */
  private handleAuthSuccess(
    authResponse: IAuthResponse,
    rememberMe: boolean = false
  ): void {
    this.tokenService.setTokens(
      authResponse.accessToken,
      authResponse.refreshToken,
      true
    );

    this.storageService.setItem(
      STORAGE_KEYS.USER,
      authResponse.user,
      CacheType.LOCAL_STORAGE
    );

    if (rememberMe) {
      this.storageService.setItem(
        STORAGE_KEYS.REMEMBER_ME,
        true,
        CacheType.LOCAL_STORAGE
      );
    }

    this.updateAuthState({
      isAuthenticated: true,
      user: authResponse.user,
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      isLoading: false,
      error: null
    });

    this.refreshTokenService.startAutoRefresh();
  }

  /**
   * Logs out the current user
   * @returns Observable that completes when logout is done
   * @example
   * this.authService.logout().subscribe(() => {
   *   console.log('Logged out successfully');
   * });
   */
  logout(): Observable<void> {
    this.updateAuthState({ isLoading: true });

    const url = `${environment.apiUrl}${ENDPOINTS.AUTH.LOGOUT}`;

    return this.http.post<void>(url, {}).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      }),
      catchError((error) => {
        // Even if logout fails on server, clear local auth
        this.clearAuth();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clears authentication state and tokens
   * @private
   */
  private clearAuth(): void {
    this.tokenService.clearTokens();
    this.refreshTokenService.stopAutoRefresh();
    this.storageService.removeItem(
      STORAGE_KEYS.USER,
      CacheType.LOCAL_STORAGE
    );
    this.storageService.removeItem(
      STORAGE_KEYS.REMEMBER_ME,
      CacheType.LOCAL_STORAGE
    );

    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null
    });
  }

  /**
   * Gets the current user
   * @returns Current user or null
   * @example
   * const user = this.authService.getCurrentUser();
   */
  getCurrentUser(): IUser | null {
    return this.authStateSubject.value.user;
  }

  /**
   * Checks if user is authenticated
   * @returns True if authenticated
   * @example
   * if (this.authService.isAuthenticated()) {
   *   // User is logged in
   * }
   */
  isAuthenticated(): boolean {
    const state = this.authStateSubject.value;
    return (
      state.isAuthenticated &&
      !!state.accessToken &&
      !this.tokenService.isAccessTokenExpired()
    );
  }

  /**
   * Checks if current token needs refresh
   * @returns True if token should be refreshed
   * @example
   * if (this.authService.shouldRefreshToken()) {
   *   this.refreshTokenService.refreshToken().subscribe();
   * }
   */
  shouldRefreshToken(): boolean {
    return this.tokenService.isAccessTokenExpired();
  }

  /**
   * Gets current authentication state
   * @returns Current auth state
   * @example
   * const state = this.authService.getAuthState();
   */
  getAuthState(): IAuthState {
    return this.authStateSubject.value;
  }
}

