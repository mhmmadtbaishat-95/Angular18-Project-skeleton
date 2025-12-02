import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterComponent } from '../components/register/register.component';

/**
 * Register page component
 */
@Component({
  standalone: true,
  imports: [CommonModule, RegisterComponent],
  template: `<app-register></app-register>`
})
export class RegisterPage {}

