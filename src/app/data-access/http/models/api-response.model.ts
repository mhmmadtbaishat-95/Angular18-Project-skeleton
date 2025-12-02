/**
 * Generic API response wrapper
 */
export interface IApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: IApiError[];
  meta?: IApiMeta;
}

/**
 * API error interface
 */
export interface IApiError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * API metadata interface
 */
export interface IApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  timestamp?: string;
}

/**
 * Paginated API response
 */
export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * API request options
 */
export interface IApiRequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipCache?: boolean;
  skipLoading?: boolean;
  skipErrorHandling?: boolean;
  timeout?: number;
}

