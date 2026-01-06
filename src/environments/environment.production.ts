import { ICacheConfig } from '../app/core/services/cache/cache.interface';
import { LogLevel } from '../app/core/services/logger/logger.config';

/**
 * Environment configuration
 */
export const environment = {
  production: false,
  apiUrl: 'https://aqaratintegrations.azurewebsites.net/API',
  apiVersion: 'v1',
  // Set to false when API is ready to use real endpoints
  useMockApi: false, // Change to false when API endpoints are ready
  // Set to true to enable license eligibility check (set to false during development while data is being finalized)
  enableLicenseEligibilityCheck: false, // Set to true when license status validation is ready for production
  cacheConfig: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    strategy: 'LRU' as const,
    enabled: true
  } as ICacheConfig,
  logLevel: LogLevel.DEBUG,
  tokenConfig: {
    accessTokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiry: 15 * 60 * 1000 // 15 minutes
  },
  enableLogging: true,
  enableCache: true
};

