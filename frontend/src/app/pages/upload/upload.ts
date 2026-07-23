import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  FileService,
  FileUploadResponse
} from '../../core/services/file.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.scss'
})
export class Upload {
  private readonly maxFileSize = 1024 * 1024 * 1024;

  private readonly allowedFileTypes = [
    'text/plain',
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  selectedFile?: File;
  expirationDays = 7;
  downloadUrl = '';
  errorMessage = '';
  uploadCompleted = false;
  loading = false;

  constructor(
    private fileService: FileService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  get fileTooLarge(): boolean {
    return Boolean(
      this.selectedFile
      && this.selectedFile.size > this.maxFileSize
    );
  }

  get fileTypeNotAllowed(): boolean {
    return Boolean(
      this.selectedFile
      && !this.allowedFileTypes.includes(this.selectedFile.type)
    );
  }

  get uploadDisabled(): boolean {
    return this.loading
      || !this.selectedFile
      || this.fileTooLarge
      || this.fileTypeNotAllowed;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.selectedFile = input.files?.[0];
    this.downloadUrl = '';
    this.uploadCompleted = false;

    if (this.fileTooLarge) {
      this.errorMessage =
        'La taille des fichiers est limitée à 1 Go.';
    } else if (this.fileTypeNotAllowed) {
      this.errorMessage =
        'Type de fichier non autorisé.';
    } else {
      this.errorMessage = '';
    }

    this.changeDetectorRef.markForCheck();
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} o`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024)
        .toFixed(1)
        .replace('.', ',')} Ko`;
    }

    if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024))
        .toFixed(1)
        .replace('.', ',')} Mo`;
    }

    return `${(size / (1024 * 1024 * 1024))
      .toFixed(1)
      .replace('.', ',')} Go`;
  }

  upload(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Veuillez choisir un fichier.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    if (this.fileTooLarge) {
      this.errorMessage =
        'La taille des fichiers est limitée à 1 Go.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    if (this.fileTypeNotAllowed) {
      this.errorMessage =
        'Type de fichier non autorisé.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.loading = true;
    this.changeDetectorRef.detectChanges();

    this.fileService
      .upload(this.selectedFile, this.expirationDays)
      .subscribe({
        next: (response: FileUploadResponse) => {
          const publicDownloadUrl =
            `${environment.frontendBaseUrl}/download/`
            + response.downloadToken;

          sessionStorage.setItem(
            'lastUploadResult',
            JSON.stringify({
              originalFilename: response.originalFilename,
              size: response.size,
              expirationDays: this.expirationDays,
              downloadUrl: publicDownloadUrl
            })
          );

          this.loading = false;
          this.changeDetectorRef.detectChanges();

          this.router.navigate(['/upload-success']);
        },
        error: (error) => {
          console.error('UPLOAD ERROR', error);

          this.loading = false;
          this.errorMessage =
            this.getUploadErrorMessage(error);

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private getUploadErrorMessage(error: any): string {
    if (error?.status === 413) {
      return 'La taille des fichiers est limitée à 1 Go.';
    }

    if (
      error?.status === 401
      || error?.status === 403
    ) {
      return 'Votre session a expiré. '
        + 'Veuillez vous reconnecter.';
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    return 'Impossible de téléverser ce fichier.';
  }
}
