import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RuntimeConfigService } from '@config/runtime-config.service';
import { IApiResponse, IApiRequestOptions } from '../models/api-response.model';

/**
 * HTTP client service
 * Wrapper around Angular HttpClient with additional functionality
 */
@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  
  private get baseUrl(): string {
    return this.runtimeConfig.config.apiUrl || this.runtimeConfig.config.apiBaseUrl || '/api';
  }

  /**
   * Performs a GET request
   * @param url - Endpoint URL (relative to base URL)
   * @param options - Request options
   * @returns Observable of response
   * @example
   * this.httpClient.get<User>('/users/123').subscribe(user => {
   *   console.log(user);
   * });
   */
  get<T>(url: string, options?: IApiRequestOptions): Observable<T> {
    const headers = this.buildHeaders(options);
    const params = this.buildParams(options?.params);

    return this.http.get<IApiResponse<T>>(
      `${this.baseUrl}${url}`,
      { headers, params }
    ).pipe(
      // Map to extract data from IApiResponse wrapper
      map((response) => response.data)
    );
  }

  /**
   * Performs a POST request
   * @param url - Endpoint URL
   * @param body - Request body
   * @param options - Request options
   * @returns Observable of response
   * @example
   * this.httpClient.post('/users', userData).subscribe(result => {
   *   console.log('Created:', result);
   * });
   */
  post<T>(url: string, body: any, options?: IApiRequestOptions): Observable<T> {
    const headers = this.buildHeaders(options);

    return this.http.post<IApiResponse<T>>(
      `${this.baseUrl}${url}`,
      body,
      { headers }
    ).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Performs a PUT request
   * @param url - Endpoint URL
   * @param body - Request body
   * @param options - Request options
   * @returns Observable of response
   * @example
   * this.httpClient.put('/users/123', userData).subscribe(result => {
   *   console.log('Updated:', result);
   * });
   */
  put<T>(url: string, body: any, options?: IApiRequestOptions): Observable<T> {
    const headers = this.buildHeaders(options);

    return this.http.put<IApiResponse<T>>(
      `${this.baseUrl}${url}`,
      body,
      { headers }
    ).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Performs a PATCH request
   * @param url - Endpoint URL
   * @param body - Request body
   * @param options - Request options
   * @returns Observable of response
   * @example
   * this.httpClient.patch('/users/123', { name: 'New Name' }).subscribe();
   */
  patch<T>(url: string, body: any, options?: IApiRequestOptions): Observable<T> {
    const headers = this.buildHeaders(options);

    return this.http.patch<IApiResponse<T>>(
      `${this.baseUrl}${url}`,
      body,
      { headers }
    ).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Performs a DELETE request
   * @param url - Endpoint URL
   * @param options - Request options
   * @returns Observable of response
   * @example
   * this.httpClient.delete('/users/123').subscribe();
   */
  delete<T>(url: string, options?: IApiRequestOptions): Observable<T> {
    const headers = this.buildHeaders(options);

    return this.http.delete<IApiResponse<T>>(
      `${this.baseUrl}${url}`,
      { headers }
    ).pipe(
      map((response) => response?.data || null as T)
    );
  }

  /**
   * Builds HTTP headers from options
   * @param options - Request options
   * @returns HttpHeaders object
   * @private
   */
  private buildHeaders(options?: IApiRequestOptions): HttpHeaders {
    let headers = new HttpHeaders();

    if (options?.headers) {
      Object.keys(options.headers).forEach((key) => {
        headers = headers.set(key, options.headers![key]);
      });
    }

    return headers;
  }

  /**
   * Builds HTTP params from options
   * @param params - Query parameters
   * @returns HttpParams object
   * @private
   */
  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return httpParams;
  }
}

