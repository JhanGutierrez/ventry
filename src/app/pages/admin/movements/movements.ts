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
    this.isLoadingList.set(true);
    this.fetchDataFromSource(this.fetchFromNetwork())
      .pipe(
        // If network fails, try cache
        catchError((err) => {
          console.warn('Could not load from network, trying cache.', err);
          return this.fetchDataFromSource(this.fetchFromCache());
        }),
        takeUntil(this._destroy$)
      )
      .subscribe({
        error: (err) => console.error('Failed to load initial data from any source:', err),
      });
  }

  /**
   * Update UI and cache from data source
   */
  private fetchDataFromSource(source$: Observable<MovementViewData>): Observable<void> {
    return source$.pipe(
      tap((data) => this.updateUI(data)),
      switchMap((data) => this.updateCache(data)),
      map(() => void 0), // We don't care about updateCache's value
      finalize(() => this.isLoadingList.set(false))
    );
  }

  /**
   * Create a new movement (online or offline fallback)
   */
  public createMovement(): void {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);

    const formValue = this.inventoryForm.value;

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
        catchError((error) => {
          console.warn('Online save failed, falling back to offline mode.', error);
          alert('Offline. The movement will be saved locally.');
          return this.createMovementOffline();
        }),
        finalize(() => this.isCreating.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (movement) => {
          this.movements.update((current) => [movement, ...current]);
          this.finishCreation();
        },
        error: (err) => {
          console.error('Critical error during save process:', err);
          alert('Could not save the movement, not even locally.');
        },
      });
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

  /**
   * Create a movement in offline mode (local cache)
   */
  private createMovementOffline(): Observable<Partial<MovementResponse>> {
    return from(
      (async () => {
        const formValue = this.inventoryForm.value;

        // Check if inventory for this product/warehouse exists in cache
        const cachedInventory = await this._indexedDB.getFromIndex<InventoryResponse>(
          'inventories',
          'product_warehouse',
          [formValue.product_id, formValue.warehouse_id]
        );

        // CASE 1: Inventory exists in cache, update it
        if (cachedInventory) {
          const change = +formValue.quantity;
          const newQuantity =
            formValue.type === 'INBOUND'
              ? cachedInventory.quantity + change
              : cachedInventory.quantity - change;

          // Validation: If not enough stock, throw error
          if (newQuantity < 0)
            throw new Error('Insufficient stock (according to last offline data).');

          // Update inventory in cache
          const updatedInventory = { ...cachedInventory, quantity: newQuantity };
          await this._indexedDB.update('inventories', updatedInventory);

          // Create pending action to update inventory and create movement
          const pendingAction = {
            id: uuidv4(),
            entity: 'movement',
            action: 'CREATE_MOVEMENT',
            payload: {
              movement: {
                id: uuidv4(),
                inventory_id: cachedInventory.id,
                quantity: +formValue.quantity,
                type: formValue.type,
                reason: formValue.reason,
              },
            },
          };
          await this._indexedDB.add('pending_actions', pendingAction);
        }
        // CASE 2: Inventory does not exist, create it (only if inbound)
        else {
          // Cannot do outbound for product with no inventory
          if (formValue.type === 'OUTBOUND') {
            throw new Error(
              'Cannot register an outbound movement for a product with no offline inventory.'
            );
          }

          const newInventoryId = uuidv4();
          const newLocalInventory = {
            id: newInventoryId,
            product_id: formValue.product_id,
            warehouse_id: formValue.warehouse_id,
            quantity: +formValue.quantity,
          };

          await this._indexedDB.add('inventories', newLocalInventory); // Add new inventory to cache

          const pendingAction = {
            id: uuidv4(),
            entity: 'movement',
            action: 'CREATE_INVENTORY_AND_MOVEMENT',
            payload: {
              inventory: newLocalInventory,
              movement: {
                id: uuidv4(),
                inventory_id: newInventoryId,
                quantity: +formValue.quantity,
                type: formValue.type,
                reason: formValue.reason,
              },
            },
          };
          await this._indexedDB.add('pending_actions', pendingAction);
        }

        // Finally, create the optimistic movement to show in UI immediately
        const optimisticMovement = {
          id: uuidv4(),
          quantity: +formValue.quantity,
          type: formValue.type,
          reason: formValue.reason,
          created_at: new Date().toISOString(),
          user: { username: '(Pending)' }
        };

        // Save it in its own cache table so it appears on reload
        await this._indexedDB.add('movements', optimisticMovement);

        return optimisticMovement;
      })()
    );
  }

  private fetchFromNetwork(): Observable<MovementViewData> {
    return forkJoin({
      products: this._productClient.loadProducts(),
      warehouses: this._warehouseClient.loadWarehouses(),
      movements: this._movementsClient.loadMovements(),
      inventories: this._inventoryClient.loadInventories(),
    });
  }

  private fetchFromCache(): Observable<MovementViewData> {
    return forkJoin({
      products: from(this._indexedDB.getAll<ProductResponse>('products')),
      warehouses: from(this._indexedDB.getAll<WarehouseResponse>('warehouses')),
      movements: from(this._indexedDB.getAll<MovementResponse>('movements')),
      inventories: from(this._indexedDB.getAll<InventoryResponse>('inventories')),
    });
  }

  private updateUI(data: MovementViewData): void {
    this.products.set(this.toSelectOptions(data.products, 'Select a product'));
    this.warehouses.set(this.toSelectOptions(data.warehouses, 'Select a warehouse'));
    this.movements.set(data.movements);
  }

  private updateCache(data: MovementViewData): Observable<any> {
    const operations = [
      this._indexedDB.clearAndBulkPut('products', data.products),
      this._indexedDB.clearAndBulkPut('warehouses', data.warehouses),
      this._indexedDB.clearAndBulkPut('inventories', data.inventories),
      this._indexedDB.clearAndBulkPut('movements', data.movements),
    ];
    return from(Promise.all(operations)).pipe(
      tap(() => console.log('View cache updated.')),
      catchError((err) => {
        console.error('Failed to update cache:', err);
        return of(null);
      })
    );
  }

  private toSelectOptions(
    items: { id: string; name: string }[],
    placeholder: string
  ): VtSelectOption[] {
    return [
      { label: placeholder, value: null, disabled: true },
      ...items.map((item) => ({ label: item.name, value: item.id })),
    ];
  }

  private finishCreation(): void {
    this.modalOpen.set(false);
    this.inventoryForm.reset();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}

type MovementViewData = {
  products: ProductResponse[];
  warehouses: WarehouseResponse[];
  movements: MovementResponse[];
  inventories: InventoryResponse[];
};