import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';

/**
 * Login component
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  showSelectionScreen = true;
  loginType: 'user' | 'employee' | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  selectLoginType(type: 'user' | 'employee'): void {
    this.loginType = type;
    this.showSelectionScreen = false;
  }

  goBackToSelection(): void {
    this.showSelectionScreen = true;
    this.loginType = null;
    this.loginForm.reset();
    this.errorMessage = null;
  }

  onSmartCardLogin(): void {
    // Handle smart card login
    console.log('Smart card login clicked');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      
      // Map username to email for API compatibility
      const loginData = {
        email: this.loginForm.value.username,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe
      };
      
      this.authService.login(loginData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/profile']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error?.message || 'Login failed. Please check your credentials.';
          console.error('Login failed:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
