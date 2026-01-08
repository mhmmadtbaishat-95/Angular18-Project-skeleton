import { IUser } from './user.model';

/**
 * Login request payload
 */
export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  username?: string; // Optional username to be used as firstName
}

/**
 * Register request payload
 */
export interface IRegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

/**
 * Authentication response
 */
export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
  expiresIn: number;
}

/**
 * Refresh token request
 */
export interface IRefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface IRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT token payload interface
 */
export interface IJwtPayload {
  sub: string; // User ID
  email: string;
  username: string;
  role: string;
  iat: number; // Issued at
  exp: number; // Expiration
  jti?: string; // JWT ID
}

/**
 * Authentication state
 */
export interface IAuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

