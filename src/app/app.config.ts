import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  inject,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { provideServiceWorker } from '@angular/service-worker';
import { setContext } from '@apollo/client/link/context';
import { createAuthErrorLink } from '@graphql/links/auth-error.link';
import { SessionManager } from '@core/services/session-manager';
import { InMemoryCache, from as apolloFrom } from '@apollo/client/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      const sessionManager = inject(SessionManager);

      const errorLink = createAuthErrorLink(sessionManager);

      const authLink = setContext((_, { headers }) => {
        const token = localStorage.getItem('authToken');

        if (!token) return { headers };

        return {
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
          },
        };
      });

      const http = httpLink.create({
        uri: 'https://prepared-grouper-21.hasura.app/v1/graphql',
      });

      const link = apolloFrom([errorLink, authLink, http]);

      return {
        link,
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: { fetchPolicy: 'network-only' },
          query: { fetchPolicy: 'network-only' },
        },
      };
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
