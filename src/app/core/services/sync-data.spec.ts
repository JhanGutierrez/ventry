import { TestBed } from '@angular/core/testing';

import { SyncData } from './sync-data';

describe('SyncData', () => {
  let service: SyncData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
