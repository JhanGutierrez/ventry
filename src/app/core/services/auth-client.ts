import { inject, Injectable } from '@angular/core';
import { LoginCredentials } from '@core/models/login-credentials';
import { LOGIN_MUTATION } from '@graphql/mutations/login.mutations';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthClient {
  private _apollo = inject(Apollo);

  public login(credentials: LoginCredentials): Observable<string | undefined> {
    return this._apollo
      .mutate<{ login: { token: string } }>({
        mutation: LOGIN_MUTATION,
        variables: credentials,
      })
      .pipe(
        map((response) => response.data?.login.token),
    );
  }
}
