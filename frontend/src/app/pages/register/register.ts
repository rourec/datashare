import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Card } from '../../shared/card/card';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, Card, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.authService.register(this.email, this.password).subscribe({
      next: () => {
        this.successMessage = 'Compte créé avec succès.';
        setTimeout(() => this.router.navigate(['/login']), 800);
      },
      error: () => {
        this.errorMessage = 'Impossible de créer le compte.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
