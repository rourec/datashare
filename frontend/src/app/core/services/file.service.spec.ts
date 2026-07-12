import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import {
  FileHistory,
  FileService,
  FileUploadResponse
} from './file.service';

describe('FileService', () => {
  let service: FileService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        FileService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(FileService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should load the authenticated user history', () => {
    localStorage.setItem('token', 'jwt-token');

    const expectedFiles: FileHistory[] = [
      {
        uuidFile: 'file-uuid',
        originalFilename: 'document.pdf',
        size: 2048,
        contentType: 'application/pdf',
        downloadUrl: '/api/download/token-123',
        status: 'ACTIVE',
        uploadedAt: '2026-07-11T10:00:00',
        expiresAt: '2026-07-18T10:00:00'
      }
    ];

    service.history().subscribe(files => {
      expect(files).toEqual(expectedFiles);
    });

    const request = httpTesting.expectOne(
      'http://localhost:8080/api/files/history'
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization'))
      .toBe('Bearer jwt-token');

    request.flush(expectedFiles);
  });

  it('should load history without an authorization header when token is absent', () => {
    service.history().subscribe();

    const request = httpTesting.expectOne(
      'http://localhost:8080/api/files/history'
    );

    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush([]);
  });

  it('should upload a file with its expiration period', () => {
    localStorage.setItem('token', 'jwt-token');

    const file = new File(
      ['test content'],
      'document.txt',
      { type: 'text/plain' }
    );

    const response: FileUploadResponse = {
      uuidFile: 'file-uuid',
      originalFilename: 'document.txt',
      size: file.size,
      contentType: 'text/plain',
      downloadToken: 'token-123',
      downloadUrl: '/api/download/token-123',
      expiresAt: '2026-07-18T10:00:00'
    };

    service.upload(file, 3).subscribe(result => {
      expect(result).toEqual(response);
    });

    const request = httpTesting.expectOne(
      'http://localhost:8080/api/files/upload'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization'))
      .toBe('Bearer jwt-token');

    expect(request.request.body).toBeInstanceOf(FormData);

    const formData = request.request.body as FormData;

    expect(formData.get('file')).toBe(file);
    expect(formData.get('expirationDays')).toBe('3');

    request.flush(response);
  });

  it('should use seven days as the default upload expiration', () => {
    const file = new File(['test'], 'document.txt');

    service.upload(file).subscribe();

    const request = httpTesting.expectOne(
      'http://localhost:8080/api/files/upload'
    );

    const formData = request.request.body as FormData;

    expect(formData.get('expirationDays')).toBe('7');

    request.flush({
      uuidFile: 'file-uuid',
      originalFilename: 'document.txt',
      size: file.size,
      contentType: '',
      downloadToken: 'token-123',
      downloadUrl: '/api/download/token-123',
      expiresAt: '2026-07-18T10:00:00'
    });
  });

  it('should delete a file using its UUID', () => {
    localStorage.setItem('token', 'jwt-token');

    service.delete('file-uuid').subscribe(response => {
      expect(response).toBeNull();
    });

    const request = httpTesting.expectOne(
      'http://localhost:8080/api/files/file-uuid'
    );

    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('Authorization'))
      .toBe('Bearer jwt-token');

    request.flush(null);
  });

  it('should build the complete download URL', () => {
    const file: FileHistory = {
      uuidFile: 'file-uuid',
      originalFilename: 'document.pdf',
      size: 2048,
      contentType: 'application/pdf',
      downloadUrl: '/api/download/token-123',
      status: 'ACTIVE',
      uploadedAt: '2026-07-11T10:00:00',
      expiresAt: '2026-07-18T10:00:00'
    };

    expect(service.getDownloadUrl(file))
      .toBe('http://localhost:8080/api/download/token-123');
  });
});
