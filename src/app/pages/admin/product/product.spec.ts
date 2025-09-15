import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Product } from './product';
import { ProductClient } from './services/product-client';
import { IndexedDB } from '@core/services/indexed-db';
import { ProductResponse } from '@core/models/product-response';
import { Apollo } from 'apollo-angular';

// Mock de datos para usar en los tests
const MOCK_PRODUCTS: ProductResponse[] = [
  { id: '1', sku: 'SKU001', name: 'Laptop Pro', description: 'Potente laptop', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', sku: 'SKU002', name: 'Mouse Inalámbrico', description: 'Mouse ergonómico', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

describe('Product', () => {
  let component: Product;
  let fixture: ComponentFixture<Product>;
  let mockProductClient: jasmine.SpyObj<ProductClient>;
  let mockIndexedDB: jasmine.SpyObj<IndexedDB>;
  let mockApollo: jasmine.SpyObj<Apollo>;

  beforeEach(async () => {
    // Crear spies para todas las dependencias
    mockProductClient = jasmine.createSpyObj('ProductClient', ['loadProducts', 'createProduct']);
    mockIndexedDB = jasmine.createSpyObj('IndexedDB', ['clearAndBulkPut', 'getAll', 'add']);
    mockApollo = jasmine.createSpyObj('Apollo', ['query', 'mutate']); // Para dependencias indirectas (ej. AppPermission)

    await TestBed.configureTestingModule({
      imports: [Product],
      providers: [
        provideZonelessChangeDetection(),
        // Proveer las versiones "mock" de los servicios
        { provide: ProductClient, useValue: mockProductClient },
        { provide: IndexedDB, useValue: mockIndexedDB },
        { provide: Apollo, useValue: mockApollo },
      ],
    }).compileComponents();

    // Configurar respuestas por defecto para los mocks
    mockProductClient.loadProducts.and.returnValue(of(MOCK_PRODUCTS));
    mockIndexedDB.clearAndBulkPut.and.returnValue(Promise.resolve());
    mockIndexedDB.getAll.and.returnValue(Promise.resolve(MOCK_PRODUCTS));
    mockIndexedDB.add.and.returnValue(Promise.resolve('mock-id'));

    fixture = TestBed.createComponent(Product);
    component = fixture.componentInstance;
    // No llamamos a detectChanges() aquí para tener control en cada test
  });

  it('should create', () => {
    fixture.detectChanges(); // Dispara ngOnInit
    expect(component).toBeTruthy();
  });

  describe('ngOnInit y carga de productos', () => {
    it('debería llamar a getProducts en ngOnInit y cargar los datos de la API', async () => {
      // Act
      fixture.detectChanges(); // Ejecuta ngOnInit
      await fixture.whenStable(); // Espera a que se resuelvan los observables
      fixture.detectChanges(); // Actualiza la vista

      // Assert
      expect(mockProductClient.loadProducts).toHaveBeenCalled();
      expect(component.isLoadingList()).toBeFalse();
      expect(component.products().length).toBe(2);
      expect(component.products()[0].name).toBe('Laptop Pro');
    });

    it('debería intentar cargar desde IndexedDB si la API falla', async () => {
      // Arrange
      mockProductClient.loadProducts.and.returnValue(throwError(() => new Error('Network error')));

      // Act
      fixture.detectChanges(); // Ejecuta ngOnInit
      await fixture.whenStable(); // Espera a que se resuelva el error y la carga de caché
      fixture.detectChanges();

      // Assert
      expect(mockProductClient.loadProducts).toHaveBeenCalled();
      expect(mockIndexedDB.getAll).toHaveBeenCalledWith('products');
      expect(component.products().length).toBe(2); // Datos cargados desde el mock de IndexedDB
      expect(component.isLoadingList()).toBeFalse();
    });
  });

  describe('Creación de Producto', () => {
    beforeEach(async () => {
      fixture.detectChanges(); // Asegurarse de que ngOnInit se haya ejecutado
      await fixture.whenStable(); // Y que la carga inicial de datos haya terminado
      fixture.detectChanges();
    });

    it('no debería llamar al servicio si el formulario es inválido', () => {
      // Act: El formulario está vacío por defecto, por lo que es inválido
      component.createProduct();

      // Assert
      expect(mockProductClient.createProduct).not.toHaveBeenCalled();
      expect(component.isCreating()).toBeFalse();
    });

    it('debería llamar al servicio createProduct con los datos del formulario si es válido', async () => {
      // Arrange
      const newProductData = { sku: 'SKU003', name: 'Teclado Mecánico', description: 'RGB' };
      const now = new Date().toISOString();
      const newProductResponse: ProductResponse = { ...newProductData, id: '3', created_at: now, updated_at: now };

      mockProductClient.createProduct.and.returnValue(of(newProductResponse));

      // Act
      component.productForm.setValue(newProductData);
      component.createProduct();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockProductClient.createProduct).toHaveBeenCalledWith(newProductData);
      expect(component.isCreating()).toBeFalse();
      expect(component.products().length).toBe(3);
      expect(component.products()[2].name).toBe('Teclado Mecánico');
      expect(component.modalOpen()).toBeFalse(); // El modal debería cerrarse
    });

    it('debería intentar guardar en IndexedDB si la creación online falla', async () => {
        // Arrange
        const newProductData = { sku: 'SKU-OFFLINE', name: 'Producto Offline', description: 'Guardado localmente' };
        mockProductClient.createProduct.and.returnValue(throwError(() => new Error('Offline error')));
        spyOn(window, 'alert');

        // Act
        component.productForm.setValue(newProductData);
        component.createProduct();

        // 1. Espera a la primera tanda de tareas asíncronas
        await fixture.whenStable();
        fixture.detectChanges();

        // 2. <<-- APLICA LA MISMA CORRECCIÓN AQUÍ -->>
        // Usa la función helper para vaciar la cola de promesas
        await new Promise(resolve => setTimeout(resolve, 0));
        // Un detectChanges final para aplicar las actualizaciones de estado
        fixture.detectChanges();

        // Assert
        expect(window.alert).toHaveBeenCalledWith('No connection. Product will be saved and created when reconnected.');
        expect(mockIndexedDB.add).toHaveBeenCalledTimes(2);

        // Estas aserciones ahora pasarán
        expect(component.isCreating()).toBeFalse();
        expect(component.products().length).toBe(3);
        expect(component.products()[2].name).toBe('Producto Offline');
    });
  });
});