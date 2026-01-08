import {
  Component,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { I18nService } from '../../../core/services/i18n/i18n.service';
import { environment } from '../../../../environments/environment';

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
      <div [class.chat-window-hidden]="!isOpen()" class="chat-window" [class.rtl]="isRTL()" [class.ltr]="!isRTL()">

        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-header-content">
            <img src="assets/logo.png" alt="AQARAT" class="chat-logo" />
          </div>

          <button class="chat-close-btn" (click)="toggleChat()" aria-label="Close chat">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Copilot WebChat iframe -->
        <iframe 
          src="https://copilotstudio.preview.microsoft.com/environments/d82f0fb9-f12b-e015-9078-b65bd0bf3817/bots/copilots_header_382c2/webchat?__version__=2%22" 
          frameborder="0" 
          style="width: 100%; height: 100%; border: none;"
          allow="microphone; camera"
          title="Copilot Chat">
        </iframe>
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
      .webchat__send-box__editable{

        padding:10px !important;
      }
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
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
      }

      .chat-window.chat-window-hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(20px);
      }

      .chat-window:not(.chat-window-hidden) {
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

      iframe {
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
export class ChatbotComponent {
  private i18nService = inject(I18nService);

  isOpen = signal(false);
  unreadCount = signal(0);

  toggleChat(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.unreadCount.set(0);
    }
  }

  isCopilotEnabled(): boolean {
    return environment.copilot?.enabled !== false;
  }

  isRTL(): boolean {
    return (
      document.documentElement.dir === 'rtl' ||
      document.documentElement.getAttribute('lang') === 'ar'
    );
  }
}
