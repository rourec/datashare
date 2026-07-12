import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface UploadResult {
  originalFilename: string;
  size: number;
  expirationDays: number;
  downloadUrl: string;
}

@Component({
  selector: 'app-upload-success',
  imports: [CommonModule],
  templateUrl: './upload-success.html',
  styleUrl: './upload-success.scss'
})
export class UploadSuccess implements OnInit {
  uploadResult?: UploadResult;
  copied = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const storedResult = sessionStorage.getItem('lastUploadResult');

    if (!storedResult) {
      this.router.navigate(['/upload']);
      return;
    }

    try {
      this.uploadResult = JSON.parse(storedResult) as UploadResult;
    } catch {
      sessionStorage.removeItem('lastUploadResult');
      this.router.navigate(['/upload']);
    }
  }

  formatFileSize(size: number): string {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1).replace('.', ',')} Ko`;
    }

    if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(1).replace('.', ',')} Go`;
  }

  getExpirationMessage(): string {
    const days = this.uploadResult?.expirationDays ?? 7;

    if (days === 1) {
      return 'Félicitations, ton fichier sera conservé chez nous pendant une journée !';
    }

    if (days === 7) {
      return 'Félicitations, ton fichier sera conservé chez nous pendant une semaine !';
    }

    return `Félicitations, ton fichier sera conservé chez nous pendant ${days} jours !`;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  copyLink(): void {
    if (!this.uploadResult) {
      return;
    }

    navigator.clipboard.writeText(this.uploadResult.downloadUrl).then(() => {
      this.copied = true;
    });
  }
}
