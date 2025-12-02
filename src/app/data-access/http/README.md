# HTTP Layer

This directory contains all HTTP-related functionality including clients, interceptors, endpoints, and models.

## Structure

```
data-access/http/
├── endpoints.ts          # Centralized API endpoint definitions
├── interceptors/         # HTTP interceptors (auth, error, cache, etc.)
├── models/              # HTTP response models and types
├── services/            # HTTP client services
└── repositories/        # Data repositories (for future use)
```

## Endpoints (`endpoints.ts`)

Centralized configuration for all API endpoints.

### Usage

```typescript
import { ENDPOINTS, buildEndpoint, buildUrl } from '@data/http/endpoints';

// Simple endpoint
const url = ENDPOINTS.AUTH.LOGIN; // '/auth/login'

// With path parameters
const userUrl = buildEndpoint(ENDPOINTS.USERS.BY_ID, { id: '123' }); 
// '/users/123'

// With query parameters
const listUrl = buildUrl(ENDPOINTS.USERS.LIST, undefined, { page: 1, limit: 10 });
// '/users?page=1&limit=10'

// Combined
const fullUrl = buildUrl(
  ENDPOINTS.USERS.UPDATE, 
  { id: '123' }, 
  { include: 'profile' }
);
// '/users/123?include=profile'
```

### Available Endpoints

#### Auth Endpoints
- `ENDPOINTS.AUTH.LOGIN` - User login
- `ENDPOINTS.AUTH.REGISTER` - User registration
- `ENDPOINTS.AUTH.LOGOUT` - User logout
- `ENDPOINTS.AUTH.REFRESH` - Refresh access token
- `ENDPOINTS.AUTH.VERIFY` - Verify token
- `ENDPOINTS.AUTH.FORGOT_PASSWORD` - Request password reset
- `ENDPOINTS.AUTH.RESET_PASSWORD` - Reset password
- `ENDPOINTS.AUTH.ME` - Get current user

#### User Endpoints
- `ENDPOINTS.USERS.BASE` - Base users endpoint
- `ENDPOINTS.USERS.PROFILE` - Get user profile
- `ENDPOINTS.USERS.UPDATE_PROFILE` - Update profile
- `ENDPOINTS.USERS.BY_ID` - Get user by ID (use `buildEndpoint()`)
- `ENDPOINTS.USERS.LIST` - List users
- `ENDPOINTS.USERS.CREATE` - Create user
- `ENDPOINTS.USERS.UPDATE` - Update user (use `buildEndpoint()`)
- `ENDPOINTS.USERS.DELETE` - Delete user (use `buildEndpoint()`)
- `ENDPOINTS.USERS.CHANGE_PASSWORD` - Change password

#### Dashboard Endpoints
- `ENDPOINTS.DASHBOARD.BASE` - Base dashboard endpoint
- `ENDPOINTS.DASHBOARD.STATS` - Dashboard statistics
- `ENDPOINTS.DASHBOARD.OVERVIEW` - Dashboard overview

### Helper Functions

#### `buildEndpoint(endpoint, params)`
Builds endpoint with path parameters.

```typescript
buildEndpoint('/users/:id', { id: '123' }) 
// Returns: '/users/123'
```

#### `buildQuery(params)`
Builds query string from parameters.

```typescript
buildQuery({ page: 1, limit: 10, active: true })
// Returns: '?page=1&limit=10&active=true'
```

#### `buildUrl(endpoint, pathParams?, queryParams?)`
Builds complete URL with path and query parameters.

```typescript
buildUrl('/users/:id', { id: '123' }, { include: 'profile' })
// Returns: '/users/123?include=profile'
```

### Public Endpoints

Endpoints that don't require authentication are defined in `PUBLIC_ENDPOINTS` and used by the auth interceptor to skip token injection.

## Services

### `HttpClientService`
Wrapper around Angular's HttpClient with automatic base URL handling and response unwrapping.

### `ApiService`
Typed service methods for API endpoints. Provides convenience methods for common operations.

## Interceptors

All interceptors are functional interceptors located in `interceptors/`:
- `auth.interceptor.ts` - Adds Bearer token, handles refresh
- `error.interceptor.ts` - Global error handling
- `loading.interceptor.ts` - Global loading state
- `cache.interceptor.ts` - HTTP response caching
- `retry.interceptor.ts` - Automatic retry logic
- `logging.interceptor.ts` - Request/response logging

## Adding New Endpoints

1. Add endpoint to appropriate constant in `endpoints.ts`:
```typescript
export const PRODUCTS_ENDPOINTS = {
  BASE: '/products',
  LIST: '/products',
  BY_ID: '/products/:id',
} as const;
```

2. Add to `ENDPOINTS` object:
```typescript
export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USERS: USER_ENDPOINTS,
  DASHBOARD: DASHBOARD_ENDPOINTS,
  PRODUCTS: PRODUCTS_ENDPOINTS, // Add here
} as const;
```

3. Use in services:
```typescript
import { ENDPOINTS, buildEndpoint } from '@data/http/endpoints';

getProduct(id: string) {
  return this.http.get(buildEndpoint(ENDPOINTS.PRODUCTS.BY_ID, { id }));
}
```

