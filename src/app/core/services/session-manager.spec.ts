import { TestBed } from '@angular/core/testing';

import { SessionManager } from './session-manager';
import { provideZonelessChangeDetection } from '@angular/core';
import { Apollo } from 'apollo-angular';

describe('SessionManager', () => {
  let service: SessionManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), Apollo]
    });
    service = TestBed.inject(SessionManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
