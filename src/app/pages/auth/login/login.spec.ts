import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionManager } from '../../../core/services/session-manager';
import { of, throwError } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';
import { Login } from './login';
import Swal from 'sweetalert2';

const mockRouter = {
  navigate: jasmine.createSpy('navigate')
};

const mockSessionManager = {
  login: jasmine.createSpy('login'),
  isAuthenticated: jasmine.createSpy('isAuthenticated')
};

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        provideZonelessChangeDetection(),
        FormBuilder,
        { provide: SessionManager, useValue: mockSessionManager },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    mockSessionManager.isAuthenticated.and.returnValue(false);
    mockSessionManager.login.and.returnValue(of({ token: 'jwt-token' }));

    spyOn(Swal, 'fire').and.resolveTo();
    spyOn(Swal, 'close');

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    mockSessionManager.login.calls.reset();
    mockSessionManager.isAuthenticated.calls.reset();
    mockRouter.navigate.calls.reset();
    (Swal.fire as jasmine.Spy).calls.reset();
    (Swal.close as jasmine.Spy).calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Formulario', () => {
    it('debería ser inválido cuando los campos están vacíos', () => {
      expect(component.loginForm.valid).toBeFalsy();
    });

    it('debería ser válido cuando ambos campos están llenos', () => {
      component.loginForm.controls['username'].setValue('johndoe');
      component.loginForm.controls['password'].setValue('123456');
      expect(component.loginForm.valid).toBeTruthy();
    });
  });

  describe('Constructor', () => {
    it('debería navegar a /warehouses si el usuario ya está autenticado', () => {
      mockSessionManager.isAuthenticated.and.returnValue(true);
      fixture = TestBed.createComponent(Login);
      component = fixture.componentInstance;

      expect(mockSessionManager.isAuthenticated).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/warehouses']);
    });

    it('NO debería navegar si el usuario no está autenticado', () => {
      mockSessionManager.isAuthenticated.and.returnValue(false);
      fixture = TestBed.createComponent(Login);
      component = fixture.componentInstance;

      expect(mockSessionManager.isAuthenticated).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });


  describe('onLogin Method', () => {
    it('no debería llamar a SessionManager.login si el formulario es inválido', () => {
      component.onLogin();
      expect(mockSessionManager.login).not.toHaveBeenCalled();
    });

    it('debería mostrar loading, llamar al login, navegar y cerrar el modal en un login exitoso', () => {
      const testCredentials = { username: 'johndoe', password: '123456' };
      component.loginForm.setValue(testCredentials);

      component.onLogin();

      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Iniciando sesión...'
      }));

      expect(mockSessionManager.login).toHaveBeenCalledWith(testCredentials);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/warehouses']);
      expect(Swal.close).toHaveBeenCalled();
    });

    it('debería mostrar un modal de error si el login falla', () => {
      const errorResponse = { status: 401, message: 'Credenciales inválidas' };
      mockSessionManager.login.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      const testCredentials = { username: 'wronguser', password: 'wrongpass' };
      component.loginForm.setValue(testCredentials);

      component.onLogin();

      expect(mockSessionManager.login).toHaveBeenCalledWith(testCredentials);
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Error de autenticación'
      }));

      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(Swal.close).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error en el login:', errorResponse);
    });
  });
});