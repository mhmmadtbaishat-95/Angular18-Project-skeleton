import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type RuntimeConfig = { 
  apiBaseUrl: string;
  apiUrl?: string;
};

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private http = inject(HttpClient);
  private cfg: RuntimeConfig | null = null;

  load = () => 
    firstValueFrom(this.http.get<RuntimeConfig>('/assets/runtime-config.json'))
      .then(c => this.cfg = c)
      .catch(error => {
        console.error('Failed to load runtime config:', error);
        // Fallback to default config
        this.cfg = { apiBaseUrl: '/api' };
        return this.cfg;
      });

  get config(): RuntimeConfig {
    if (!this.cfg) throw new Error('Runtime config not loaded');
    return this.cfg;
  }
}

