import { ICacheConfig } from '../app/core/services/cache/cache.interface';
import { LogLevel } from '../app/core/services/logger/logger.config';

/**
 * Production environment configuration
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com/api',
  apiVersion: 'v1',
  // Set to false when API is ready to use real endpoints
  useMockApi: false, // Change to false when API endpoints are ready
  cacheConfig: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 200,
    strategy: 'LRU' as const,
    enabled: true
  } as ICacheConfig,
  logLevel: LogLevel.ERROR,
  tokenConfig: {
    accessTokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiry: 15 * 60 * 1000 // 15 minutes
  },
  enableLogging: false,
  enableCache: true
};

