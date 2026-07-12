import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  const authServiceMock = {
    register: vi.fn()
  };

  const routerMock = {
    navigate: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [Register],
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

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create and render the registration form', () => {
    expect(component).toBeTruthy();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h2')?.textContent)
      .toContain('Créer un compte');

    expect(element.querySelectorAll('input').length).toBe(3);
  });

  it('should reject different passwords', () => {
    component.email = 'user@datashare.fr';
    component.password = 'Password123';
    component.confirmPassword = 'DifferentPassword';

    component.onSubmit();
    fixture.detectChanges();

    expect(authServiceMock.register).not.toHaveBeenCalled();

    expect(component.errorMessage).toBe(
      'Les mots de passe ne correspondent pas.'
    );

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.error-message')?.textContent)
      .toContain('Les mots de passe ne correspondent pas.');
  });

  it('should create an account and redirect to login', () => {
    authServiceMock.register.mockReturnValue(
      of({
        uuidUser: 'user-uuid',
        email: 'user@datashare.fr'
      })
    );

    component.email = 'user@datashare.fr';
    component.password = 'Password123';
    component.confirmPassword = 'Password123';

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith(
      'user@datashare.fr',
      'Password123'
    );

    expect(component.successMessage).toBe(
      'Compte créé avec succès.'
    );

    vi.advanceTimersByTime(800);

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/login'
    ]);
  });

  it('should display an error when registration fails', () => {
    authServiceMock.register.mockReturnValue(
      throwError(() => ({
        status: 409
      }))
    );

    component.email = 'existing@datashare.fr';
    component.password = 'Password123';
    component.confirmPassword = 'Password123';

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe(
      'Impossible de créer le compte.'
    );

    expect(component.successMessage).toBe('');
  });

  it('should navigate to the login page', () => {
    component.goToLogin();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/login'
    ]);
  });
});
