import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, SupportedLanguage } from '@core/services/i18n/i18n.service';
import { ClickOutsideDirective } from '@shared/pipes-directives/click-outside.directive';

/**
 * Language switcher component
 * Allows users to switch between supported languages
 */
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss']
})
export class LanguageSwitcherComponent {
  private readonly i18nService = inject(I18nService);

  isDropdownOpen = false;
  
  languages = [
    { code: 'en' as SupportedLanguage, label: 'English', flag: '🇺🇸' },
    { code: 'ar' as SupportedLanguage, label: 'العربية', flag: '🇸🇦' }
  ];

  get currentLanguage(): SupportedLanguage {
    return this.i18nService.getCurrentLanguage();
  }

  get currentLanguageLabel(): string {
    const lang = this.languages.find(l => l.code === this.currentLanguage);
    return lang ? lang.label : 'English';
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  switchLanguage(language: SupportedLanguage): void {
    this.i18nService.setLanguage(language);
    this.closeDropdown();
  }
}
