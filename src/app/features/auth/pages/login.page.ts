import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '../components/login/login.component';

/**
 * Login page component
 */
@Component({
  standalone: true,
  imports: [CommonModule, LoginComponent],
  template: `<app-login></app-login>`
})
export class LoginPage {}

