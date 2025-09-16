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

  private _isAuthenticated = signal<boolean>(this.isTokenValid());
  public isAuthenticated = this._isAuthenticated.asReadonly();

  private _currentUser = signal<UserPayload | null>(this.getUserData());
  public currentUser = this._currentUser.asReadonly();
  private _router = inject(Router);


  public logout(): void {
    localStorage.removeItem('authToken');
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this._router.navigate(['/login']);
  }

  private getUserData(): UserPayload | null {
    const token = localStorage.getItem('authToken');
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
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const decodedToken: UserPayload = jwtDecode<UserPayload>(token);
      const expirationDate = decodedToken.exp * 1000; //Conver to milliseconds
      const isExpired = Date.now() > expirationDate;

      return !isExpired;
    } catch (error) {
      return false;
    }
  }

  public getToken(): string | null {
    if (this.isTokenValid()) {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  public startSession(token: string): void {
    localStorage.setItem('authToken', token);
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage(): void {
    const token = localStorage.getItem('authToken');
    if (token && this.isTokenValid()) {
      try {
        const userData = jwtDecode<UserPayload>(token);
        this._isAuthenticated.set(true);
        this._currentUser.set(userData);
      } catch (error) {
        this.logout();
      }
    } else {
      this.logout();
    }
  }
}
