import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { RouterLink } from '@angular/router';

/**
 * Home page component
 * Landing page with platform title and navigation icons
 */
@Component({
  selector: 'app-my-cases',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  templateUrl: './my-cases.page.html',
  styleUrls: ['./my-cases.page.scss'],
})
export class myCasesComponent {
  cases: Array<{
    caseNumber: string;
    caseTypeKey: string;
    caseCategoryKey: string;
    statusKey: 'draft' | 'submitted' | 'inReview' | 'inProgress' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  }> = [
    {
      caseNumber: 'CASE-000245',
      caseTypeKey: 'serviceTypes.commercialLicenseApplication',
      caseCategoryKey: 'cases.category.licensing',
      statusKey: 'submitted'
    },
    {
      caseNumber: 'CASE-000251',
      caseTypeKey: 'serviceTypes.tradeLicenseRenewal',
      caseCategoryKey: 'catalog.trade',
      statusKey: 'draft'
    },
    {
      caseNumber: 'CASE-000267',
      caseTypeKey: 'serviceTypes.industrialLicense',
      caseCategoryKey: 'catalog.industrial',
      statusKey: 'inReview'
    },
    {
      caseNumber: 'CASE-000279',
      caseTypeKey: 'serviceTypes.consumerComplaint',
      caseCategoryKey: 'catalog.consumerProtection',
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
