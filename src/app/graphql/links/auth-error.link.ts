import { onError } from '@apollo/client/link/error';
import { SessionManager } from '@core/services/session-manager';

export function createAuthErrorLink(sessionManager: SessionManager) {
  return onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        const code = err.extensions?.['code'];
        const isAuthError =
          code === 'authorization-failed' ||
          code === 'invalid-jwt' ||
          code === 'validation-failed' ||
          err.message.toLowerCase().includes('jwt');

        if (isAuthError) {
          sessionManager.logout();
          return;
        }
      }
    }
    if (networkError) {
      console.error(`[Network Error]: ${networkError.message}`);
    }
  });
}
