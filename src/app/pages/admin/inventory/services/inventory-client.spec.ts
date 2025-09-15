import { TestBed } from '@angular/core/testing';

import { InventoryClient } from './inventory-client';
import { provideZonelessChangeDetection } from '@angular/core';
import { Apollo } from 'apollo-angular';

describe('InventoryClient', () => {
  let service: InventoryClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), Apollo]
    });
    service = TestBed.inject(InventoryClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
