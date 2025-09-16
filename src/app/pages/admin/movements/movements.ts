import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DataTable, DataTableHeaders } from '@shared/components/data-table/data-table';
import { VtButton } from '@shared/components/ui/vt-button/vt-button';
import { LucideIconData, Plus, LucideAngularModule } from 'lucide-angular';
import { VtModal } from '@shared/components/ui/vt-modal/vt-modal';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VtError } from '@shared/components/ui/vt-error/vt-error';
import { VtTextInput } from '@shared/components/ui/vt-text-input/vt-text-input';
import { VtSpinner } from '@shared/components/ui/vt-spinner/vt-spinner';
import { VtSelect, VtSelectOption } from '@shared/components/ui/vt-select/vt-select';
import {
  catchError,
  concat,
  EMPTY,
  finalize,
  forkJoin,
  from,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { ProductClient } from '../product/services/product-client';
import { WarehouseClient } from '../warehouse/services/warehouse-client';
import { DatePipe } from '@angular/common';
import { MovementsClient } from './services/movements-client';
import { MovementResponse } from '@core/models/movement-response';
import { InventoryClient } from '../inventory/services/inventory-client';
import { IndexedDB } from '@core/services/indexed-db';
import { v4 as uuidv4 } from 'uuid';
import { ProductResponse } from '@core/models/product-response';
import { WarehouseResponse } from '@core/models/warehouse-response';
import { InventoryResponse } from '@core/models/inventory-response';
import { SessionManager } from '@core/services/session-manager';
import { OnlineStatus } from '@core/services/online-status';

@Component({
  selector: 'app-movements',
  imports: [
    VtButton,
    LucideAngularModule,
    DataTable,
    VtModal,
    ReactiveFormsModule,
    VtError,
    VtTextInput,
    VtSpinner,
    VtSelect,
  ],
  providers: [DatePipe],
  templateUrl: './movements.html',
  styleUrl: './movements.css',
})
export class Movements implements OnDestroy, OnInit {
  private _indexedDB = inject(IndexedDB);
  private _movementsClient = inject(MovementsClient);
  private _productClient = inject(ProductClient);
  private _warehouseClient = inject(WarehouseClient);
  private _inventoryClient = inject(InventoryClient);
  private _datePipe = inject(DatePipe);
  private _onlineStatus = inject(OnlineStatus);
  private _fb = inject(FormBuilder);
  private _sessionManager = inject(SessionManager);

  public readonly addIcon = signal<LucideIconData>(Plus);
  public movements = signal<Partial<MovementResponse>[]>([]);
  public products = signal<VtSelectOption[]>([]);
  public warehouses = signal<VtSelectOption[]>([]);
  public types = signal<VtSelectOption[]>([
    { label: 'Seleccione un tipo', value: null, disabled: true },
    { label: 'Entrada', value: 'INBOUND' },
    { label: 'Salida', value: 'OUTBOUND' },
  ]);

  public isLoadingList = signal<boolean>(false);
  public isCreating = signal<boolean>(false);
  public inventoryForm: FormGroup = new FormGroup({});
  public modalOpen = signal(false);
  private _destroy$ = new Subject<void>();

  public headers = signal<DataTableHeaders<MovementResponse>[]>([
    { key: 'quantity', label: 'Cantidad' },
    { key: 'user.username', label: 'Usuario', cellValue: (row) => row.user?.username || 'n/a' },
    {
      key: 'type',
      label: 'Tipo',
      cellValue: (row) => (row.type === 'INBOUND' ? 'Entrada' : 'Salida'),
    },
    {
      key: 'reason',
      label: 'Razón',
      cellValue: (row) => row.reason,
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      cellValue: (row) => this._datePipe.transform(row.created_at, 'short'),
    },
  ]);

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
  }

  private initializeForm() {
    this.inventoryForm = this._fb.group({
      quantity: [null, Validators.required],
      warehouse_id: [null, Validators.required],
      product_id: [null, Validators.required],
      type: [null, Validators.required],
      reason: [null, Validators.required],
    });
  }

  private loadInitialData() {
    forkJoin({
      products: this.getProducts(),
      warehouses: this.getWarehouses(),
      movements: this.getMovements(),
      inventories: this.getInventories(),
    }).subscribe({
      next: ({ products, warehouses, movements }) => {
        this.mapProducts(products);
        this.mapWarehouses(warehouses);
        this.movements.set(movements);
      },
      error: (err) => console.error('Failed to load initial data:', err),
    });
  }

  private fetchDataAndCache<T extends { id: any }>(
    storeName: 'products' | 'warehouses' | 'inventories' | 'movements',
    fetchFromApi$: Observable<T[]>
  ): Observable<T[]> {
    if (this._onlineStatus.isOnline()) {
      return fetchFromApi$.pipe(
        tap((itemsFromServer) => {
          // Update the cache in the background. We don't need to wait for it to finish.
          this._indexedDB
            .clearAndBulkPut<T>(storeName, itemsFromServer)
            .then(() => console.log(`${storeName} cached successfully.`))
            .catch((err) => console.error(`Failed to cache ${storeName}:`, err));
        }),
        // If the API fails (even while online), use the cache as a last resort.
        catchError((error) => {
          console.warn(
            `API call for ${storeName} failed while online. Falling back to cache.`,
            error
          );
          return from(this._indexedDB.getAll<T>(storeName));
        })
      );
    } else {
      console.log(`Offline. Fetching ${storeName} directly from cache.`);
      return from(this._indexedDB.getAll<T>(storeName));
    }
  }

  private getProducts() {
    return this.fetchDataAndCache<ProductResponse>('products', this._productClient.loadProducts());
  }

  private getWarehouses() {
    return this.fetchDataAndCache<WarehouseResponse>(
      'warehouses',
      this._warehouseClient.loadWarehouses()
    );
  }

  private getInventories() {
    return this.fetchDataAndCache<InventoryResponse>(
      'inventories',
      this._inventoryClient.loadInventories()
    );
  }

  private getMovements() {
    return this.fetchDataAndCache<MovementResponse>(
      'movements',
      this._movementsClient.loadMovements()
    );
  }

  private mapProducts(products: ProductResponse[]) {
    this.products.set([
      { label: 'Seleccionar', value: null, disabled: true },
      ...products.map((p) => ({ label: p.name, value: p.id })),
    ]);
  }

  private mapWarehouses(warehouses: WarehouseResponse[]) {
    this.warehouses.set([
      { label: 'Seleccionar', value: null, disabled: true },
      ...warehouses.map((w) => ({ label: w.name, value: w.id })),
    ]);
  }

  public createMovement() {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    const formValue = this.inventoryForm.value;

    if (this._onlineStatus.isOnline()) {
      this._inventoryClient
        .loadInventories({
          where: {
            _and: [
              { product_id: { _eq: formValue.product_id } },
              { warehouse_id: { _eq: formValue.warehouse_id } },
            ],
          },
        })
        .pipe(
          switchMap((inventories) => this.processInventory(inventories)),
          finalize(() => this.isCreating.set(false)),
          takeUntil(this._destroy$)
        )
        .subscribe({
          next: (movement) => {
            this.onFinishCreation(movement);
          },
          error: (err) => {
            this.isCreating.set(false);
            console.error('Critical error during save process:', err);
            alert('Could not save the movement, not even locally.');
          },
        });

      return;
    }

    this.createMovementOffline();
  }

  private processInventory(inventories: InventoryResponse[]): Observable<MovementResponse> {
    const formValue = this.inventoryForm.value;
    if (inventories.length > 0) {
      const inventory = inventories[0];

      const newQuantity =
        formValue.type === 'INBOUND'
          ? inventory.quantity + +formValue.quantity
          : inventory.quantity - +formValue.quantity;

      if (newQuantity < 0) {
        alert('Insufficient stock for outbound movement.');
        return EMPTY;
      }

      return this.updateInventoryOnline(inventory.id, newQuantity);
    }

    return this.createInventoryOnline();
  }

  private updateInventoryOnline(
    inventoryId: string,
    quantity: number
  ): Observable<MovementResponse> {
    const formValue = this.inventoryForm.value;
    const userId =
      this._sessionManager.currentUser()?.['https://hasura.io/jwt/claims']['x-hasura-user-id'];

    return this._inventoryClient.updateInventory({ id: inventoryId }, { quantity }).pipe(
      switchMap(() =>
        this._movementsClient.createMovement({
          inventory_id: inventoryId,
          quantity: +formValue.quantity,
          reason: formValue.reason,
          type: formValue.type,
          user_id: userId,
        })
      )
    );
  }

  private createInventoryOnline(): Observable<MovementResponse> {
    const formValue = this.inventoryForm.value;
    const userId =
      this._sessionManager.currentUser()?.['https://hasura.io/jwt/claims']['x-hasura-user-id'];
    return this._inventoryClient
      .createInventory({
        quantity: +formValue.quantity,
        product_id: formValue.product_id,
        warehouse_id: formValue.warehouse_id,
      })
      .pipe(
        switchMap((inventory) =>
          this._movementsClient.createMovement({
            inventory_id: inventory.id,
            quantity: +formValue.quantity,
            reason: formValue.reason,
            type: formValue.type,
            user_id: userId,
          })
        )
      );
  }

  private createMovementOffline(): Observable<any> {
    return from(
      (async () => {
        const formValue = this.inventoryForm.value;

        // Check if inventory for this product/warehouse exists in cache
        const cachedInventory = await this._indexedDB.getFromIndex<InventoryResponse>(
          'inventories',
          'product_warehouse',
          [formValue.product_id, formValue.warehouse_id]
        );

        // CASE_1: Inventory exists in cache, update it
        if (cachedInventory) {
          const change = +formValue.quantity;
          const newQuantity =
            formValue.type === 'INBOUND'
              ? cachedInventory.quantity + change
              : cachedInventory.quantity - change;

          // If not enough stock, throw error
          if (newQuantity < 0)
            throw new Error('Stock insuficiente (según los últimos datos offline).');

          const updatedInventory = {
            ...cachedInventory,
            quantity: newQuantity,
            sync_status: 'PENDING_UPDATE',
            updated_at: new Date().toISOString(),
          };

          // Update inventory in cache
          await this._indexedDB.update('inventories', updatedInventory);

          const optimisticMovement = {
            id: uuidv4(),
            inventory_id: cachedInventory.id,
            quantity: +formValue.quantity,
            type: formValue.type,
            reason: formValue.reason,
            user: { username: 'Pending' },
            sync_status: 'PENDING_CREATION',
            created_at: new Date().toISOString(),
          };

          // Save it in its own cache table so it appears on reload
          await this._indexedDB.add('movements', optimisticMovement);

          this.onFinishCreation(optimisticMovement);
          return optimisticMovement;
        }

        // CASE_2: Inventory does not exist, create it (only if inbound)

        // Cannot do outbound for product with no inventory
        if (formValue.type === 'OUTBOUND') {
          throw new Error(
            'No se puede registrar una salida para un producto sin inventario offline.'
          );
        }

        const newInventoryId = uuidv4();
        const optimisticInventory = {
          id: newInventoryId,
          product_id: formValue.product_id,
          warehouse_id: formValue.warehouse_id,
          quantity: +formValue.quantity,
          product: {
            name: this.products().find((p) => p.value === formValue.product_id)?.label || 'n/a',
          },
          warehouse: {
            name: this.warehouses().find((w) => w.value === formValue.warehouse_id)?.label || 'n/a',
          },
          sync_status: 'PENDING_CREATION',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const optimisticMovement = {
          id: uuidv4(),
          inventory_id: newInventoryId,
          quantity: +formValue.quantity,
          type: formValue.type,
          reason: formValue.reason,
          user: { username: 'Pending' },
          sync_status: 'PENDING_CREATION',
          created_at: new Date().toISOString(),
        };

        // Add new inventory to cache
        await this._indexedDB.add('inventories', optimisticInventory);

        // Save it in its own cache table so it appears on reload
        await this._indexedDB.add('movements', optimisticMovement);

        this.onFinishCreation(optimisticMovement);
        return optimisticMovement;
      })()
    );
  }

  private onFinishCreation(movement: Partial<MovementResponse>): void {
    this.movements.update((current) => [movement, ...current]);

    this.isCreating.set(false);
    this.modalOpen.set(false);
    this.inventoryForm.reset();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}