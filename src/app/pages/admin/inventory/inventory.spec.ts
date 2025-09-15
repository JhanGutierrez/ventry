import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Inventory } from './inventory';
import { InventoryClient } from './services/inventory-client';
import { IndexedDB } from '@core/services/indexed-db';
import { InventoryResponse } from '@core/models/inventory-response';
import { Apollo } from 'apollo-angular';

const MOCK_INVENTORIES: InventoryResponse[] = [
  {
    id: 'inv10',
    quantity: 50,
    product_id: 'prod10',
    warehouse_id: 'wh10',
    warehouse: {
      id: 'wh10',
      name: 'Depósito Norte',
      location: 'Ciudad Norte',
      created_at: new Date('2023-01-01T10:00:00Z').toISOString(),
      updated_at: new Date('2023-01-02T10:00:00Z').toISOString(),
    },
    product: {
      id: 'prod10',
      name: 'Teclado Mecánico',
      sku: 'SKU-PROD10',
      description: 'Teclado retroiluminado',
      created_at: new Date('2023-01-01T09:00:00Z').toISOString(),
      updated_at: new Date('2023-01-02T09:00:00Z').toISOString(),
    },
    created_at: new Date('2023-01-01T11:00:00Z').toISOString(),
    updated_at: new Date('2023-01-02T11:00:00Z').toISOString(),
  },
  {
    id: 'inv20',
    quantity: 200,
    product_id: 'prod20',
    warehouse_id: 'wh20',
    warehouse: {
      id: 'wh20',
      name: 'Depósito Sur',
      location: 'Ciudad Sur',
      created_at: new Date('2023-02-01T10:00:00Z').toISOString(),
      updated_at: new Date('2023-02-02T10:00:00Z').toISOString(),
    },
    product: {
      id: 'prod20',
      name: 'Monitor 4K',
      sku: 'SKU-PROD20',
      description: 'Monitor de alta resolución',
      created_at: new Date('2023-02-01T09:00:00Z').toISOString(),
      updated_at: new Date('2023-02-02T09:00:00Z').toISOString(),
    },
    created_at: new Date('2023-02-01T11:00:00Z').toISOString(),
    updated_at: new Date('2023-02-02T11:00:00Z').toISOString(),
  },
];

describe('Inventory', () => {
  let component: Inventory;
  let fixture: ComponentFixture<Inventory>;
  let mockInventoryClient: jasmine.SpyObj<InventoryClient>;
  let mockIndexedDB: jasmine.SpyObj<IndexedDB>;
  let mockApollo: jasmine.SpyObj<Apollo>;

  beforeEach(async () => {
    mockInventoryClient = jasmine.createSpyObj('InventoryClient', ['loadInventories']);
    mockIndexedDB = jasmine.createSpyObj('IndexedDB', ['clearAndBulkPut', 'getAll']);
    mockApollo = jasmine.createSpyObj('Apollo', ['query', 'mutate']);

    await TestBed.configureTestingModule({
      imports: [Inventory],
      providers: [
        provideZonelessChangeDetection(),
        { provide: InventoryClient, useValue: mockInventoryClient },
        { provide: IndexedDB, useValue: mockIndexedDB },
        { provide: Apollo, useValue: mockApollo },
      ],
    }).compileComponents();

    // Set default mock responses
    mockInventoryClient.loadInventories.and.returnValue(
      of(JSON.parse(JSON.stringify(MOCK_INVENTORIES)))
    );
    mockIndexedDB.clearAndBulkPut.and.returnValue(Promise.resolve());
    mockIndexedDB.getAll.and.returnValue(
      Promise.resolve(JSON.parse(JSON.stringify(MOCK_INVENTORIES)))
    );

    fixture = TestBed.createComponent(Inventory);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit and inventory loading', () => {
    it('should call getInventories on ngOnInit and load API data', async () => {
      // Act
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockInventoryClient.loadInventories).toHaveBeenCalled();
      expect(component.isLoadingList()).toBeFalse();
      expect(component.inventories().length).toBe(2);
      expect(component.inventories()[0].product.name).toBe('Teclado Mecánico');
    });

    it('should try to load from IndexedDB if API fails', async () => {
      // Arrange
      mockInventoryClient.loadInventories.and.returnValue(throwError(() => new Error('Network error')));

      // Act
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockInventoryClient.loadInventories).toHaveBeenCalled();
      expect(mockIndexedDB.getAll).toHaveBeenCalledWith('inventories');
      expect(component.inventories().length).toBe(2);
      expect(component.isLoadingList()).toBeFalse();
    });

    it('should handle cache error by returning an empty array', async () => {
      // Arrange
      mockInventoryClient.loadInventories.and.returnValue(throwError(() => new Error('Network error')));
      mockIndexedDB.getAll.and.returnValue(Promise.reject('Cache read error'));
      // Act
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(component.isLoadingList()).toBeFalse();
      expect(component.inventories().length).toBe(0);
    });
  });
});