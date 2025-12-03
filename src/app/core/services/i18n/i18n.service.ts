import { Injectable, inject, Injector, Optional } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';
import { StorageService } from '../storage/storage.service';
import { CacheType } from '../../enums/cache-type.enum';
import { STORAGE_KEYS } from '../../constants/storage-keys.constants';
import { AppStateService } from '../state/app-state.service';
import { of } from 'rxjs';

export type SupportedLanguage = 'en' | 'ar';

/**
 * Internationalization service
 * Manages language switching and RTL support
 */
@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private injector = inject(Injector);
  private translateService: TranslateService | null = null;
  private readonly storage = inject(StorageService);
  private readonly appState = inject(AppStateService);
  private readonly document = inject(DOCUMENT) as Document;

  private readonly supportedLanguages: SupportedLanguage[] = ['en', 'ar'];
  private readonly defaultLanguage: SupportedLanguage = 'en';

  /**
   * Gets TranslateService lazily
   * @private
   */
  private getTranslateService(): TranslateService | null {
    if (!this.translateService) {
      try {
        this.translateService = this.injector.get(TranslateService, null);
      } catch (error) {
        // TranslateService not available
        return null;
      }
    }
    return this.translateService;
  }

  constructor() {
    // Initialize language immediately (language direction was already set in index.html)
    this.initializeLanguage();
  }

  /**
   * Initializes the language service
   * @private
   */
  private initializeLanguage(): void {
    try {
      // Get saved language or detect from browser
      const savedLanguage = this.storage.getItem<SupportedLanguage>(
        STORAGE_KEYS.LANGUAGE,
        CacheType.LOCAL_STORAGE
      );

      const browserLanguage = this.detectBrowserLanguage();
      const initialLanguage = savedLanguage || browserLanguage || this.defaultLanguage;

      // Direction already applied in index.html, but ensure state is updated
      this.appState.setLanguage(initialLanguage);

      // Try to set language with TranslateService (non-blocking)
      const translateService = this.getTranslateService();
      if (translateService) {
        try {
          if (!translateService.defaultLang) {
            translateService.setDefaultLang('en');
            translateService.addLangs(['en', 'ar']);
          }

          // Set the initial language without re-applying direction (already done in index.html)
          if (translateService.currentLang !== initialLanguage) {
            translateService.use(initialLanguage).subscribe({
              next: () => {
                console.log(`Initial translation loaded for: ${initialLanguage}`);
              },
              error: (error) => {
                console.error(`Error loading initial translation for ${initialLanguage}:`, error);
                // Try English as fallback
                if (initialLanguage !== 'en') {
                  translateService.use('en').subscribe();
                }
              }
            });
          }
        } catch (error) {
          // Silently continue without translations
        }
      }
    } catch (error) {
      console.error('Error initializing i18n:', error);
      // Fallback to apply default language direction
      this.applyLanguageDirection(this.defaultLanguage);
    }
  }

  /**
   * Detects browser language
   * @returns Detected language code
   * @private
   */
  private detectBrowserLanguage(): SupportedLanguage | null {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    
    if (browserLang.startsWith('ar')) {
      return 'ar';
    }
    
    if (browserLang.startsWith('en')) {
      return 'en';
    }

    return null;
  }

  /**
   * Sets the current language
   * @param language - Language code ('en' or 'ar')
   * @example
   * this.i18nService.setLanguage('ar');
   */
  setLanguage(language: SupportedLanguage): void {
    if (!this.supportedLanguages.includes(language)) {
      console.warn(`Unsupported language: ${language}. Falling back to ${this.defaultLanguage}`);
      language = this.defaultLanguage;
    }

    // Apply direction immediately
    this.applyLanguageDirection(language);
    this.storage.setItem(STORAGE_KEYS.LANGUAGE, language, CacheType.LOCAL_STORAGE);
    this.appState.setLanguage(language);

    // Load translations
    try {
      const translateService = this.getTranslateService();
      if (translateService) {
        // Ensure default lang is set
        if (!translateService.defaultLang) {
          translateService.setDefaultLang('en');
          translateService.addLangs(['en', 'ar']);
        }

        // Load the translation file
        translateService.use(language).subscribe({
          next: () => {
            console.log(`Translation loaded for language: ${language}`);
            // Force change detection by updating the service
            this.translateService = translateService;
          },
          error: (error) => {
            console.error(`Error loading translation for ${language}:`, error);
            // Try to load default language as fallback
            if (language !== 'en') {
              translateService.use('en').subscribe();
            }
          }
        });
      } else {
        console.warn('TranslateService not available');
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }

  /**
   * Gets the current language
   * @returns Current language code
   * @example
   * const lang = this.i18nService.getCurrentLanguage();
   */
  getCurrentLanguage(): SupportedLanguage {
    try {
      const translateService = this.getTranslateService();
      if (translateService && translateService.currentLang) {
        return (translateService.currentLang as SupportedLanguage) || this.defaultLanguage;
      }
    } catch (error) {
      // Fallback to storage
    }
    
    const savedLang = this.storage.getItem<SupportedLanguage>(
      STORAGE_KEYS.LANGUAGE,
      CacheType.LOCAL_STORAGE
    );
    return savedLang || this.defaultLanguage;
  }

  /**
   * Gets all supported languages
   * @returns Array of supported language codes
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.supportedLanguages];
  }

  /**
   * Checks if current language is RTL
   * @returns True if RTL language
   */
  isRTL(): boolean {
    return this.getCurrentLanguage() === 'ar';
  }

  /**
   * Applies language direction (LTR/RTL) to the document
   * @param language - Language code
   * @private
   */
  private applyLanguageDirection(language: SupportedLanguage): void {
    const htmlElement = this.document.documentElement;
    const bodyElement = this.document.body;

    if (language === 'ar') {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.setAttribute('lang', 'ar');
      bodyElement.classList.add('rtl');
      bodyElement.classList.remove('ltr');
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', 'en');
      bodyElement.classList.add('ltr');
      bodyElement.classList.remove('rtl');
    }
  }

  /**
   * Translates a key
   * @param key - Translation key
   * @param params - Optional parameters
   * @returns Observable of translated string
   * @example
   * this.i18nService.translate('common.welcome').subscribe(text => console.log(text));
   */
  translate(key: string, params?: Record<string, any>): string {
    try {
      const translateService = this.getTranslateService();
      if (translateService) {
        const translation = translateService.instant(key, params);
        return translation || key;
      }
    } catch (error) {
      // Silently return key
    }
    return key;
  }

  /**
   * Translates a key asynchronously
   * @param key - Translation key
   * @param params - Optional parameters
   * @returns Observable of translated string
   * @example
   * this.i18nService.translateAsync('common.welcome').subscribe(text => console.log(text));
   */
  translateAsync(key: string, params?: Record<string, any>) {
    try {
      const translateService = this.getTranslateService();
      if (translateService) {
        return translateService.get(key, params);
      }
    } catch (error) {
      // Return key as observable
    }
    return of(key);
  }
}

