import { Injectable, inject } from '@angular/core';
import { BaseStore } from './base.store';
import { IUser } from '@core/models/user.model';
import { TokenService } from '@core/services/auth/token.service';

/**
 * Auth state interface
 */
export interface IAuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial auth state
 */
const initialState: IAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

/**
 * Auth store
 * Manages authentication state
 * 
 * @example
 * // In component
 * constructor(private authStore = inject(AuthStore)) {}
 * 
 * // Subscribe to state
 * authStore.state$.subscribe(state => {
 *   console.log('User:', state.user);
 * });
 * 
 * // Select specific property
 * authStore.select(state => state.isAuthenticated).subscribe(isAuth => {
 *   console.log('Authenticated:', isAuth);
 * });
 * 
 * // Update state
 * authStore.update({ user: newUser, isAuthenticated: true });
 * 
 * // Get current value
 * const isAuth = authStore.selectCurrent(state => state.isAuthenticated);
 */
@Injectable({
  providedIn: 'root'
})
export class AuthStore extends BaseStore<IAuthState> {
  private readonly tokenService = inject(TokenService);

  constructor() {
    super(initialState);
    // Initialize from stored token if available
    this.initializeFromToken();
  }

  /**
   * Initialize auth state from stored token
   */
  private initializeFromToken(): void {
    const token = this.tokenService.getAccessToken();
    if (token) {
      // Token exists, user might be authenticated
      // You can decode token here to get user info
      this.update({ isAuthenticated: true });
    }
  }

  /**
   * Set user and mark as authenticated
   */
  setUser(user: IUser): void {
    this.update({
      user,
      isAuthenticated: true,
      error: null
    });
  }

  /**
   * Clear user and mark as unauthenticated
   */
  clearUser(): void {
    this.update({
      user: null,
      isAuthenticated: false,
      error: null
    });
  }

  /**
   * Set loading state
   */
  setLoading(isLoading: boolean): void {
    this.update({ isLoading });
  }

  /**
   * Set error message
   */
  setError(error: string | null): void {
    this.update({ error });
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.set(initialState);
  }

  /**
   * Convenience getters
   */
  get user(): IUser | null {
    return this.selectCurrent(state => state.user);
  }

  get isAuthenticated(): boolean {
    return this.selectCurrent(state => state.isAuthenticated);
  }

  get isLoading(): boolean {
    return this.selectCurrent(state => state.isLoading);
  }

  get error(): string | null {
    return this.selectCurrent(state => state.error);
  }
}

