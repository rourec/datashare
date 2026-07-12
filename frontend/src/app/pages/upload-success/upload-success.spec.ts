import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { UploadSuccess } from './upload-success';

describe('UploadSuccess', () => {
  let fixture: ComponentFixture<UploadSuccess>;
  let component: UploadSuccess;

  const routerMock = {
    navigate: vi.fn()
  };

  const clipboardMock = {
    writeText: vi.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    sessionStorage.clear();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboardMock
    });

    await TestBed.configureTestingModule({
      imports: [UploadSuccess],
      providers: [
        {
          provide: Router,
          useValue: routerMock
        }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(UploadSuccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should redirect when no upload result is stored', () => {
    createComponent();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/upload'
    ]);
  });

  it('should redirect and clear invalid stored data', () => {
    sessionStorage.setItem(
      'lastUploadResult',
      'invalid-json'
    );

    createComponent();

    expect(
      sessionStorage.getItem('lastUploadResult')
    ).toBeNull();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/upload'
    ]);
  });

  it('should display the uploaded file result', () => {
    sessionStorage.setItem(
      'lastUploadResult',
      JSON.stringify({
        originalFilename: 'document.pdf',
        size: 2048,
        expirationDays: 3,
        downloadUrl:
          'http://datashare.fr:4200/download/token-123'
      })
    );

    createComponent();

    expect(component.uploadResult?.originalFilename)
      .toBe('document.pdf');

    expect(component.getExpirationMessage()).toBe(
      'Félicitations, ton fichier sera conservé chez nous pendant 3 jours !'
    );

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('document.pdf');
    expect(element.textContent).toContain('2,0 Ko');
  });

  it('should display the one-day expiration message', () => {
    component = TestBed.createComponent(
      UploadSuccess
    ).componentInstance;

    component.uploadResult = {
      originalFilename: 'document.pdf',
      size: 100,
      expirationDays: 1,
      downloadUrl: 'download-url'
    };

    expect(component.getExpirationMessage()).toBe(
      'Félicitations, ton fichier sera conservé chez nous pendant une journée !'
    );
  });

  it('should display the one-week expiration message', () => {
    component = TestBed.createComponent(
      UploadSuccess
    ).componentInstance;

    component.uploadResult = {
      originalFilename: 'document.pdf',
      size: 100,
      expirationDays: 7,
      downloadUrl: 'download-url'
    };

    expect(component.getExpirationMessage()).toBe(
      'Félicitations, ton fichier sera conservé chez nous pendant une semaine !'
    );
  });

  it('should format file sizes', () => {
    component = TestBed.createComponent(
      UploadSuccess
    ).componentInstance;

    expect(component.formatFileSize(1024))
      .toBe('1,0 Ko');

    expect(component.formatFileSize(2 * 1024 * 1024))
      .toBe('2,0 Mo');

    expect(
      component.formatFileSize(
        3 * 1024 * 1024 * 1024
      )
    ).toBe('3,0 Go');
  });

  it('should copy the public download link', async () => {
    sessionStorage.setItem(
      'lastUploadResult',
      JSON.stringify({
        originalFilename: 'document.pdf',
        size: 2048,
        expirationDays: 7,
        downloadUrl:
          'http://datashare.fr:4200/download/token-123'
      })
    );

    createComponent();

    component.copyLink();

    await Promise.resolve();

    expect(clipboardMock.writeText).toHaveBeenCalledWith(
      'http://datashare.fr:4200/download/token-123'
    );

    expect(component.copied).toBe(true);
  });

  it('should not copy anything without an upload result', () => {
    component = TestBed.createComponent(
      UploadSuccess
    ).componentInstance;

    component.copyLink();

    expect(clipboardMock.writeText).not.toHaveBeenCalled();
  });
});
