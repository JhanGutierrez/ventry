import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';
import { WarehouseClient } from './warehouse-client';
import { GET_WAREHOUSES } from '@graphql/queries/warehouse.queries';
import { INSERT_WAREHOUSE_ONE } from '@graphql/mutations/warehouse.mutations';
import { WarehouseResponse } from '@core/models/warehouse-response';
import { WarehouseInput } from '@core/models/warehouse-input';
import { provideZonelessChangeDetection } from '@angular/core';

describe('WarehouseClient', () => {
  let service: WarehouseClient;
  let apolloSpy: jasmine.SpyObj<Apollo>;

  const MOCK_WAREHOUSES: WarehouseResponse[] = [
    {
      id: 'wh-uuid-001',
      name: 'Mock Warehouse 1',
      location: 'Location 1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wh-uuid-002',
      name: 'Mock Warehouse 2',
      location: 'Location 2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    apolloSpy = jasmine.createSpyObj('Apollo', ['query', 'mutate']);

    TestBed.configureTestingModule({
      providers: [
        WarehouseClient,
        provideZonelessChangeDetection(),
        { provide: Apollo, useValue: apolloSpy },
      ],
    });
    service = TestBed.inject(WarehouseClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadWarehouses', () => {
    it('should call apollo.query with the correct query and return warehouses', (done: DoneFn) => {
      const apolloResponse = {
        data: { warehouses: MOCK_WAREHOUSES },
        loading: false,
        networkStatus: 7,
      };
      apolloSpy.query.and.returnValue(of(apolloResponse));

      service.loadWarehouses().subscribe((warehouses) => {
        expect(warehouses).toEqual(MOCK_WAREHOUSES);
        expect(warehouses.length).toBe(2);
        done();
      });

      expect(apolloSpy.query).toHaveBeenCalledOnceWith({
        query: GET_WAREHOUSES,
        variables: { where: {} },
      });
    });

    it('should pass filters to the query variables', () => {
      // Arrange
      const filters = { name: { _eq: 'Mock Warehouse 1' } };
      apolloSpy.query.and.returnValue(
        of({
          data: { warehouses: [MOCK_WAREHOUSES[0]] },
          loading: false,
          networkStatus: 7,
        })
      );

      // Act
      service.loadWarehouses(filters).subscribe((warehouses) => {
        expect(warehouses).toEqual([MOCK_WAREHOUSES[0]]);
      });

      // Assert
      expect(apolloSpy.query).toHaveBeenCalledOnceWith({
        query: GET_WAREHOUSES,
        variables: { where: filters },
      });
    });
  });

  describe('createWarehouse', () => {
    it('should call apollo.mutate with the correct mutation and variables', (done: DoneFn) => {
      // Arrange
      const newWarehouseInput: WarehouseInput = {
        name: 'New Warehouse',
        location: 'New Location',
      };
      const expectedResponse: WarehouseResponse = {
        ...newWarehouseInput,
        id: 'wh-uuid-003',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const apolloResponse = { data: { insert_warehouses_one: expectedResponse } };
      apolloSpy.mutate.and.returnValue(of(apolloResponse));

      // Act
      service.createWarehouse(newWarehouseInput).subscribe((result) => {
        expect(result).toEqual(expectedResponse);
        expect(result.name).toBe('New Warehouse');
        done();
      });

      expect(apolloSpy.mutate).toHaveBeenCalledOnceWith({
        mutation: INSERT_WAREHOUSE_ONE,
        variables: { object: newWarehouseInput },
      });
    });
  });
});
