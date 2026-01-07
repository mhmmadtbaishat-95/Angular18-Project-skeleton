import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { RouterLink } from '@angular/router';

/**
 * Home page component
 * Landing page with platform title and navigation icons
 */
@Component({
  selector: 'app-fines',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  templateUrl: './fines.page.html',
  styleUrls: ['./fines.page.scss'],
})
export class finesComponent {
  fines: Array<{
    fineNumber: string;
    detailsKey: string;
    amount: number;
    statusKey: 'draft' | 'submitted' | 'inReview' | 'inProgress' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  }> = [
    {
      fineNumber: 'FINE-001235',
      detailsKey: 'fines.demoDetails.lateSubmission',
      amount: 1500,
      statusKey: 'submitted'
    },
    {
      fineNumber: 'FINE-001239',
      detailsKey: 'fines.demoDetails.missingDocument',
      amount: 750,
      statusKey: 'draft'
    },
    {
      fineNumber: 'FINE-001242',
      detailsKey: 'fines.demoDetails.safetyNonCompliance',
      amount: 3200,
      statusKey: 'inReview'
    },
    {
      fineNumber: 'FINE-001248',
      detailsKey: 'fines.demoDetails.complaintResolutionFee',
      amount: 500,
      statusKey: 'approved'
    }
  ];

  getStatusClass(statusKey: string): string {
    switch (statusKey) {
      case 'draft':
        return 'draft';
      case 'rejected':
        return 'rejected';
      case 'submitted':
      case 'inReview':
      case 'inProgress':
      case 'approved':
      case 'completed':
        return 'sent';
      default:
        return 'sent';
    }
  }
}
