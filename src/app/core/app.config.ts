import { ApplicationConfig, APP_INITIALIZER, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './routing/app.routes';
import { authInterceptor } from '../data-access/http/interceptors/auth.interceptor';
import { errorInterceptor } from '../data-access/http/interceptors/error.interceptor';
import { loadingInterceptor } from '../data-access/http/interceptors/loading.interceptor';
import { cacheInterceptor } from '../data-access/http/interceptors/cache.interceptor';
import { retryInterceptor } from '../data-access/http/interceptors/retry.interceptor';
import { loggingInterceptor } from '../data-access/http/interceptors/logging.interceptor';
import { GlobalErrorHandler } from './error-handling/global-error-handler';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { TranslateLoader, TranslateService, provideTranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Custom TranslateLoader that loads from assets
 */
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

/**
 * Factory function for TranslateLoader
 */
export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  return new CustomTranslateLoader(http);
}

/**
 * Factory function to initialize TranslateService
 */
export function initializeTranslateService(translateService: TranslateService): () => Promise<any> {
  return () => {
    try {
      translateService.setDefaultLang('en');
      translateService.addLangs(['en', 'ar']);
      const savedLang = localStorage.getItem('language') || 'en';
      
      // Don't block app initialization - load translations asynchronously
      setTimeout(() => {
        translateService.use(savedLang).subscribe({
          next: () => {
            console.log('Translations loaded successfully');
          },
          error: (error) => {
            console.error('Error loading translation:', error);
            // Fallback to default language
            translateService.use('en').subscribe();
          }
        });
      }, 0);
      
      // Return immediately to not block app initialization
      return Promise.resolve();
    } catch (error) {
      console.error('Error initializing TranslateService:', error);
      return Promise.resolve();
    }
  };
}

/**
 * Factory function to load runtime config
 */
function loadRuntimeConfig(cfg: RuntimeConfigService): () => Promise<any> {
  return () => cfg.load();
}

/**
 * Application configuration
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor,
        cacheInterceptor,
        retryInterceptor,
        loggingInterceptor
      ])
    ),
    provideAnimations(),
    // Use provideTranslateService to provide all required dependencies automatically
    ...provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      fallbackLang: 'en',
      lang: 'en'
    }),
    // Load runtime config before app starts
    {
      provide: APP_INITIALIZER,
      useFactory: loadRuntimeConfig,
      deps: [RuntimeConfigService],
      multi: true
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ]
};

