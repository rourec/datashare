import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FileHistory, FileService } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';

type FileFilter = 'ALL' | 'ACTIVE' | 'EXPIRED';

@Component({
  selector: 'app-history',
  imports: [CommonModule, RouterLink],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History implements OnInit {
  files: FileHistory[] = [];
  filter: FileFilter = 'ALL';
  errorMessage = '';

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  get filteredFiles(): FileHistory[] {
    if (this.filter === 'ACTIVE') {
      return this.files.filter(file => !this.isExpired(file));
    }

    if (this.filter === 'EXPIRED') {
      return this.files.filter(file => this.isExpired(file));
    }

    return this.files;
  }

  setFilter(filter: FileFilter): void {
    this.filter = filter;
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
