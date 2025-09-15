import { TestBed } from '@angular/core/testing';

import { IndexedDB } from './indexed-db';
import { provideZonelessChangeDetection } from '@angular/core';

describe('IndexedDB', () => {
  let service: IndexedDB;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection()
      ],
    });
    service = TestBed.inject(IndexedDB);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
