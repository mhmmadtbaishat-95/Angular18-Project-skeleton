import {
  Component,
  signal,
  inject,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { I18nService } from '../../../core/services/i18n/i18n.service';
import { environment } from '../../../../environments/environment';
import * as WebChat from 'botframework-webchat';

/**
 * Floating Chatbot Component
 * Copilot Studio (Power Virtual Agents) integration
 */
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="chatbot-container" *ngIf="isCopilotEnabled()">

      <!-- Chat Window -->
      <div *ngIf="isOpen()" class="chat-window" [class.rtl]="isRTL()" [class.ltr]="!isRTL()">

        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-header-content">
            <img src="assets/logo.png" alt="Entity Logo" class="chat-logo" />
          </div>

          <button class="chat-close-btn" (click)="toggleChat()" aria-label="Close chat">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Copilot WebChat -->
        <div #webchatElement id="webchat" style="height: 100%; width: 100%;"></div>
        <!DOCTYPE html><html><body><iframe src="https://copilotstudio.preview.microsoft.com/environments/d82f0fb9-f12b-e015-9078-b65bd0bf3817/bots/copilots_header_9bd81/webchat?__version__=2" frameborder="0" style="width: 100%; height: 100%;"></iframe></body></html>
      </div>

      <!-- Floating Chat Button -->
      <button
        class="chatbot-button"
        (click)="toggleChat()"
        [class.chat-open]="isOpen()"
        [attr.aria-label]="isOpen() ? 'Close chat' : 'Open chat'"
      >
        <img src="assets/chat-icon.png" alt="chat-icon" *ngIf="!isOpen()" class="chat-logo" />
        <i *ngIf="isOpen()" class="fas fa-times"></i>
        <span *ngIf="unreadCount() > 0" class="chatbot-badge">{{ unreadCount() }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      /* === YOUR ORIGINAL STYLES (UNCHANGED) === */

      .chatbot-container {
        position: fixed;
        bottom: 75px;
        right: 24px;
        left: auto;
        z-index: 99999;
        font-family: inherit;
        pointer-events: none;
      }

      .chatbot-container > * {
        pointer-events: auto;
      }

      :host-context([dir='rtl']) .chatbot-container {
        right: auto;
        left: 24px;
      }

      .chatbot-button {
        width: 56px;
        height: 56px;
        border-radius: 9999px;
        cursor: pointer;
        border: 2px solid rgba(218, 203, 161, 1);
        background: linear-gradient(204.53deg, #dacba1 -17.94%, #625c4c 85.95%);
        box-shadow: 0px 0px 14.21px rgba(218, 203, 161, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.3s ease;
        z-index: 99999;
      }

      .chatbot-button:hover {
        transform: scale(1.1);
        box-shadow: 0px 0px 20px rgba(218, 203, 161, 0.8);
      }

      .chatbot-button.chat-open {
        background: linear-gradient(204.53deg, #625c4c -17.94%, #dacba1 85.95%);
      }

      .chatbot-button .chat-logo {
        height: 32px;
        width: 32px;
        object-fit: contain;
      }

      .chatbot-button i {
        font-size: 1.5rem;
        color: white;
      }

      .chatbot-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: red;
        color: white;
        font-size: 12px;
        border-radius: 9999px;
        padding: 2px 6px;
      }

      .chat-window {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 360px;
        height: 520px;
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(40px);
        box-shadow: 0px 0px 41.3px rgba(139, 22, 56, 0.35);
        border: 0.5px solid rgba(255, 255, 255, 0.2);
        background: rgba(22, 22, 24, 0.95);
        z-index: 99999;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      #webchat {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      .chat-window.rtl {
        right: auto;
        left: 0;
      }

      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(22, 22, 24, 0.9);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .chat-logo {
        height: 40px;
      }

      .chat-close-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }

      .chat-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .chat-header-content {
        display: flex;
        align-items: center;
      }

      @media (max-width: 640px) {
        .chatbot-container {
          bottom: 16px;
          right: 16px;
          left: auto;
        }

        :host-context([dir='rtl']) .chatbot-container {
          right: auto;
          left: 16px;
        }

        .chat-window {
          width: calc(100vw - 32px);
          height: calc(100vh - 120px);
          bottom: 70px;
        }

        .chatbot-button {
          width: 48px;
          height: 48px;
        }
      }
    `,
  ],
})
export class ChatbotComponent implements AfterViewInit, OnDestroy {
  private i18nService = inject(I18nService);
  
  @ViewChild('webchatElement', { static: false }) webchatElementRef?: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  unreadCount = signal(0);

  private webChatLoaded = false;
  private directLine: any = null;

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    // Cleanup: end DirectLine connection if it exists
    if (this.directLine) {
      try {
        this.directLine.end();
      } catch (error) {
        console.error('Error ending DirectLine connection:', error);
      }
    }
  }

  toggleChat(): void {
    this.isOpen.set(!this.isOpen());

    if (this.isOpen()) {
      this.unreadCount.set(0);

      // Initialize Copilot only once
      setTimeout(() => this.initCopilot(), 0);
    }
  }

  isCopilotEnabled(): boolean {
    return environment.copilot?.enabled !== false;
  }

  async initCopilot(): Promise<void> {
    if (this.webChatLoaded) return;

    // Check if Copilot is enabled
    if (!this.isCopilotEnabled()) {
      console.warn('Copilot is disabled in environment configuration');
      return;
    }

    // Wait for the element to be available
    const webchatElement = this.webchatElementRef?.nativeElement || document.getElementById('webchat');
    if (!webchatElement) {
      console.error('WebChat container not found');
      // Retry after a short delay
      setTimeout(() => this.initCopilot(), 100);
      return;
    }

    // Check if token endpoint is configured
    const tokenEndpoint = environment.copilot?.tokenEndpoint;
    if (!tokenEndpoint) {
      console.error('Copilot token endpoint is not configured. Please set environment.copilot.tokenEndpoint');
      webchatElement.innerHTML = `
        <div style="padding: 20px; text-align: center; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
          <i class="fas fa-cog" style="font-size: 2rem; margin-bottom: 1rem; color: #ffa500;"></i>
          <p style="margin: 0;">Chat service is not configured.</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; opacity: 0.8;">Please contact support.</p>
        </div>
      `;
      return;
    }

    try {
      // Build the token URL
      // If tokenEndpoint starts with http, use it directly (external API)
      // Otherwise, use it as a relative path (backend API)
      const tokenUrl = tokenEndpoint.startsWith('http') 
        ? tokenEndpoint 
        : `${environment.apiUrl}${tokenEndpoint}`;

      console.log('Fetching Copilot token from:', tokenUrl);
      console.log('https://d82f0fb9f12be0159078b65bd0bf38.17.environment.api.powerplatform.com/powervirtualagents/botsbyschema/copilots_header_9bd81/directline/token?api-version=2022-03-01-preview')
      const response = await fetch(tokenUrl, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token fetch failed:', {
          url: tokenUrl,
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Provide more specific error messages
        let errorMessage = `Failed to fetch token: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = `Token endpoint not found (404). Please verify the endpoint URL is correct:\n${tokenUrl}`;
        } else if (response.status === 403 || response.status === 401) {
          errorMessage = `Authentication failed (${response.status}). The endpoint may require authentication.`;
        } else if (response.status === 0 || response.status === 500) {
          errorMessage = `Server error or CORS issue. Please check if CORS is enabled on the Power Platform API.`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Token not found in response. Response: ' + JSON.stringify(data));
      }

      this.directLine = WebChat.createDirectLine({ token: data.token });

      WebChat.renderWebChat(
        {
          directLine: this.directLine,
          locale: this.isRTL() ? 'ar' : 'en-US',
          styleOptions: {
            bubbleBackground: 'rgba(139, 22, 56, 0.9)',
            bubbleTextColor: '#FFFFFF',
            bubbleFromUserBackground: 'rgba(218, 203, 161, 0.9)',
            bubbleFromUserTextColor: '#000000',
            backgroundColor: 'rgba(22, 22, 24, 0.95)',
            botAvatarBackgroundColor: 'rgba(139, 22, 56, 1)',
            userAvatarBackgroundColor: 'rgba(218, 203, 161, 1)',
            hideUploadButton: false,
            sendBoxTextWrap: true,
          }
        },
        webchatElement
      );

      this.webChatLoaded = true;
    } catch (error: any) {
      console.error('Error initializing Copilot:', error);
      // Show error message to user
      if (webchatElement) {
        const errorMessage = error.message || 'Unknown error occurred';
        const is404 = errorMessage.includes('404') || errorMessage.includes('not found');
        
        webchatElement.innerHTML = `
          <div style="padding: 20px; text-align: center; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; color: #ff6b6b;"></i>
            <p style="margin: 0; font-weight: 600;">Unable to connect to chat service.</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; opacity: 0.9;">${errorMessage}</p>
            ${is404 ? `
              <div style="margin-top: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 8px; text-align: left; max-width: 100%;">
                <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; opacity: 0.9; font-weight: 600;">Possible solutions:</p>
                <ul style="margin: 0; padding-left: 1.5rem; font-size: 0.75rem; opacity: 0.8; text-align: left;">
                  <li>Verify the Power Platform endpoint URL is correct</li>
                  <li>Check if the bot schema name is correct</li>
                  <li>Create a backend API endpoint to proxy the token request</li>
                  <li>Ensure CORS is enabled on Power Platform API</li>
                </ul>
              </div>
            ` : ''}
            <p style="margin: 1rem 0 0 0; font-size: 0.75rem; opacity: 0.6;">Please contact support if the issue persists.</p>
          </div>
        `;
      }
    }
  }

  isRTL(): boolean {
    return (
      document.documentElement.dir === 'rtl' ||
      document.documentElement.getAttribute('lang') === 'ar'
    );
  }
}
