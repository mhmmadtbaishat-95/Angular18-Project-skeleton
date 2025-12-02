import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { ENDPOINTS, buildUrl, buildEndpoint } from '../endpoints';
import { IUser, IUserProfileUpdate, IChangePassword } from '@core/models/user.model';
import { IPaginatedResponse } from '../models/api-response.model';

/**
 * API service
 * Provides typed methods for API endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClientService);

  // User endpoints

  /**
   * Gets user profile
   * @returns Observable of user profile
   * @example
   * this.apiService.getUserProfile().subscribe(user => {
   *   console.log(user);
   * });
   */
  getUserProfile(): Observable<IUser> {
    return this.http.get<IUser>(ENDPOINTS.USERS.PROFILE);
  }

  /**
   * Updates user profile
   * @param updates - Profile updates
   * @returns Observable of updated user
   * @example
   * this.apiService.updateUserProfile({ firstName: 'John' }).subscribe();
   */
  updateUserProfile(updates: IUserProfileUpdate): Observable<IUser> {
    return this.http.put<IUser>(ENDPOINTS.USERS.UPDATE_PROFILE, updates);
  }

  /**
   * Changes user password
   * @param passwordData - Password change data
   * @returns Observable of success
   * @example
   * this.apiService.changePassword({
   *   currentPassword: 'old',
   *   newPassword: 'new',
   *   confirmPassword: 'new'
   * }).subscribe();
   */
  changePassword(passwordData: IChangePassword): Observable<void> {
    return this.http.post<void>(ENDPOINTS.USERS.CHANGE_PASSWORD, passwordData);
  }

  /**
   * Gets all users (paginated)
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Observable of paginated users
   * @example
   * this.apiService.getUsers(1, 10).subscribe(response => {
   *   console.log(response.data);
   * });
   */
  getUsers(page: number = 1, pageSize: number = 10): Observable<IPaginatedResponse<IUser>> {
    return this.http.get<IPaginatedResponse<IUser>>(
      buildUrl(ENDPOINTS.USERS.LIST, undefined, { page, pageSize })
    );
  }

  /**
   * Gets user by ID
   * @param id - User ID
   * @returns Observable of user
   * @example
   * this.apiService.getUserById('123').subscribe(user => {
   *   console.log(user);
   * });
   */
  getUserById(id: string): Observable<IUser> {
    return this.http.get<IUser>(buildEndpoint(ENDPOINTS.USERS.BY_ID, { id }));
  }

  // Dashboard endpoints

  /**
   * Gets dashboard statistics
   * @returns Observable of dashboard stats
   * @example
   * this.apiService.getDashboardStats().subscribe(stats => {
   *   console.log(stats);
   * });
   */
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(ENDPOINTS.DASHBOARD.STATS);
  }
}

