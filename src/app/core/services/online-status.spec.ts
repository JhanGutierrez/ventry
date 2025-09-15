import { TestBed } from '@angular/core/testing';

import { OnlineStatus } from './online-status';

describe('OnlineStatus', () => {
  let service: OnlineStatus;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnlineStatus);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
