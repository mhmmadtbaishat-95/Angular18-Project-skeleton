/**
 * API constants
 * @deprecated Use @data/http/endpoints instead
 * This file is kept for backward compatibility
 * 
 * New code should use:
 * import { ENDPOINTS, PUBLIC_ENDPOINTS } from '@data/http/endpoints';
 */

// Re-export from new location for backward compatibility
export { ENDPOINTS as API_ENDPOINTS, PUBLIC_ENDPOINTS } from '@data/http/endpoints';

/**
 * API base configuration
 */
export const API_BASE_URL = '/api';
export const API_VERSION = 'v1';
export const API_TIMEOUT = 30000; // 30 seconds
