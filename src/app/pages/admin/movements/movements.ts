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
import { catchError, EMPTY, forkJoin, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { ProductClient } from '../product/services/product-client';
import { WarehouseClient } from '../warehouse/services/warehouse-client';
import { DatePipe } from '@angular/common';
import { MovementsClient } from './services/movements-client';
import { MovementResponse } from '@core/models/movement-response';
import { InventoryClient } from '../inventory/services/inventory-client';
import { IndexedDB } from '@core/services/indexed-db';
import { v4 as uuidv4 } from 'uuid';

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
  // private _onlineStatus = inject(OnlineStatus);
  private _indexedDB = inject(IndexedDB);
  private _movementsClient = inject(MovementsClient);
  private _productClient = inject(ProductClient);
  private _warehouseClient = inject(WarehouseClient);
  private _inventoryClient = inject(InventoryClient);
  private _datePipe = inject(DatePipe);
  private _fb = inject(FormBuilder);

  public readonly addIcon = signal<LucideIconData>(Plus);
  public movements = signal<MovementResponse[]>([]);
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
    this.inventoryForm = this._fb.group({
      quantity: [null, Validators.required],
      warehouse_id: [null, Validators.required],
      product_id: [null, Validators.required],

      type: [null, Validators.required],
      reason: [null, Validators.required],
    });
    this.getInventories();
  }

  private getInventories() {
    this.isLoadingList.set(true);

    forkJoin({
      products: this._productClient.loadProducts(),
      warehouses: this._warehouseClient.loadWarehouses(),
      movements: this._movementsClient.loadMovements(),
      inventories: this._inventoryClient.loadInventories(),
    })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: async ({ products, warehouses, movements, inventories }) => {
          console.log(movements);

          this.products.set([
            { label: 'Seleccione un producto', value: null, disabled: true },
            ...products.map((product) => ({ label: product.name, value: product.id })),
          ]);
          this.warehouses.set([
            { label: 'Seleccione un almacén', value: null, disabled: true },
            ...warehouses.map((warehouse) => ({ label: warehouse.name, value: warehouse.id })),
          ]);
          this.movements.set(movements);

          try {
            await this._indexedDB.clearAndBulkPut('products', products);
            await this._indexedDB.clearAndBulkPut('warehouses', warehouses);
            await this._indexedDB.clearAndBulkPut('inventories', inventories);
            await this._indexedDB.clearAndBulkPut('movements', movements);
            console.log('Movements view cache updated.');
          } catch (error) {
            console.error('Failed to update local cache:', error);
          }

          this.isLoadingList.set(false);
        },
        error: async (err) => {
          console.log(err);
          console.warn('Could not load from network, trying cache.', err);

          //TODO: ACCORDING TO THE ERROR

          try {
            // 1. Cargamos todo lo necesario para los selectores desde la caché
            const cachedProducts = await this._indexedDB.getAll<any>('products');
            const cachedWarehouses = await this._indexedDB.getAll<any>('warehouses');
            const cachedMovements = await this._indexedDB.getAll<MovementResponse>('movements');

            this.products.set([
              { label: 'Seleccione un producto', value: null, disabled: true },
              ...cachedProducts.map((product) => ({ label: product.name, value: product.id })),
            ]);

            this.warehouses.set([
              { label: 'Seleccione un almacén', value: null, disabled: true },
              ...cachedWarehouses.map((warehouse) => ({
                label: warehouse.name,
                value: warehouse.id,
              })),
            ]);

            this.movements.set(cachedMovements);
            console.log('Loaded form dropdowns from cache.');
          } catch (cacheError) {
            console.error('Failed to load from cache:', cacheError);
          }

          this.isLoadingList.set(false);
        },
      });
  }

  public onSubmit() {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);

    this.saveOnline();
    /*  if (this._onlineStatus.isOnline()) {
    } else {
      this.saveOffline();
    } */
  }

  private saveOnline() {
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
        takeUntil(this._destroy$),
        switchMap((inventories) => {
          if (inventories.length === 0) return this.createInventoryOnline();

          const currentInventory = inventories[0];
          const currentQuantity = currentInventory.quantity;
          const change = +formValue.quantity;
          const newQuantity =
            formValue.type === 'INBOUND' ? currentQuantity + change : currentQuantity - change;

          if (newQuantity < 0) {
            //TODO: ALERT
            alert('Stock insuficiente para realizar la salida.');
            this.isCreating.set(false);
            return EMPTY;
          }

          return this.updateInventoryOnline(currentInventory.id, newQuantity);
        }),
        catchError((error) => {
          console.warn('Online save failed, falling back to offline mode.', error);
          this.saveOffline();
          return EMPTY;
        })
      )
      .subscribe({
        next: (movement) => {
          this.movements.update((current) => [movement, ...current]);
          this.isCreating.set(false);
          this.modalOpen.set(false);
        },
        error: (err) => {
          console.error('Error checking inventory existence:', err);
          //TODO:ALERT
          this.isCreating.set(false);
        },
      });
  }

  private updateInventoryOnline(
    inventoryId: string,
    quantity: number
  ): Observable<MovementResponse> {
    return this._inventoryClient.updateInventory({ id: inventoryId }, { quantity }).pipe(
      switchMap(() =>
        this._movementsClient.createMovement({
          inventory_id: inventoryId,
          quantity: +this.inventoryForm.value.quantity,
          reason: this.inventoryForm.value.reason,
          type: this.inventoryForm.value.type,
          // user_id: null, //TODO: From JWT
        })
      )
    );
  }

  private createInventoryOnline(): Observable<MovementResponse> {
    const formValue = this.inventoryForm.value;

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
            // user_id: null , //TODO: From JWT
          })
        )
      );
  }

  // -----------------------------------------------------------------------------------
  // MÉTODO PARA GUARDAR OFFLINE
  // -----------------------------------------------------------------------------------

  private async saveOffline() {
    try {
      const formValue = this.inventoryForm.value;

      const cachedInventory = await this._indexedDB.getFromIndex<any>(
        'inventories', // La tabla de caché, no la de pendientes
        'product_warehouse',
        [formValue.product_id, formValue.warehouse_id]
      );

      if (cachedInventory) {
        const change = +formValue.quantity;
        const newQuantity =
          formValue.type === 'INBOUND'
            ? cachedInventory.quantity + change
            : cachedInventory.quantity - change;

        if (newQuantity < 0) {
          alert('Stock insuficiente (según los últimos datos offline).');
          this.isCreating.set(false);
          return;
        }

        const updatedInventory = { ...cachedInventory, quantity: newQuantity };
        await this._indexedDB.update('inventories', updatedInventory);

        const pendingAction = {
          id: uuidv4(), // ID único para esta acción
          entity: 'movement',
          action: 'CREATE_MOVEMENT',
          payload: {
            movement: {
              id: uuidv4(), // El ID del propio movimiento
              inventory_id: cachedInventory.id,
              quantity: +formValue.quantity,
              type: formValue.type,
              reason: formValue.reason,
              // user_id: 'user-id-from-jwt', // TODO
            },
          },
        };

        await this._indexedDB.add('pending_actions', pendingAction);
      } else {
        if (formValue.type === 'OUTBOUND') {
          alert(
            'No se puede registrar una salida para un producto sin inventario registrado offline.'
          );
          this.isCreating.set(false);
          return;
        }

        const newInventoryId = uuidv4();

        const newLocalInventory = {
          id: newInventoryId,
          product_id: formValue.product_id,
          warehouse_id: formValue.warehouse_id,
          quantity: +formValue.quantity,
        };

        await this._indexedDB.add('inventories', newLocalInventory);

        const pendingAction = {
          id: uuidv4(), // ID único para esta acción
          entity: 'movement',
          action: 'CREATE_INVENTORY_AND_MOVEMENT',
          payload: {
            inventory: newLocalInventory,
            movement: {
              id: uuidv4(), // El ID del propio movimiento
              inventory_id: newInventoryId,
              quantity: +formValue.quantity,
              type: formValue.type,
              reason: formValue.reason,
              // user_id: 'user-id-from-jwt', // TODO
            },
          },
        };

        await this._indexedDB.add('pending_actions', pendingAction);
      }

      const optimisticMovement = {
        id: uuidv4(),
        quantity: +formValue.quantity,
        type: formValue.type,
        reason: formValue.reason,
        created_at: new Date().toISOString(),
        user: { username: 'Tú (Pendiente)' },
      };

      // Actualizamos la UI inmediatamente
      await this._indexedDB.add('movements', optimisticMovement);
      this.movements.update((current) => [optimisticMovement as MovementResponse, ...current]);

      alert('Movimiento guardado offline. Se sincronizará al reconectar.');
      this.isCreating.set(false);
      this.modalOpen.set(false);
      this.inventoryForm.reset();
    } catch (error) {
      console.error('Error al guardar offline:', error);
      alert('Hubo un problema al guardar el movimiento localmente.');
      this.isCreating.set(false);
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
