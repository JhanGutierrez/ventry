import { TestBed } from '@angular/core/testing';

import { WarehouseClient } from './product-client';
import { provideZonelessChangeDetection } from '@angular/core';
import { Apollo } from 'apollo-angular';

describe('WarehouseClient', () => {
  let service: WarehouseClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), Apollo]
    });
    service = TestBed.inject(WarehouseClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
