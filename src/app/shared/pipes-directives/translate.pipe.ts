import { Pipe, PipeTransform, inject, Injector, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

/**
 * Translate pipe
 * Simple pipe wrapper for ngx-translate with reactive updates
 * 
 * @example
 * {{ 'common.welcome' | t }}
 * {{ 'auth.login.title' | t }}
 */
@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translateService: TranslateService | null = null;
  private injector = inject(Injector);
  private subscription: Subscription | null = null;
  private lastLang: string = '';

  /**
   * Gets TranslateService lazily
   */
  private getTranslateService(): TranslateService | null {
    if (!this.translateService) {
      try {
        this.translateService = this.injector.get(TranslateService, null);
        if (this.translateService) {
          // Subscribe to language changes to clear cache
          this.subscription = this.translateService.onLangChange.subscribe(() => {
            this.lastLang = '';
          });
        }
      } catch (error) {
        // TranslateService not available
        return null;
      }
    }
    return this.translateService;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  transform(key: string, params?: Record<string, any>): string {
    if (!key) {
      return '';
    }
    
    // Get TranslateService lazily
    const translateService = this.getTranslateService();
    
    // If TranslateService is not available, return key
    if (!translateService) {
      return key;
    }
    
    try {
      const currentLang = translateService.currentLang || translateService.defaultLang || '';
      
      // Get translation using instant method
      let translation = translateService.instant(key, params);
      
      // If instant returns the key, translations might not be loaded yet
      // Try to access translations directly
      if (translation === key || !translation) {
        try {
          const translations = (translateService as any).translations;
          if (translations && currentLang && translations[currentLang]) {
            const langTranslations = translations[currentLang];
            const keys = key.split('.');
            let value: any = langTranslations;
            
            // Navigate through nested object structure
            for (const k of keys) {
              if (value && typeof value === 'object' && k in value) {
                value = value[k];
              } else {
                value = null;
                break;
              }
            }
            
            if (value && typeof value === 'string') {
              translation = value;
            }
          }
        } catch (err) {
          // Fall through to return key
        }
      }
      
      // Return translation if found, otherwise return key
      return (translation && translation !== key) ? translation : key;
    } catch (error) {
      // Return key on any error
      return key;
    }
  }
}

