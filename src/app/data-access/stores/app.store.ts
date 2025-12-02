import { Injectable } from '@angular/core';
import { BaseStore } from './base.store';

/**
 * App state interface
 */
export interface IAppStoreState {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  sidebarCollapsed: boolean;
}

/**
 * Initial app state
 */
const initialState: IAppStoreState = {
  theme: 'light',
  language: 'en',
  sidebarCollapsed: false
};

/**
 * App store
 * Manages global application state
 * 
 * @example
 * // In component
 * constructor(private appStore = inject(AppStore)) {}
 * 
 * // Subscribe to state
 * appStore.state$.subscribe(state => {
 *   console.log('Theme:', state.theme);
 * });
 * 
 * // Select specific property
 * appStore.select(state => state.theme).subscribe(theme => {
 *   console.log('Current theme:', theme);
 * });
 * 
 * // Update state
 * appStore.setTheme('dark');
 * 
 * // Get current value
 * const theme = appStore.selectCurrent(state => state.theme);
 */
@Injectable({
  providedIn: 'root'
})
export class AppStore extends BaseStore<IAppStoreState> {
  constructor() {
    super(initialState);
    // Load from localStorage if available
    this.loadFromStorage();
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
      const savedLanguage = localStorage.getItem('language');
      const savedSidebarState = localStorage.getItem('sidebarCollapsed');

      if (savedTheme) {
        this.update({ theme: savedTheme });
      }
      if (savedLanguage) {
        this.update({ language: savedLanguage });
      }
      if (savedSidebarState !== null) {
        this.update({ sidebarCollapsed: savedSidebarState === 'true' });
      }
    }
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const state = this.state;
      localStorage.setItem('theme', state.theme);
      localStorage.setItem('language', state.language);
      localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed.toString());
    }
  }

  /**
   * Set theme
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.update({ theme });
    this.saveToStorage();
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.update({ language });
    this.saveToStorage();
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    const current = this.selectCurrent(state => state.sidebarCollapsed);
    this.update({ sidebarCollapsed: !current });
    this.saveToStorage();
  }

  /**
   * Set sidebar state
   */
  setSidebarCollapsed(collapsed: boolean): void {
    this.update({ sidebarCollapsed: collapsed });
    this.saveToStorage();
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.set(initialState);
    this.saveToStorage();
  }

  /**
   * Convenience getters
   */
  get theme(): 'light' | 'dark' | 'auto' {
    return this.selectCurrent(state => state.theme);
  }

  get language(): string {
    return this.selectCurrent(state => state.language);
  }

  get sidebarCollapsed(): boolean {
    return this.selectCurrent(state => state.sidebarCollapsed);
  }
}

