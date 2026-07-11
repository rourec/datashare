import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  FileHistory,
  FileService
} from '../../core/services/file.service';
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
  loading = false;

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
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
    this.changeDetectorRef.markForCheck();
  }

  loadHistory(): void {
    this.loading = true;
    this.errorMessage = '';
    this.changeDetectorRef.markForCheck();

    this.fileService.history()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetectorRef.detectChanges();
        })
      )
      .subscribe({
        next: (files) => {
          this.files = [...files];
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('HISTORY ERROR', error);
          this.files = [];
          this.errorMessage = 'Impossible de charger vos fichiers.';
          this.changeDetectorRef.detectChanges();
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
    this.errorMessage = '';

    this.fileService.delete(file.uuidFile).subscribe({
      next: () => {
        // Retrait immédiat de la liste, sans attendre un second appel HTTP.
        this.files = this.files.filter(
          currentFile => currentFile.uuidFile !== file.uuidFile
        );

        this.changeDetectorRef.detectChanges();

        // Resynchronisation silencieuse avec le backend.
        this.loadHistory();
      },
      error: (error) => {
        console.error('DELETE ERROR', error);
        this.errorMessage = 'Impossible de supprimer le fichier.';
        this.changeDetectorRef.detectChanges();
      }
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
    const now = Date.now();
    const diffDays = Math.ceil(
      (expiresAt - now) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1) {
      return 'Expire demain';
    }

    return `Expire dans ${diffDays} jours`;
  }
}
