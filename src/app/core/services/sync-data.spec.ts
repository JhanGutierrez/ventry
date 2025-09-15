import { TestBed } from '@angular/core/testing';

import { SyncData } from './sync-data';
import { provideZonelessChangeDetection } from '@angular/core';
import { Apollo } from 'apollo-angular';

describe('SyncData', () => {
  let service: SyncData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), Apollo],
    });
    service = TestBed.inject(SyncData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
