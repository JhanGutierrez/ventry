import { TestBed } from '@angular/core/testing';

import { provideZonelessChangeDetection } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { WarehouseClient } from '@pages/admin/warehouse/services/warehouse-client';

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
