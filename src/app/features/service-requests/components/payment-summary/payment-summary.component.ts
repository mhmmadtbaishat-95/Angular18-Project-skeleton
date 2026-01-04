import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { TranslateService } from '@ngx-translate/core';

/**
 * Payment summary component
 * Displays payment information and handles payment processing
 */
@Component({
  selector: 'app-payment-summary',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './payment-summary.component.html',
  styleUrls: ['./payment-summary.component.scss']
})
export class PaymentSummaryComponent {
  private readonly translateService = inject(TranslateService);
  
  @Input() amount: number = 0;
  @Input() currency: string = 'QAR';
  @Input() serviceFee: number = 0;
  @Input() tax: number = 0;

  /**
   * Calculates total amount including fees and tax
   */
  get totalAmount(): number {
    return this.amount + this.serviceFee + this.tax;
  }

  /**
   * Formats currency amount with translation
   */
  formatCurrency(amount: number): string {
    const currentLang = this.translateService.currentLang || 'en';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2
    }).format(amount);
    
    // Replace QAR with translated version
    if (this.currency === 'QAR' && currentLang === 'ar') {
      return formatted.replace('QAR', this.translateService.instant('common.currency.qar'));
    }
    
    return formatted;
  }
}

