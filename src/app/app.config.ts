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
import { InMemoryCache } from '@apollo/client/core';
import { provideServiceWorker } from '@angular/service-worker';
import { setContext } from '@apollo/client/link/context';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideApollo(() => {
      const httpLink = inject(HttpLink);

      const authLink = setContext((_, { headers }) => {
        const token = localStorage.getItem('authToken');

        if (!token)
          return { headers };

        return {
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
          },
        };
      });

      return {
        link: authLink.concat(
          httpLink.create({
            uri: 'https://prepared-grouper-21.hasura.app/v1/graphql',
          })
        ),
        cache: new InMemoryCache(),
      };
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};