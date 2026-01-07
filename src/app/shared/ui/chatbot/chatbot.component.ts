import {
  Component,
  signal,
  inject,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { I18nService } from '../../../core/services/i18n/i18n.service';
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
    <div class="chatbot-container">

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
        <div id="webchat" style="height: 100%; width: 100%;"></div>
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
        z-index: 9999;
        font-family: inherit;
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
      }

      @media (max-width: 640px) {
        .chat-window {
          width: calc(100vw - 32px);
          height: calc(100vh - 120px);
        }
      }
    `,
  ],
})
export class ChatbotComponent implements AfterViewInit {
  private i18nService = inject(I18nService);

  isOpen = signal(false);
  unreadCount = signal(0);

  private webChatLoaded = false;

  ngAfterViewInit(): void {}

  toggleChat(): void {
    this.isOpen.set(!this.isOpen());

    if (this.isOpen()) {
      this.unreadCount.set(0);

      // Initialize Copilot only once
      setTimeout(() => this.initCopilot(), 0);
    }
  }

  async initCopilot(): Promise<void> {
    if (this.webChatLoaded) return;

    // ⚠️ DEMO ONLY – MOVE TO BACKEND IN PROD
    const response = await fetch(
      'https://ccbfd12a473ae4c8be7756bac1e50f.4d.environment.api.powerplatform.com/powervirtualagents/botsbyschema/cre36_icm20SocialSector/directline/token?api-version=2022-03-01-preview',
      { method: 'POST' }
    );

    const { token } = await response.json();

    const directLine = WebChat.createDirectLine({ token });

    WebChat.renderWebChat(
      {
        directLine,
        locale: this.isRTL() ? 'ar' : 'en-US'
      },
      document.getElementById('webchat')!
    );

    this.webChatLoaded = true;
  }

  isRTL(): boolean {
    return (
      document.documentElement.dir === 'rtl' ||
      document.documentElement.getAttribute('lang') === 'ar'
    );
  }
}
