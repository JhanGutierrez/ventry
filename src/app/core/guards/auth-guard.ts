import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SessionManager } from '@core/services/session-manager';

export const authGuard: CanActivateFn = (route, state) => {
  const sessionManager = inject(SessionManager);

  if (sessionManager.isTokenValid())
    return true;

  sessionManager.logout();

  return false;
};
