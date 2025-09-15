import { TestBed } from '@angular/core/testing';

import { AuthClient } from './auth-client';
import { provideZonelessChangeDetection } from '@angular/core';
import { Apollo } from 'apollo-angular';

describe('AuthClient', () => {
  let service: AuthClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[],
      providers: [provideZonelessChangeDetection(), Apollo]
    });
    service = TestBed.inject(AuthClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
