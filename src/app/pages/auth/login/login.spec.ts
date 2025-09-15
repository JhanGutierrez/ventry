import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login } from './login';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SessionManager } from '../../../core/services/session-manager';
import { of } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';

// We simulate the login method.
const mockSessionManager: Partial<SessionManager> = {
  login: jasmine.createSpy('login').and.returnValue(of({ token: 'jwt-token' }))
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
        {provide: SessionManager,  useValue: mockSessionManager}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
     (mockSessionManager.login as jasmine.Spy).calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when the fields are empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should have a valid form when both fields are filled in', () => {
    component.loginForm.controls['username'].setValue('johndoe');
    component.loginForm.controls['password'].setValue('123456');
    expect(component.loginForm.valid).toBeTruthy();
  });

  it('should not call SessionManager.login if the form is invalid', () => {
    // The form is empty by default, so it is invalid
    component.onLogin();
    expect(mockSessionManager.login).not.toHaveBeenCalled();
  });


  it('should call SessionManager.login with the correct credentials if the form is valid', () => {
    const testCredentials = { username: 'johndoe', password: '123456' };
    component.loginForm.controls['username'].setValue(testCredentials.username);
    component.loginForm.controls['password'].setValue(testCredentials.password);

    component.onLogin();

    expect(mockSessionManager.login).toHaveBeenCalledWith(testCredentials);
  });

/*   it('should print an error to the console if SessionManager.login fails', () => {
    spyOn(console, 'error');
    const errorResponse = { status: 401, message: 'Credenciales inválidas' };

    // Reconfiguramos el mock para que devuelva un error esta vez
    mockSessionManager.login.and.returnValue(throwError(() => errorResponse));

    component.loginForm.controls['username'].setValue('wronguser');
    component.loginForm.controls['password'].setValue('wrongpass');
    component.onLogin();

    expect(mockSessionManager.login).toHaveBeenCalled();
    // Verificamos que console.error fue llamado con el error simulado
    expect(console.error).toHaveBeenCalledWith('Error en el login:', errorResponse);
  }); */

});
