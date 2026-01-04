import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of, delay } from 'rxjs';
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
import { UserRole } from '../../enums/user-role.enum';

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

    // Check if this is a simulation user (for development/testing)
    const isSimulationUser = user?.email === 'mohammad.tubishat@pwc.com';

    if (user && accessToken) {
      // For simulation users, skip token expiration check
      // For real users, check if token is expired
      const isTokenValid = isSimulationUser || !this.tokenService.isAccessTokenExpired();
      
      if (isTokenValid) {
        this.updateAuthState({
          isAuthenticated: true,
          user,
          accessToken,
          refreshToken,
          isLoading: false,
          error: null
        });
        if (!isSimulationUser) {
          this.refreshTokenService.startAutoRefresh();
        }
      } else {
        this.clearAuth();
      }
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

    // Simulation mode: Check if email matches the simulation user
    if (credentials.email === 'mohammad.tubishat@pwc.com' || 
        credentials.email.toLowerCase() === 'mohammad.tubishat@pwc.com') {
      return this.simulateLogin(credentials.rememberMe);
    }

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
   * Simulates login for development/testing purposes
   * Stores user data in local storage
   * @param rememberMe - Whether to remember the user
   * @private
   */
  private simulateLogin(rememberMe: boolean = false): Observable<IAuthResponse> {
    // Generate mock tokens (simple base64 encoded strings for simulation)
    const mockAccessToken = btoa(JSON.stringify({
      sub: 'user-123',
      email: 'mohammad.tubishat@pwc.com',
      username: 'Mohammad Tubishat',
      role: UserRole.USER,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));

    const mockRefreshToken = btoa(JSON.stringify({
      sub: 'user-123',
      tokenId: 'refresh-token-123',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }));

    // Create mock user object
    const mockUser: IUser = {
      id: 'user-123',
      email: 'mohammad.tubishat@pwc.com',
      username: 'Mohammad Tubishat',
      firstName: 'Mohammad',
      lastName: 'Tubishat',
      role: UserRole.USER,
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const authResponse: IAuthResponse = {
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      user: mockUser,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    };

    // Simulate network delay
    return of(authResponse).pipe(
      delay(500), // 500ms delay to simulate API call
      tap(() => {
        this.handleAuthSuccess(authResponse, rememberMe);
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

    // Check if user is from simulation (check email in stored user)
    const currentUser = this.getCurrentUser();
    const isSimulation = currentUser?.email === 'mohammad.tubishat@pwc.com';

    if (isSimulation) {
      // Simulate logout for development
      return of(void 0).pipe(
        delay(200),
        tap(() => {
          this.clearAuth();
          this.router.navigate(['/auth/login']);
        })
      );
    }

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
    if (!state.isAuthenticated || !state.accessToken) {
      return false;
    }
    
    // Check if this is a simulation user (for development/testing)
    const isSimulationUser = state.user?.email === 'mohammad.tubishat@pwc.com';
    
    // For simulation users, skip token expiration check
    if (isSimulationUser) {
      return true;
    }
    
    // For real users, check if token is expired
    return !this.tokenService.isAccessTokenExpired();
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

