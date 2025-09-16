import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { LoginCredentials } from '@core/models/login-credentials';
import { AuthClient } from '@core/services/auth-client';
import { SessionManager } from '@core/services/session-manager';
import { VtButton } from '@shared/components/ui/vt-button/vt-button';
import { VtError } from '@shared/components/ui/vt-error/vt-error';
import { VtTextInput } from '@shared/components/ui/vt-text-input/vt-text-input';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, VtButton, VtTextInput, VtError],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private _fb = inject(FormBuilder)
  private _router = inject(Router);
  private _sessionManager = inject(SessionManager);
  private _authClient = inject(AuthClient);
  public loginForm:FormGroup = new FormGroup({})

  constructor(){
    this.loginForm = this._fb.group({
      username: [null, Validators.required],
      password: [null, Validators.required]
    })

    if(this._sessionManager.isAuthenticated())
      this._router.navigate(['/warehouses']);
  }

  public onLogin(){
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: 'Iniciando sesión...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    const credentials: LoginCredentials = this.loginForm.value;

    this._authClient.login(credentials).subscribe({
      next:(token) => {
        if (token) this._sessionManager.startSession(token);
        this._router.navigate(['/warehouses']);
        Swal.close();
        console.log('Login exitoso, token recibido:', token);
      },
      error:(error)=>{
        Swal.fire({
          title: 'Error de autenticación',
          text: 'Usuario o contraseña incorrectos. Por favor, inténtelo de nuevo.',
        });
        console.error('Error en el login:', error);
      }
    })
  }
}