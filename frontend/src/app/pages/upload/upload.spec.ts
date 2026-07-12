import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FileService, FileUploadResponse } from '../../core/services/file.service';
import { Upload } from './upload';

describe('Upload', () => {
  let component: Upload;

  const fileServiceMock = {
    upload: vi.fn()
  };

  const routerMock = {
    navigate: vi.fn()
  };

  const changeDetectorRefMock = {
    markForCheck: vi.fn(),
    detectChanges: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        Upload,
        {
          provide: FileService,
          useValue: fileServiceMock
        },
        {
          provide: Router,
          useValue: routerMock
        },
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRefMock
        }
      ]
    });

    component = TestBed.inject(Upload);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should select a file and reset the previous state', () => {
    const file = new File(['content'], 'document.txt', {
      type: 'text/plain'
    });

    component.errorMessage = 'Old error';
    component.downloadUrl = 'old-url';
    component.uploadCompleted = true;

    const input = document.createElement('input');

    Object.defineProperty(input, 'files', {
      value: [file]
    });

    component.onFileSelected({
      target: input
    } as unknown as Event);

    expect(component.selectedFile).toBe(file);
    expect(component.errorMessage).toBe('');
    expect(component.downloadUrl).toBe('');
    expect(component.uploadCompleted).toBe(false);
    expect(changeDetectorRefMock.markForCheck).toHaveBeenCalled();
  });

  it('should display an error when no file is selected', () => {
    component.upload();

    expect(component.errorMessage).toBe(
      'Veuillez choisir un fichier.'
    );
    expect(fileServiceMock.upload).not.toHaveBeenCalled();
    expect(changeDetectorRefMock.detectChanges).toHaveBeenCalled();
  });

  it('should upload the selected file and navigate to the success page', () => {
    const file = new File(['content'], 'document.txt', {
      type: 'text/plain'
    });

    const response: FileUploadResponse = {
      uuidFile: 'file-uuid',
      originalFilename: 'document.txt',
      size: file.size,
      contentType: 'text/plain',
      downloadToken: 'download-token',
      downloadUrl: '/api/download/download-token',
      expiresAt: '2026-07-18T10:00:00'
    };

    component.selectedFile = file;
    component.expirationDays = 3;

    fileServiceMock.upload.mockReturnValue(of(response));

    component.upload();

    expect(fileServiceMock.upload).toHaveBeenCalledWith(file, 3);
    expect(component.loading).toBe(false);

    expect(
      JSON.parse(
        sessionStorage.getItem('lastUploadResult') ?? '{}'
      )
    ).toEqual({
      originalFilename: 'document.txt',
      size: file.size,
      expirationDays: 3,
      downloadUrl:
        'http://datashare.fr:4200/download/download-token'
    });

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/upload-success'
    ]);
  });

  it('should display a maximum size error for an HTTP 413 response', () => {
    component.selectedFile = new File(['content'], 'large.zip');

    fileServiceMock.upload.mockReturnValue(
      throwError(() => ({
        status: 413
      }))
    );

    component.upload();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe(
      'Le fichier dépasse la taille maximale autorisée.'
    );
  });

  it('should display a session error for an HTTP 401 response', () => {
    component.selectedFile = new File(['content'], 'document.txt');

    fileServiceMock.upload.mockReturnValue(
      throwError(() => ({
        status: 401
      }))
    );

    component.upload();

    expect(component.errorMessage).toBe(
      'Votre session a expiré. Veuillez vous reconnecter.'
    );
  });

  it('should display the backend error message when available', () => {
    component.selectedFile = new File(['content'], 'document.txt');

    fileServiceMock.upload.mockReturnValue(
      throwError(() => ({
        status: 400,
        error: {
          message: 'Type de fichier non autorisé.'
        }
      }))
    );

    component.upload();

    expect(component.errorMessage).toBe(
      'Type de fichier non autorisé.'
    );
  });

  it('should display a generic error for an unknown failure', () => {
    component.selectedFile = new File(['content'], 'document.txt');

    fileServiceMock.upload.mockReturnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.upload();

    expect(component.errorMessage).toBe(
      'Impossible de téléverser ce fichier.'
    );
  });

  it('should format file sizes', () => {
    expect(component.formatFileSize(1024))
      .toBe('1,0 Ko');

    expect(component.formatFileSize(2 * 1024 * 1024))
      .toBe('2,0 Mo');

    expect(component.formatFileSize(3 * 1024 * 1024 * 1024))
      .toBe('3,0 Go');
  });
});
