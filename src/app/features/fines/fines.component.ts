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
export class finesComponent {}
