import { inject, Injectable, signal } from '@angular/core';
import { InventoryClient } from '@pages/admin/inventory/services/inventory-client';
import { MovementsClient } from '@pages/admin/movements/services/movements-client';
import { ProductClient } from '@pages/admin/product/services/product-client';
import { WarehouseClient } from '@pages/admin/warehouse/services/warehouse-client';
import { IndexedDB } from './indexed-db';
import { OnlineStatus } from './online-status';
import { concat, concatMap, finalize, from, map, of, switchMap, toArray } from 'rxjs';
import { InventoryResponse } from '@core/models/inventory-response';
import { MovementResponse } from '@core/models/movement-response';
import { ProductResponse } from '@core/models/product-response';
import { WarehouseResponse } from '@core/models/warehouse-response';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class SyncData {
  private _onlineStatus = inject(OnlineStatus);
  private _indexedDB = inject(IndexedDB);
  private _warehouseClient = inject(WarehouseClient);
  private _productClient = inject(ProductClient);
  private _inventoryClient = inject(InventoryClient);
  private _movementsClient = inject(MovementsClient);

  private isSyncing = signal<boolean>(false);
  constructor() {
    this._onlineStatus.status$.subscribe((isOnline) => {
      if (isOnline) this.startSync();
    });
  }

  public startSync(): void {
    // Initial check to prevent multiple executions
    if (this.isSyncing()) {
      Swal.close();
      console.log('La sincronización ya está en progreso.');
      return;
    }

    this.isSyncing.set(true);

    Swal.fire({
      title: 'Sincronizando Datos',
      text: 'Por favor, espere mientras se sincronizan los datos...',
      showConfirmButton: true,
      didOpen: () => Swal.showLoading(),
    });

    of(null)
      .pipe(
        concatMap(() => this.insertNewProducts()),
        concatMap(() => this.insertNewWarehouses()),
        concatMap(() => this.updateInventories()),
        concatMap(() => this.insertNewInventories()),
        concatMap(() => this.insertNewMovements()),
        finalize(() => this.isSyncing.set(false))
      )
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Sincronización Completa',
            text: 'Todos los datos pendientes han sido sincronizados con el servidor.',
          });
          console.log('Sincronización completa');
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al sincronizar',
            text: 'Se produjo un problema al sincronizar los datos. Si estás sin conexión, puedes ignorar este mensaje. Si tienes conexión, por favor intenta nuevamente más tarde.',
          });
          console.error('La sincronización se detuvo debido a un error en uno de los pasos:', err);
        },
      });
  }

  private updateInventories() {
    return from(
      this._indexedDB.getAllFromIndex<Partial<InventoryResponse & { sync_status: string }>>(
        'inventories',
        'by_sync_status',
        'PENDING_UPDATE'
      )
    ).pipe(
      switchMap((pendingInventories) => {
        if (!pendingInventories || pendingInventories.length === 0) {
          console.log('No hay inventarios pendientes de actualización.');
          return of([]);
        }

        const updateObservables$ = pendingInventories.map((inventory) => {
          const { id, quantity } = inventory;
          return this._inventoryClient.updateInventory({ id: id! }, { quantity }).pipe(
            switchMap(() => {
              const syncedInventory = { ...inventory, sync_status: 'SYNCED' };
              return from(this._indexedDB.update('inventories', syncedInventory));
            }),
            map(() => inventory.id)
          );
        });

        return concat(...updateObservables$).pipe(toArray());
      })
    );
  }

  private insertNewInventories() {
    return from(
      this._indexedDB.getAllFromIndex<InventoryResponse & { sync_status: string }>(
        'inventories',
        'by_sync_status',
        'PENDING_CREATION'
      )
    ).pipe(
      switchMap((pendingInventories) => {
        if (!pendingInventories || pendingInventories.length === 0) {
          console.log('No hay inventarios pendientes de creación.');
          return of([]);
        }

        const updateObservables$ = pendingInventories.map((inventory) => {
          const { sync_status, product, warehouse, ...payload } = inventory;

          return this._inventoryClient.createInventory(payload).pipe(
            switchMap((serverResponse) => {
              const syncedInventory = {
                ...inventory,
                ...serverResponse,
                sync_status: 'SYNCED',
              };

              return from(this._indexedDB.update('inventories', syncedInventory));
            }),
            map(() => inventory.id)
          );
        });

        return concat(...updateObservables$).pipe(toArray());
      })
    );
  }

  private insertNewMovements() {
    return from(
      this._indexedDB.getAllFromIndex<MovementResponse & { sync_status: string }>(
        'movements',
        'by_sync_status',
        'PENDING_CREATION'
      )
    ).pipe(
      switchMap((pendingMovements) => {
        if (!pendingMovements || pendingMovements.length === 0) {
          console.log('No hay movimientos pendientes de creación.');
          return of([]);
        }

        const updateObservables$ = pendingMovements.map((movement) => {
          const { user, sync_status, ...payload } = movement;
          return this._movementsClient.createMovement(payload).pipe(
            switchMap((serverResponse) => {
              const syncedMovement = {
                ...movement,
                ...serverResponse,
                sync_status: 'SYNCED',
              };

              return from(this._indexedDB.update('movements', syncedMovement));
            }),
            map(() => movement.id)
          );
        });

        return concat(...updateObservables$).pipe(toArray());
      })
    );
  }

  private insertNewProducts() {
    return from(
      this._indexedDB.getAllFromIndex<ProductResponse & { sync_status: string }>(
        'products',
        'by_sync_status',
        'PENDING_CREATION'
      )
    ).pipe(
      switchMap((pendingProducts) => {
        if (!pendingProducts || pendingProducts.length === 0) {
          console.log('No hay productos pendientes de creación.');
          return of([]);
        }

        const updateObservables$ = pendingProducts.map((product) => {
          const { sync_status, ...payload } = product;
          return this._productClient.createProduct(payload).pipe(
            switchMap((serverResponse) => {
              const syncedProduct = {
                ...product,
                ...serverResponse,
                sync_status: 'SYNCED',
              };

              return from(this._indexedDB.update('products', syncedProduct));
            }),
            map(() => product.id)
          );
        });

        return concat(...updateObservables$).pipe(toArray());
      })
    );
  }

  private insertNewWarehouses() {
    return from(
      this._indexedDB.getAllFromIndex<WarehouseResponse & { sync_status: string }>(
        'warehouses',
        'by_sync_status',
        'PENDING_CREATION'
      )
    ).pipe(
      switchMap((pendingWarehouses) => {
        if (!pendingWarehouses || pendingWarehouses.length === 0) {
          console.log('No hay almacenes pendientes de creación.');
          return of([]);
        }

        const updateObservables$ = pendingWarehouses.map((warehouse) => {
          const { sync_status, ...payload } = warehouse;
          return this._warehouseClient.createWarehouse(payload).pipe(
            switchMap((serverResponse) => {
              const syncedWarehouse = {
                ...warehouse,
                ...serverResponse,
                sync_status: 'SYNCED',
              };

              return from(this._indexedDB.update('warehouses', syncedWarehouse));
            }),
            map(() => warehouse.id)
          );
        });

        return concat(...updateObservables$).pipe(toArray());
      })
    );
  }
}