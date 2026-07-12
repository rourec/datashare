import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import {
  FileHistory,
  FileService
} from '../../core/services/file.service';
import { History } from './history';

describe('History', () => {
  let fixture: ComponentFixture<History>;
  let component: History;
  let router: Router;

  const activeFile: FileHistory = {
    uuidFile: 'active-file',
    originalFilename: 'active.pdf',
    size: 2048,
    contentType: 'application/pdf',
    downloadUrl: '/api/download/active-token',
    status: 'ACTIVE',
    uploadedAt: '2026-07-11T10:00:00',
    expiresAt: '2099-07-18T10:00:00'
  };

  const expiredFile: FileHistory = {
    uuidFile: 'expired-file',
    originalFilename: 'expired.pdf',
    size: 1024,
    contentType: 'application/pdf',
    downloadUrl: '/api/download/expired-token',
    status: 'EXPIRED',
    uploadedAt: '2026-07-01T10:00:00',
    expiresAt: '2000-01-01T00:00:00'
  };

  const fileServiceMock = {
    history: vi.fn(),
    delete: vi.fn(),
    getDownloadUrl: vi.fn()
  };

  const authServiceMock = {
    logout: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    fileServiceMock.history.mockReturnValue(
      of([activeFile, expiredFile])
    );

    fileServiceMock.getDownloadUrl.mockImplementation(
      (file: FileHistory) =>
        `http://localhost:8080${file.downloadUrl}`
    );

    await TestBed.configureTestingModule({
      imports: [History],
      providers: [
        provideRouter([]),
        {
          provide: FileService,
          useValue: fileServiceMock
        },
        {
          provide: AuthService,
          useValue: authServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(History);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    vi.spyOn(router, 'navigate');

    fixture.detectChanges();
  });

  it('should load and render the file history', () => {
    expect(fileServiceMock.history).toHaveBeenCalled();

    expect(component.files).toEqual([
      activeFile,
      expiredFile
    ]);

    expect(component.loading).toBe(false);

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('active.pdf');
    expect(element.textContent).toContain('expired.pdf');
  });

  it('should filter active files', () => {
    component.setFilter('ACTIVE');

    expect(component.filteredFiles).toEqual([
      activeFile
    ]);
  });

  it('should filter expired files', () => {
    component.setFilter('EXPIRED');

    expect(component.filteredFiles).toEqual([
      expiredFile
    ]);
  });

  it('should return all files with the ALL filter', () => {
    component.setFilter('ALL');

    expect(component.filteredFiles).toEqual([
      activeFile,
      expiredFile
    ]);
  });

  it('should identify expired files', () => {
    expect(component.isExpired(activeFile)).toBe(false);
    expect(component.isExpired(expiredFile)).toBe(true);
  });

  it('should generate expiration labels', () => {
    expect(component.getExpirationLabel(expiredFile))
      .toBe('Expiré');

    const tomorrowFile: FileHistory = {
      ...activeFile,
      uuidFile: 'tomorrow-file',
      expiresAt: new Date(
        Date.now() + 12 * 60 * 60 * 1000
      ).toISOString()
    };

    expect(component.getExpirationLabel(tomorrowFile))
      .toBe('Expire demain');

    const futureFile: FileHistory = {
      ...activeFile,
      uuidFile: 'future-file',
      expiresAt: new Date(
        Date.now() + 4 * 24 * 60 * 60 * 1000
      ).toISOString()
    };

    expect(component.getExpirationLabel(futureFile))
      .toBe('Expire dans 4 jours');
  });

  it('should remove a deleted file and reload history', () => {
    fileServiceMock.delete.mockReturnValue(of(undefined));

    fileServiceMock.history.mockReturnValueOnce(
      of([expiredFile])
    );

    component.delete(activeFile);

    expect(fileServiceMock.delete)
      .toHaveBeenCalledWith('active-file');

    expect(component.files).toEqual([
      expiredFile
    ]);

    expect(
      component.files.some(
        file => file.uuidFile === 'active-file'
      )
    ).toBe(false);

    expect(fileServiceMock.history)
      .toHaveBeenCalledTimes(2);
  });

  it('should display an error when deletion fails', () => {
    fileServiceMock.delete.mockReturnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.delete(activeFile);

    expect(component.errorMessage).toBe(
      'Impossible de supprimer le fichier.'
    );
  });

  it('should display an error when history cannot be loaded', () => {
    fileServiceMock.history.mockReturnValue(
      throwError(() => ({
        status: 500
      }))
    );

    component.loadHistory();

    expect(component.files).toEqual([]);

    expect(component.errorMessage).toBe(
      'Impossible de charger vos fichiers.'
    );

    expect(component.loading).toBe(false);
  });

  it('should build and copy the download link', () => {
    const clipboardMock = {
      writeText: vi.fn()
    };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboardMock
    });

    component.copyLink(activeFile);

    expect(clipboardMock.writeText).toHaveBeenCalledWith(
      'http://localhost:8080/api/download/active-token'
    );
  });

  it('should open the download link in a new tab', () => {
    const openSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null);

    component.download(activeFile);

    expect(openSpy).toHaveBeenCalledWith(
      'http://localhost:8080/api/download/active-token',
      '_blank'
    );

    openSpy.mockRestore();
  });

  it('should log out and navigate to login', () => {
    component.logout();

    expect(authServiceMock.logout).toHaveBeenCalled();

    expect(router.navigate).toHaveBeenCalledWith([
      '/login'
    ]);
  });
});
