import { inject, Injectable, signal } from '@angular/core';
import { AuthClient } from './auth-client';
import { Observable, tap } from 'rxjs';
import { LoginCredentials } from '@core/models/login-credentials';
import { Router } from '@angular/router';
import { UserPayload } from '@core/models/user-payload';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class SessionManager {
  private _authClient = inject(AuthClient);
  private _router = inject(Router);

  private _isAuthenticated = signal<boolean>(this.isTokenValid());
  public isAuthenticated = this._isAuthenticated.asReadonly();

  private _currentUser = signal<UserPayload | null>(this.getUserData());
  public currentUser = this._currentUser.asReadonly();

  public login(credentials: LoginCredentials): Observable<string | undefined> {
    return this._authClient.login(credentials).pipe(
      tap((token) => {
        if (token) this.startSession(token);
      })
    );
  }

  public logout(): void {
    localStorage.removeItem('authToken');
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this._router.navigate(['/login']);
  }

  private startSession(token: string): void {
    localStorage.setItem('authToken', token);
    const userData = this.getUserData();
    this._isAuthenticated.set(true);
    this._currentUser.set(userData);
  }

  private getUserData(): UserPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decodedToken: UserPayload = jwtDecode<UserPayload>(token);
      return decodedToken;
    } catch (error) {
      console.error('Error decoding the token:', error);
      this.logout();
      return null;
    }
  }

  public isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decodedToken: UserPayload = jwtDecode<UserPayload>(token);
      const expirationDate = decodedToken.exp * 1000; //Conver to milliseconds
      const isExpired = Date.now() > expirationDate;

      if (isExpired)
        return false;

      return true;
    } catch (error) {
      console.error('Invalid token:', error);
      return false;
    }
  }

  public getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
