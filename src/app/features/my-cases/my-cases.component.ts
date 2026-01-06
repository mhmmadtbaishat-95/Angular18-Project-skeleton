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
export class myCasesComponent {}
