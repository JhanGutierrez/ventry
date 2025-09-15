import { TestBed } from '@angular/core/testing';

import { MovementsClient } from './movements-client';
import { provideZonelessChangeDetection } from '@angular/core';
import { Apollo } from 'apollo-angular';

describe('MovementsClient', () => {
  let service: MovementsClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), Apollo]
    });
    service = TestBed.inject(MovementsClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
