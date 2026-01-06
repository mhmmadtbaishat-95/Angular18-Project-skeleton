/**
 * API Endpoints Configuration
 * Centralized endpoint definitions for all API calls
 * 
 * All endpoints are relative to the base URL configured in RuntimeConfigService
 * 
 * @example
 * // Using in service
 * import { ENDPOINTS } from '@data/http/endpoints';
 * 
 * this.http.get(ENDPOINTS.AUTH.LOGIN, credentials);
 * this.http.get(ENDPOINTS.USERS.BY_ID.replace(':id', userId));
 */

/**
 * Auth endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  VERIFY: '/auth/verify',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  ME: '/auth/me', // Get current user
} as const;

/**
 * User endpoints
 */
export const USER_ENDPOINTS = {
  BASE: '/users',
  PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  BY_ID: '/users/:id',
  LIST: '/users',
  CREATE: '/users',
  UPDATE: '/users/:id',
  DELETE: '/users/:id',
  CHANGE_PASSWORD: '/users/change-password',
} as const;

/**
 * Dashboard endpoints
 */
export const DASHBOARD_ENDPOINTS = {
  BASE: '/dashboard',
  STATS: '/dashboard/stats',
  OVERVIEW: '/dashboard/overview',
} as const;

/**
 * Service Request endpoints
 */
export const SERVICE_REQUEST_ENDPOINTS = {
  BASE: '/service-requests',
  SUBMIT: '/service-requests',
  BY_ID: '/service-requests/:id',
  LIST: '/service-requests',
  DEVELOPER_INFO: '/developers/current',
  UPLOAD_DOCUMENTS: '/service-requests/:id/documents',
  DOCUMENT_TYPES: '/service-requests/document-types',
  SERVICES: '/services',
  SERVICE_BY_ID: '/services/:id',
} as const;

/**
 * All API endpoints grouped by feature
 */
export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USERS: USER_ENDPOINTS,
  DASHBOARD: DASHBOARD_ENDPOINTS,
  SERVICE_REQUEST: SERVICE_REQUEST_ENDPOINTS,
} as const;

/**
 * Public endpoints that don't require authentication
 * Used by auth interceptor to skip token injection
 */
export const PUBLIC_ENDPOINTS: readonly string[] = [
  AUTH_ENDPOINTS.LOGIN,
  AUTH_ENDPOINTS.REGISTER,
  AUTH_ENDPOINTS.FORGOT_PASSWORD,
  AUTH_ENDPOINTS.RESET_PASSWORD,
  AUTH_ENDPOINTS.VERIFY,
] as const;

/**
 * Helper function to build endpoint with path parameters
 * 
 * @example
 * buildEndpoint(USER_ENDPOINTS.BY_ID, { id: '123' }) // '/users/123'
 * buildEndpoint('/api/:version/:resource', { version: 'v1', resource: 'users' }) // '/api/v1/users'
 * 
 * @param endpoint - Endpoint template with :param placeholders
 * @param params - Object with parameter values
 * @returns Final endpoint string with parameters replaced
 */
export function buildEndpoint(
  endpoint: string,
  params: Record<string, string | number>
): string {
  let result = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  return result;
}

/**
 * Helper function to build query string
 * 
 * @example
 * buildQuery({ page: 1, limit: 10 }) // '?page=1&limit=10'
 * buildQuery({ search: 'test', filter: 'active' }) // '?search=test&filter=active'
 * 
 * @param params - Query parameters object
 * @returns Query string (starts with ?)
 */
export function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Helper function to build full URL with endpoint, path params, and query
 * 
 * @example
 * buildUrl(USER_ENDPOINTS.BY_ID, { id: '123' }, { include: 'profile' }) 
 * // '/users/123?include=profile'
 * 
 * @param endpoint - Endpoint template
 * @param pathParams - Path parameters (optional)
 * @param queryParams - Query parameters (optional)
 * @returns Complete URL with path and query
 */
export function buildUrl(
  endpoint: string,
  pathParams?: Record<string, string | number>,
  queryParams?: Record<string, string | number | boolean | null | undefined>
): string {
  let url = pathParams ? buildEndpoint(endpoint, pathParams) : endpoint;
  if (queryParams) {
    url += buildQuery(queryParams);
  }
  return url;
}

