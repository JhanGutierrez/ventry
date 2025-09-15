import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Warehouse } from './warehouse';
import { WarehouseClient } from './services/warehouse-client';
import { IndexedDB } from '@core/services/indexed-db';
import { WarehouseResponse } from '@core/models/warehouse-response';
import { Apollo } from 'apollo-angular';

const MOCK_WAREHOUSES: WarehouseResponse[] = [
  { id: '1', name: 'Almacén Central', location: 'Ciudad Principal', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'Almacén Norte', location: 'Zona Norte', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

describe('Warehouse', () => {
  let component: Warehouse;
  let fixture: ComponentFixture<Warehouse>;
  let mockWarehouseClient: jasmine.SpyObj<WarehouseClient>;
  let mockIndexedDB: jasmine.SpyObj<IndexedDB>;
  let mockApollo: jasmine.SpyObj<Apollo>;

  beforeEach(async () => {
    mockWarehouseClient = jasmine.createSpyObj('WarehouseClient', ['loadWarehouses', 'createWarehouse']);
    mockIndexedDB = jasmine.createSpyObj('IndexedDB', ['clearAndBulkPut', 'getAll', 'add']);
    mockApollo = jasmine.createSpyObj('Apollo', ['watchQuery', 'query', 'mutate']);

    await TestBed.configureTestingModule({
      imports: [Warehouse],
      providers: [
        provideZonelessChangeDetection(),
        { provide: WarehouseClient, useValue: mockWarehouseClient },
        { provide: IndexedDB, useValue: mockIndexedDB },
        { provide: Apollo, useValue: mockApollo },
      ],
    }).compileComponents();

    mockWarehouseClient.loadWarehouses.and.returnValue(of(MOCK_WAREHOUSES));
    mockIndexedDB.clearAndBulkPut.and.returnValue(Promise.resolve());
    mockIndexedDB.getAll.and.returnValue(Promise.resolve(MOCK_WAREHOUSES));
    mockIndexedDB.add.and.returnValue(Promise.resolve('mock-key'));

    fixture = TestBed.createComponent(Warehouse);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit y carga de almacenes', () => {
    it('debería llamar a getWarehouses en ngOnInit y cargar los datos', async () => {
      // Act
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockWarehouseClient.loadWarehouses).toHaveBeenCalled();
      expect(component.isLoadingList()).toBeFalse();
      expect(component.warehouses().length).toBe(2);
      expect(component.warehouses()[0].name).toBe('Almacén Central');
    });

    it('debería intentar cargar desde IndexedDB si la API falla', async () => {
      // Arrange
      const apiError = new Error('Network error');
      mockWarehouseClient.loadWarehouses.and.returnValue(throwError(() => apiError));

      // Act
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockWarehouseClient.loadWarehouses).toHaveBeenCalled();
      expect(mockIndexedDB.getAll).toHaveBeenCalledWith('warehouses');
      expect(component.warehouses().length).toBe(2);
      expect(component.isLoadingList()).toBeFalse();
    });
  });

/*   function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
 */
  describe('Creación de Almacén', () => {
    beforeEach(() => {
        fixture.detectChanges();
    });

    it('no debería llamar al servicio si el formulario es inválido', () => {
      component.createWarehouse();
      expect(mockWarehouseClient.createWarehouse).not.toHaveBeenCalled();
      expect(component.isCreating()).toBeFalse();
    });

    it('debería llamar al servicio createWarehouse con los datos del formulario si es válido', async () => {
      // Arrange
      const newWarehouse = { name: 'Nuevo Almacén', location: 'Nueva Ubicación' };
      const now = new Date().toISOString();
      const newWarehouseResponse: WarehouseResponse = { ...newWarehouse, id: '3', created_at: now, updated_at: now };
      mockWarehouseClient.createWarehouse.and.returnValue(of(newWarehouseResponse));

      // Act
      component.warehouseForm.setValue(newWarehouse);
      component.createWarehouse();

      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockWarehouseClient.createWarehouse).toHaveBeenCalledWith(newWarehouse);
      expect(component.isCreating()).toBeFalse();
      expect(component.warehouses().length).toBe(3);
      expect(component.warehouses()[2].name).toBe('Nuevo Almacén');
      expect(component.modalOpen()).toBeFalse();
    });

    // CAMBIO: de fakeAsync a async
     it('debería intentar guardar en IndexedDB si la creación online falla', async () => {
        // Arrange
        const newWarehouseData = { name: 'Almacén Offline', location: 'Local' };
        mockWarehouseClient.createWarehouse.and.returnValue(throwError(() => new Error('Offline error')));
        spyOn(window, 'alert');

        // Act
        component.warehouseForm.setValue(newWarehouseData);
        component.createWarehouse();

        // Ejecuta whenStable para la primera tanda de tareas asíncronas
        await fixture.whenStable();
        fixture.detectChanges();

        // Usa nuestra función helper para vaciar cualquier promesa pendiente en la cola de eventos.
        await new Promise(resolve => setTimeout(resolve, 0));
        fixture.detectChanges();

        // Assert
        expect(window.alert).toHaveBeenCalledWith('No connection. Warehouse will be saved and created when reconnected.');
        expect(mockIndexedDB.add).toHaveBeenCalledTimes(2);

        expect(component.isCreating()).toBeFalse(); // Esto debería pasar ahora
        expect(component.warehouses().length).toBe(3); // Y esto también
        expect(component.warehouses()[2].name).toBe('Almacén Offline'); // Y esto
    });
  });
});