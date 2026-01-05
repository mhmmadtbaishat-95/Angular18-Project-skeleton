import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { I18nService } from '../../../core/services/i18n/i18n.service';

/**
 * Floating Chatbot Component
 * Provides a floating chatbot icon with chat interface
 */
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="chatbot-container">
      <!-- Chat Window -->
      <div 
        *ngIf="isOpen()" 
        class="chat-window"
        [class.rtl]="isRTL()"
        [class.ltr]="!isRTL()"
      >
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-header-content">
            <img 
               src="assets/logo.png" 
              alt="Entity Logo"
              class="chat-logo"
            />
          </div>
          <button 
            class="chat-close-btn" 
            (click)="toggleChat()"
            aria-label="Close chat"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Chat Messages -->
        <div class="chat-messages" #chatMessages>
          <div *ngFor="let message of messages()" class="message" [class.message-user]="message.isUser" [class.message-bot]="!message.isUser">
            <div class="message-content">
              <div class="message-text">{{ message.text }}</div>
              <div class="message-time">{{ message.time }}</div>
            </div>
          </div>
          
          <!-- Welcome Message -->
          <div *ngIf="messages().length === 0" class="welcome-message">
            <p>{{ getTranslation('chatbot.welcome', 'Hello! How can I assist you today?') }}</p>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="chat-input-container">
          <input
            type="text"
            class="chat-input"
            [(ngModel)]="messageInput"
            (keyup.enter)="sendMessage()"
            [placeholder]="getTranslation('chatbot.placeholder', 'Type your message...')"
          />
          <button 
            class="chat-send-btn" 
            (click)="sendMessage()"
            [disabled]="!messageInput.trim()"
            aria-label="Send message"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <!-- Floating Chat Button -->
      <button 
        class="chatbot-button"
        (click)="toggleChat()"
        [class.chat-open]="isOpen()"
        [attr.aria-label]="isOpen() ? 'Close chat' : 'Open chat'"
      >
        <i *ngIf="!isOpen()" class="fas fa-comments"></i>
        <i *ngIf="isOpen()" class="fas fa-times"></i>
        <span *ngIf="unreadCount() > 0" class="chatbot-badge">{{ unreadCount() }}</span>
      </button>
    </div>
  `,
  styles: [`
    .chatbot-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      left: auto;
      z-index: 9999;
      font-family: inherit;
    }

    :host-context([dir="rtl"]) .chatbot-container {
      right: auto;
      left: 24px;
    }

    /* Floating Chat Button */
    .chatbot-button {
      @apply w-14 h-14 rounded-full bg-qatar-maroon hover:bg-qatar-maroon-dark text-white;
      @apply shadow-2xl flex items-center justify-center cursor-pointer;
      @apply transition-all duration-300 transform hover:scale-110;
      position: relative;
      box-shadow: 0 8px 24px rgba(139, 21, 56, 0.4);
    }

    .chatbot-button:hover {
      box-shadow: 0 12px 32px rgba(139, 21, 56, 0.5);
      transform: scale(1.1);
    }

    .chatbot-button i {
      font-size: 1.5rem;
      transition: transform 0.3s ease;
    }

    .chatbot-button.chat-open {
      @apply bg-gray-600 hover:bg-gray-700;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .chatbot-badge {
      @apply absolute -top-1 -right-1 bg-red-500 text-white rounded-full;
      @apply text-xs font-bold min-w-[20px] h-5 flex items-center justify-center;
      @apply px-1.5 border-2 border-white;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    /* Chat Window */
    .chat-window {
      @apply absolute bottom-20 right-0 w-80 h-[500px] bg-white dark:bg-gray-800;
      @apply rounded-2xl shadow-2xl flex flex-col;
   
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
      max-width: calc(100vw - 48px);
    }

    .chat-window.rtl {
      right: auto;
      left: 0;
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

    /* Chat Header */
    .chat-header {
      @apply flex items-center justify-between p-4;
      @apply bg-gradient-to-r from-qatar-maroon to-qatar-maroon-dark text-white;
      @apply border-b border-white/20;
    }

    .chat-header-content {
      @apply flex items-center flex-1;
    }

    .chat-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
    }

    .chat-close-btn {
      @apply w-8 h-8 rounded-full bg-white/20 hover:bg-white/30;
      @apply flex items-center justify-center cursor-pointer transition-colors;
      @apply text-white flex-shrink-0;
      border: none;
    }

    /* Chat Messages */
    .chat-messages {
      @apply flex-1 overflow-y-auto p-4 space-y-4;
      @apply bg-gray-50 dark:bg-gray-900;
      scroll-behavior: smooth;
    }

    .chat-messages::-webkit-scrollbar {
      width: 6px;
    }

    .chat-messages::-webkit-scrollbar-track {
      @apply bg-transparent;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      @apply bg-gray-300 dark:bg-gray-600 rounded-full;
    }

    .welcome-message {
      @apply text-center text-gray-500 dark:text-gray-400 py-8;
      @apply text-sm;
    }

    .message {
      @apply flex gap-2;
    }

    .message-user {
      @apply justify-end;
    }

    .message-bot {
      @apply justify-start;
    }

    .message-content {
      @apply max-w-[75%] rounded-2xl px-4 py-2.5;
      @apply flex flex-col gap-1;
    }

    .message-user .message-content {
      @apply bg-qatar-maroon text-white;
      border-bottom-right-radius: 4px;
    }

    .message-bot .message-content {
      @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
      @apply border border-gray-200 dark:border-gray-600;
      border-bottom-left-radius: 4px;
    }

    .message-text {
      @apply text-sm leading-relaxed;
      word-wrap: break-word;
    }

    .message-time {
      @apply text-xs opacity-70;
      @apply self-end;
      margin-top: 2px;
    }

    .message-user .message-time {
      @apply text-white/80;
    }

    .message-bot .message-time {
      @apply text-gray-500 dark:text-gray-400;
    }

    /* Chat Input */
    .chat-input-container {
      @apply flex items-center gap-2 p-4;
      @apply bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
    }

    .chat-input {
      @apply flex-1 px-4 py-2.5 rounded-xl;
      @apply border-2 border-gray-200 dark:border-gray-600;
      @apply bg-gray-50 dark:bg-gray-700;
      @apply text-gray-900 dark:text-white;
      @apply focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:border-transparent;
      @apply transition-all duration-200;
      font-size: 0.875rem;
    }

    .chat-send-btn {
      @apply w-10 h-10 rounded-xl bg-qatar-maroon hover:bg-qatar-maroon-dark;
      @apply text-white flex items-center justify-center cursor-pointer;
      @apply transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
      @apply shadow-md hover:shadow-lg;
      border: none;
    }

    .chat-send-btn:not(:disabled):hover {
      transform: scale(1.05);
    }

    /* RTL Support */
    .chat-window.rtl {
      direction: rtl;
    }

    .chat-window.ltr {
      direction: ltr;
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
      .chatbot-container {
        bottom: 16px;
        right: 16px;
        left: auto;
      }

      :host-context([dir="rtl"]) .chatbot-container {
        right: auto;
        left: 16px;
      }

      .chat-window {
        width: calc(100vw - 32px);
        height: calc(100vh - 100px);
        max-height: 600px;
      }

      .chatbot-button {
        @apply w-12 h-12;
      }

      .chatbot-button i {
        font-size: 1.25rem;
      }
    }

    /* Animation for new messages */
    @keyframes messageSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message {
      animation: messageSlide 0.3s ease-out;
    }
  `]
})
export class ChatbotComponent {
  private i18nService = inject(I18nService);
  
  isOpen = signal(false);
  messageInput = '';
  messages = signal<Array<{ text: string; isUser: boolean; time: string }>>([]);
  unreadCount = signal(0);

  getTranslation(key: string, fallback: string): string {
    const translation = this.i18nService.translate(key);
    return translation !== key ? translation : fallback;
  }

  toggleChat(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.unreadCount.set(0);
      // Scroll to bottom when opening
      setTimeout(() => {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    }
  }

  sendMessage(): void {
    if (!this.messageInput.trim()) return;

    const userMessage = {
      text: this.messageInput.trim(),
      isUser: true,
      time: this.getCurrentTime()
    };

    this.messages.update(msgs => [...msgs, userMessage]);
    this.messageInput = '';

    // Scroll to bottom
    setTimeout(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);

    // Simulate bot response
    setTimeout(() => {
      this.getBotResponse(userMessage.text);
    }, 1000);
  }

  getBotResponse(userMessage: string): void {
    const responses = [
      "Thank you for your message! Our support team will get back to you shortly.",
      "I'm here to help! Could you provide more details about your inquiry?",
      "I understand your concern. Let me connect you with a specialist.",
      "Thanks for reaching out! We'll assist you as soon as possible."
    ];

    const botMessage = {
      text: responses[Math.floor(Math.random() * responses.length)],
      isUser: false,
      time: this.getCurrentTime()
    };

    this.messages.update(msgs => [...msgs, botMessage]);

    // Increment unread count if chat is closed
    if (!this.isOpen()) {
      this.unreadCount.update(count => count + 1);
    }

    // Scroll to bottom
    setTimeout(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  isRTL(): boolean {
    return document.documentElement.dir === 'rtl' || 
           document.documentElement.getAttribute('lang') === 'ar';
  }

  constructor() {
    // Add welcome message on init
    setTimeout(() => {
      if (this.messages().length === 0) {
        // Welcome message will be shown via template
      }
    }, 500);
  }
}

