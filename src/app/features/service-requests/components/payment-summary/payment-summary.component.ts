import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';

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
   * Formats currency amount
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2
    }).format(amount);
  }
}

