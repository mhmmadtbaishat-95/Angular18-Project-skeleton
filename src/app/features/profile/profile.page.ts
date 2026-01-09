import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '@core/services/auth/auth.service';
import { I18nService } from '@core/services/i18n/i18n.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { Subscription } from 'rxjs';
import { IUser } from '@core/models/user.model';
import { UserRole } from '@core/enums/user-role.enum';
import { ServiceRequestService } from '@features/service-requests/services/service-request.service';
import { ServiceRequest, RequestStatus } from '@features/service-requests/models/service.model';

interface RelatedService {
  id: string;
  titleKey: string;
  descriptionKey: string;
  route: string;
  icon: string;
}

/**
 * Profile page component
 * Displays user profile information and related services
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly i18nService = inject(I18nService);
  private readonly translateService = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private langChangeSubscription?: Subscription;

  profileForm: FormGroup;
  isRTL = signal(this.i18nService.isRTL());
  currentUser: IUser | null = null;
  displayUser: IUser | null = null; // User data to display (includes dummy data fallback)
  
  // Requests statistics
  userRequests: ServiceRequest[] = [];
  isLoadingRequests = false;

  // Communication channels options
  communicationChannels = [
    { value: 'email', label: 'profile.communicationChannel.email' },
    { value: 'sms', label: 'profile.communicationChannel.sms' },
    { value: 'phone', label: 'profile.communicationChannel.phone' },
    { value: 'whatsapp', label: 'profile.communicationChannel.whatsapp' },
  ];

  // Related services
  relatedServices: RelatedService[] = [
    {
      id: '3',
      titleKey: 'services.service3.title',
      descriptionKey: 'services.service3.description',
      route: '/service-requests/service/3',
      icon: 'fas fa-building',
    },
    {
      id: '1',
      titleKey: 'services.service1.title',
      descriptionKey: 'services.service1.description',
      route: '/service-requests/service/1',
      icon: 'fas fa-certificate',
    },
    {
      id: '2',
      titleKey: 'services.service2.title',
      descriptionKey: 'services.service2.description',
      route: '/service-requests/service/2',
      icon: 'fas fa-tools',
    },
    {
      id: '4',
      titleKey: 'services.service4.title',
      descriptionKey: 'services.service4.description',
      route: '/service-requests/service/4',
      icon: 'fas fa-wallet',
    },
  ];

  constructor() {
    // Initialize form with user data
    this.profileForm = this.fb.group({
      firstName: [{ value: '', disabled: true }],
      lastName: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      username: [{ value: '', disabled: true }],
      role: [{ value: '', disabled: true }],
      developerType: [{ value: '', disabled: true }],
      isActive: [{ value: '', disabled: true }],
      isEmailVerified: [{ value: '', disabled: true }],
      createdAt: [{ value: '', disabled: true }],
      lastLoginAt: [{ value: '', disabled: true }],
      licenseNumber: [{ value: '', disabled: true }],
      licensedProjectsCount: [{ value: '', disabled: true }],
      preferredLanguage: [{ value: '', disabled: true }],
      preferredCommunicationChannel: [{ value: '', disabled: false }], // Enabled for selection
      newsletterSubscription: [{ value: false, disabled: false }], // Checkbox - enabled
    });
  }

  ngOnInit(): void {
    // Load user data
    this.loadUserData();
    
    // Load requests statistics
    this.loadRequestsStatistics();

    // Subscribe to language changes
    this.langChangeSubscription = this.translateService.onLangChange.subscribe(() => {
      this.updateRTLState();
      this.loadUserData(); // Reload data to update translations
    });

    // Subscribe to auth state changes
    this.authService.authState$.subscribe(() => {
      this.loadUserData();
      this.loadRequestsStatistics();
    });
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  /**
   * Loads user data and populates the form
   */
  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Use dummy data if no user is logged in (for development/testing)
    this.displayUser = this.currentUser || this.getDummyUserData();
    
    if (this.displayUser) {
      this.translateService.get([
        'profile.active',
        'profile.inactive',
        'profile.verified',
        'profile.notVerified',
        'profile.never',
        'profile.user',
        'profile.yes',
        'profile.no'
      ]).subscribe(translations => {
        const user = this.displayUser as any;
        this.profileForm.patchValue({
          firstName: this.displayUser!.firstName || '',
          lastName: this.displayUser!.lastName || '',
          email: this.displayUser!.email || '',
          username: this.displayUser!.username || '',
          role: this.getRoleDisplayName(this.displayUser!.role),
          developerType: this.getDeveloperType(),
          isActive: this.displayUser!.isActive ? translations['profile.active'] : translations['profile.inactive'],
          isEmailVerified: this.displayUser!.isEmailVerified ? translations['profile.verified'] : translations['profile.notVerified'],
          createdAt: this.formatDate(this.displayUser!.createdAt),
          lastLoginAt: this.displayUser!.lastLoginAt ? this.formatDate(this.displayUser!.lastLoginAt) : translations['profile.never'],
          licenseNumber: user?.licenseNumber || 'LIC-2024-001234',
          licensedProjectsCount: user?.licensedProjectsCount?.toString() || '5',
          preferredLanguage: this.getLanguageDisplayName(user?.preferredLanguage || 'ar'),
          preferredCommunicationChannel: user?.preferredCommunicationChannel || 'email',
          newsletterSubscription: user?.newsletterSubscription ?? true,
        });
      });
    }
  }

  /**
   * Gets dummy user data for development/testing
   */
  private getDummyUserData(): IUser {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Use Arabic names for dummy data
    return {
      id: 'demo-user-001',
      email: 'mohammad.tubishat@pwc.com',
      username: 'mtubishat',
      firstName: 'محمد',
      lastName: 'طبيشات',
      role: UserRole.USER,
      isActive: true,
      isEmailVerified: true,
      createdAt: oneYearAgo.toISOString(),
      updatedAt: now.toISOString(),
      lastLoginAt: yesterday.toISOString(),
      // Additional profile fields
      licenseNumber: 'LIC-2024-001234',
      licensedProjectsCount: 5,
      preferredLanguage: 'ar',
      preferredCommunicationChannel: 'email',
      newsletterSubscription: true,
    } as any;
  }

  /**
   * Updates RTL state
   */
  private updateRTLState(): void {
    this.isRTL.set(this.i18nService.isRTL());
  }

  /**
   * Gets role display name (localized)
   */
  private getRoleDisplayName(role: string): string {
    const currentLang = this.translateService.currentLang || 'en';
    
    // For user role, always show "مطور عقاري" (Real Estate Developer) in Arabic
    if (role.toLowerCase() === 'user' || role.toLowerCase() === UserRole.USER) {
      if (currentLang === 'ar') {
        return 'مطور عقاري';
      }
      return 'Real Estate Developer';
    }
    
    // For other roles, use translations
    const roleKey = `profile.role.${role.toLowerCase()}`;
    const translated = this.translateService.instant(roleKey);
    
    // If translation exists, return it; otherwise return the role as-is
    return translated !== roleKey ? translated : role;
  }

  /**
   * Gets developer type (localized)
   */
  private getDeveloperType(): string {
    // Default to "Legal" type for demo
    const developerType = 'Legal';
    const currentLang = this.translateService.currentLang || 'en';
    
    if (currentLang === 'ar') {
      return developerType === 'Legal' ? 'قانوني' : 'طبيعي';
    }
    return developerType;
  }

  /**
   * Gets language display name (localized)
   */
  private getLanguageDisplayName(language: string): string {
    if (language === 'ar') {
      return this.translateService.currentLang === 'ar' ? 'العربية' : 'Arabic';
    }
    return this.translateService.currentLang === 'ar' ? 'الإنجليزية' : 'English';
  }

  /**
   * Gets communication channel display name (localized)
   */
  private getCommunicationChannelDisplayName(channel: string): string {
    const key = `profile.communicationChannel.${channel}`;
    const translated = this.translateService.instant(key);
    return translated !== key ? translated : channel;
  }

  /**
   * Formats date for display (localized)
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const currentLang = this.translateService.currentLang || 'en';
    const locale = currentLang === 'ar' ? 'ar-QA' : 'en-US';
    
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Gets first name initial for avatar
   */
  getFirstNameInitial(): string {
    if (this.displayUser?.firstName) {
      return this.displayUser.firstName.charAt(0).toUpperCase();
    }
    if (this.displayUser?.username) {
      return this.displayUser.username.charAt(0).toUpperCase();
    }
    if (this.displayUser?.email) {
      return this.displayUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  /**
   * Gets display name
   */
  getDisplayName(): string {
    if (this.displayUser) {
      const fullName = `${this.displayUser.firstName} ${this.displayUser.lastName}`.trim();
      return fullName || this.displayUser.username || this.displayUser.email;
    }
    return this.translateService.instant('profile.user');
  }

  /**
   * Loads requests statistics
   */
  private loadRequestsStatistics(): void {
    this.isLoadingRequests = true;
    this.serviceRequestService.getUserRequests().subscribe({
      next: (requests) => {
        this.userRequests = requests;
        this.isLoadingRequests = false;
      },
      error: (error) => {
        console.error('Failed to load requests:', error);
        this.isLoadingRequests = false;
        // Use dummy data on error
        this.userRequests = [];
      },
    });
  }

  /**
   * Gets total requests count
   */
  getMyRequestsCount(): number {
    return this.userRequests.length || 12; // Fallback to 12 for demo
  }

  /**
   * Gets licensed projects count
   */
  getLicensedProjectsCount(): number {
    const user = this.displayUser as any;
    return user?.licensedProjectsCount || 5; // Fallback for demo
  }
}
