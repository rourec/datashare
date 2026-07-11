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

@Component({
  selector: 'app-upload',
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.scss'
})
export class Upload {
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.selectedFile = input.files?.[0];
    this.errorMessage = '';
    this.downloadUrl = '';
    this.uploadCompleted = false;

    this.changeDetectorRef.markForCheck();
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

  upload(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Veuillez choisir un fichier.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.loading = true;
    this.changeDetectorRef.detectChanges();

    this.fileService.upload(this.selectedFile, this.expirationDays).subscribe({
      next: (response: FileUploadResponse) => {
        const publicDownloadUrl =
          `http://datashare.fr:4200/download/${response.downloadToken}`;

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
        this.errorMessage = this.getUploadErrorMessage(error);

        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private getUploadErrorMessage(error: any): string {
    if (error?.status === 413) {
      return 'Le fichier dépasse la taille maximale autorisée.';
    }

    if (error?.status === 401 || error?.status === 403) {
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    return 'Impossible de téléverser ce fichier.';
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.downloadUrl);
  }
}
