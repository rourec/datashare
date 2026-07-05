import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FileHistory, FileService } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-history',
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History implements OnInit {
  files: FileHistory[] = [];
  errorMessage = '';

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.errorMessage = '';

    this.fileService.history().subscribe({
      next: (files) => {
        this.files = files;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger vos fichiers.';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.errorMessage = '';

    this.fileService.upload(file, 7).subscribe({
      next: () => {
        input.value = '';
        this.loadHistory();
      },
      error: () => {
        this.errorMessage = 'Impossible de téléverser le fichier.';
      }
    });
  }

  download(file: FileHistory): void {
    window.open(this.fileService.getDownloadUrl(file), '_blank');
  }

  copyLink(file: FileHistory): void {
    navigator.clipboard.writeText(this.fileService.getDownloadUrl(file));
  }

  delete(file: FileHistory): void {
    this.fileService.delete(file.uuidFile).subscribe({
      next: () => this.loadHistory(),
      error: () => this.errorMessage = 'Impossible de supprimer le fichier.'
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isExpired(file: FileHistory): boolean {
    return file.status !== 'ACTIVE' || new Date(file.expiresAt) < new Date();
  }

  getExpirationLabel(file: FileHistory): string {
    if (this.isExpired(file)) {
      return 'Expiré';
    }

    const expiresAt = new Date(file.expiresAt).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return 'Expire demain';
    }

    return `Expire dans ${diffDays} jours`;
  }
}
