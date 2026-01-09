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
  // Set to false to disable license eligibility check (for development while data is being finalized)
  enableLicenseEligibilityCheck: false, // Set to true when license status validation is ready
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
  enableCache: true,
  // Copilot Studio (Power Virtual Agents) configuration
  copilot: {
    // DirectLine token endpoint
    // 
    // RECOMMENDED: Use your backend API to proxy the token request
    // Create an endpoint like: POST /api/copilot/token
    // Your backend should call Power Platform API and return { token: "..." }
    tokenEndpoint: '/api/copilot/token', // Backend endpoint (recommended)
    //
    // ALTERNATIVE: Use Power Platform API directly (requires CORS and may have auth issues)
    // Format: https://{environment}.api.powerplatform.com/powervirtualagents/botsbyschema/{botSchema}/directline/token?api-version={apiVersion}
    // tokenEndpoint: 'https://ccbfd12a473ae4c8be7756bac1e50f.4d.environment.api.powerplatform.com/powervirtualagents/botsbyschema/cre36_icm20SocialSector/directline/token?api-version=2022-03-01-preview',
    //
    // Bot ID/Schema name (used for building Power Platform URL if needed)
    botSchema: 'cre36_icm20SocialSector',
    // API Version
    apiVersion: '2022-03-01-preview',
    // Enable/disable chatbot
    enabled: true
  },
  // Mapbox configuration
  mapbox: {
    // Get your free token from: https://account.mapbox.com/access-tokens/
    // For production, use your own token
    accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXV4NTFmZ2Y2cW4zN2p1M2g1MjcifQ.rJcFIG214AriISLbB6B5aw'
  }
};

