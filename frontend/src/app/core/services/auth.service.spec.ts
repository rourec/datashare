import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should send the login request and store the JWT token', () => {
    service.login('user@datashare.fr', 'Password123').subscribe(response => {
      expect(response.token).toBe('jwt-token');
    });

    const request = httpTesting.expectOne(
      'http://localhost:8080/api/auth/login'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'user@datashare.fr',
      password: 'Password123'
    });

    request.flush({
      token: 'jwt-token'
    });

    expect(localStorage.getItem('token')).toBe('jwt-token');
  });

  it('should send the registration request', () => {
    service.register('user@datashare.fr', 'Password123').subscribe(response => {
      expect(response.uuidUser).toBe('user-uuid');
      expect(response.email).toBe('user@datashare.fr');
    });

    const request = httpTesting.expectOne(
      'http://localhost:8080/api/auth/register'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      firstname: 'DataShare',
      lastname: 'User',
      email: 'user@datashare.fr',
      password: 'Password123'
    });

    request.flush({
      uuidUser: 'user-uuid',
      email: 'user@datashare.fr'
    });
  });

  it('should return the token stored in localStorage', () => {
    localStorage.setItem('token', 'stored-token');

    expect(service.getToken()).toBe('stored-token');
  });

  it('should return null when no token is stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should remove the token during logout', () => {
    localStorage.setItem('token', 'stored-token');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
  });
});
