import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Card } from '../../shared/card/card';

interface DownloadMetadata {
  originalFilename: string;
  size: number;
  contentType: string;
  expiresAt: string;
}

@Component({
  selector: 'app-download',
  imports: [CommonModule, Card],
  templateUrl: './download.html',
  styleUrl: './download.scss'
})
export class Download implements OnInit {
  private readonly apiUrl = 'http://datashare.fr:8080/api/download';

  token = '';
  metadata?: DownloadMetadata;
  errorMessage = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    if (!this.token) {
      this.loading = false;
      this.errorMessage = 'Lien de téléchargement invalide.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.loadMetadata();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  loadMetadata(): void {
    this.loading = true;
    this.errorMessage = '';
    this.metadata = undefined;
    this.changeDetectorRef.detectChanges();

    this.http
      .get<DownloadMetadata>(`${this.apiUrl}/${this.token}/metadata`)
      .subscribe({
        next: (metadata) => {
          this.metadata = metadata;
          this.loading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('DOWNLOAD METADATA ERROR', error);

          this.errorMessage =
            "Ce fichier n'est plus disponible ou n'existe pas.";

          this.loading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  download(): void {
    if (!this.token || this.isExpired()) {
      return;
    }

    window.location.href = `${this.apiUrl}/${this.token}`;
  }

  isExpired(): boolean {
    if (!this.metadata) {
      return false;
    }

    return new Date(this.metadata.expiresAt) < new Date();
  }

  formatSize(size: number): string {
    if (size < 1024) {
      return `${size} o`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1).replace('.', ',')} Ko`;
    }

    if (size < 1024 * 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
    }

    return `${(size / 1024 / 1024 / 1024).toFixed(1).replace('.', ',')} Go`;
  }

  getExpirationLabel(): string {
    if (!this.metadata) {
      return '';
    }

    if (this.isExpired()) {
      return 'Ce fichier a expiré.';
    }

    const expiresAt = new Date(this.metadata.expiresAt).getTime();
    const diffDays = Math.ceil(
      (expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1) {
      return 'Ce fichier expire demain.';
    }

    return `Ce fichier expire dans ${diffDays} jours.`;
  }
}
