import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { Download } from './download';

describe('Download', () => {
  const httpMock = {
    get: vi.fn()
  };

  const changeDetectorRefMock = {
    detectChanges: vi.fn()
  };

  function createComponent(token: string | null): Download {
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        Download,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue(token)
              }
            }
          }
        },
        {
          provide: HttpClient,
          useValue: httpMock
        },
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRefMock
        }
      ]
    });

    return TestBed.inject(Download);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject a link without a token', () => {
    const component = createComponent(null);

    component.ngOnInit();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe(
      'Lien de téléchargement invalide.'
    );
    expect(httpMock.get).not.toHaveBeenCalled();
  });

  it('should load the file metadata', () => {
    const component = createComponent('download-token');

    const metadata = {
      originalFilename: 'document.pdf',
      size: 2048,
      contentType: 'application/pdf',
      expiresAt: '2099-07-18T10:00:00'
    };

    httpMock.get.mockReturnValue(of(metadata));

    component.ngOnInit();

    expect(httpMock.get).toHaveBeenCalledWith(
      'http://datashare.fr:8080/api/download/download-token/metadata'
    );

    expect(component.metadata).toEqual(metadata);
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('should display an error when metadata cannot be loaded', () => {
    const component = createComponent('invalid-token');

    httpMock.get.mockReturnValue(
      throwError(() => ({
        status: 404
      }))
    );

    component.ngOnInit();

    expect(component.metadata).toBeUndefined();
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe(
      "Ce fichier n'est plus disponible ou n'existe pas."
    );
  });

  it('should detect an expired file', () => {
    const component = createComponent('download-token');

    component.metadata = {
      originalFilename: 'old.pdf',
      size: 100,
      contentType: 'application/pdf',
      expiresAt: '2000-01-01T00:00:00'
    };

    expect(component.isExpired()).toBe(true);
    expect(component.getExpirationLabel()).toBe(
      'Ce fichier a expiré.'
    );
  });

  it('should return false when no metadata is available', () => {
    const component = createComponent('download-token');

    expect(component.isExpired()).toBe(false);
    expect(component.getExpirationLabel()).toBe('');
  });

  it('should display the tomorrow expiration label', () => {
    const component = createComponent('download-token');

    component.metadata = {
      originalFilename: 'document.pdf',
      size: 100,
      contentType: 'application/pdf',
      expiresAt: new Date(
        Date.now() + 12 * 60 * 60 * 1000
      ).toISOString()
    };

    expect(component.getExpirationLabel()).toBe(
      'Ce fichier expire demain.'
    );
  });

  it('should display the number of remaining days', () => {
    const component = createComponent('download-token');

    component.metadata = {
      originalFilename: 'document.pdf',
      size: 100,
      contentType: 'application/pdf',
      expiresAt: new Date(
        Date.now() + 4 * 24 * 60 * 60 * 1000
      ).toISOString()
    };

    expect(component.getExpirationLabel()).toBe(
      'Ce fichier expire dans 4 jours.'
    );
  });

  it('should format file sizes', () => {
    const component = createComponent('download-token');

    expect(component.formatSize(500)).toBe('500 o');
    expect(component.formatSize(1024)).toBe('1,0 Ko');
    expect(component.formatSize(2 * 1024 * 1024)).toBe('2,0 Mo');
    expect(component.formatSize(3 * 1024 * 1024 * 1024))
      .toBe('3,0 Go');
  });

  it('should not download an expired file', () => {
    const component = createComponent('download-token');

    component.token = 'download-token';
    component.metadata = {
      originalFilename: 'old.pdf',
      size: 100,
      contentType: 'application/pdf',
      expiresAt: '2000-01-01T00:00:00'
    };

    const initialLocation = window.location.href;

    component.download();

    expect(window.location.href).toBe(initialLocation);
  });
});
