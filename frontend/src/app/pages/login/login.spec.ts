import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  const authServiceMock = {
    login: vi.fn()
  };

  const routerMock = {
    navigate: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock
        },
        {
          provide: Router,
          useValue: routerMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render the login form', () => {
    expect(component).toBeTruthy();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h2')?.textContent)
      .toContain('Connexion');

    expect(element.querySelector('input[type="email"]'))
      .toBeTruthy();

    expect(element.querySelector('input[type="password"]'))
      .toBeTruthy();
  });

  it('should authenticate and navigate to the home page', () => {
    authServiceMock.login.mockReturnValue(
      of({
        token: 'jwt-token'
      })
    );

    component.email = 'user@datashare.fr';
    component.password = 'Password123';

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith(
      'user@datashare.fr',
      'Password123'
    );

    expect(component.successMessage).toBe(
      'Connexion réussie.'
    );

    expect(component.errorMessage).toBe('');

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/accueil'
    ]);
  });

  it('should display an authentication error', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({
        status: 401
      }))
    );

    component.email = 'user@datashare.fr';
    component.password = 'wrong-password';

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe(
      'Email ou mot de passe incorrect.'
    );

    expect(component.successMessage).toBe('');

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.error-message')?.textContent)
      .toContain('Email ou mot de passe incorrect.');
  });

  it('should navigate to the registration page', () => {
    component.goToRegister();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/register'
    ]);
  });
});
