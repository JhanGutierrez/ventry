import { inject, Injectable, signal } from '@angular/core';
import { InventoryClient } from '@pages/admin/inventory/services/inventory-client';
import { MovementsClient } from '@pages/admin/movements/services/movements-client';
import { ProductClient } from '@pages/admin/product/services/product-client';
import { WarehouseClient } from '@pages/admin/warehouse/services/warehouse-client';
import { IndexedDB } from './indexed-db';
import { OnlineStatus } from './online-status';
import { firstValueFrom } from 'rxjs';

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
    this.listenToConnectionChanges();
  }

  private listenToConnectionChanges(): void {
    this._onlineStatus.online$.subscribe((isOnline) => {
      if (isOnline) {
        console.log('Connection restored. Starting sync...');
        this.startSync();
      }
    });
  }

  public async startSync(): Promise<void> {
    if (this.isSyncing()) {
      console.log('Sync is already in progress.');
      return;
    }

    this.isSyncing.set(true);

    try {
      const pendingActions = await this._indexedDB.getAll<any>('pending_actions');
      if (pendingActions.length === 0) {
        console.log('No pending actions to sync.');
        return;
      }

      console.log(`Starting sync of ${pendingActions.length} pending actions.`);

      for (const action of pendingActions) await this.processAction(action);

      console.log('Sync process completed successfully!');
      alert('¡Sincronización completada! Tus datos están actualizados.');
      window.location.reload();
    } catch (error) {
      console.error('Sync process failed and was stopped. Will retry later.', error);
      alert('Algunos datos no se pudieron sincronizar. Se reintentará más tarde.');
    } finally {
      this.isSyncing.set(false);
    }
  }

  private async processAction(action: any): Promise<void> {
    console.log(`Processing action: ${action.entity} - ${action.action}`);

    switch (action.entity) {
      case 'warehouse':
        await this.handleWarehouseAction(action);
        break;
      case 'product':
        await this.handleProductAction(action);
        break;
      case 'movement':
        await this.handleMovementAction(action);
        break;
      default:
        console.error(`Unknown entity type: ${action.entity}`);
        break;
    }

    await this._indexedDB.delete('pending_actions', action.id);
    console.log(`Action ${action.id} processed and removed from queue.`);
  }

  private async handleWarehouseAction(action: any): Promise<void> {
    if (action.action === 'CREATE') {
      await firstValueFrom(this._warehouseClient.createWarehouse(action.payload.warehouse));
    }
  }

  private async handleProductAction(action: any): Promise<void> {
    if (action.action === 'CREATE') {
      await firstValueFrom(this._productClient.createProduct(action.payload.product));
    }
  }

  private async handleMovementAction(action: any): Promise<void> {
    switch (action.action) {
      case 'CREATE_INVENTORY_AND_MOVEMENT':
        const newInventory = await firstValueFrom(
          this._inventoryClient.createInventory(action.payload.inventory)
        );

        await firstValueFrom(
          this._movementsClient.createMovement({
            ...action.payload.movement,
            inventory_id: newInventory.id,
          })
        );
        break;

      case 'CREATE_MOVEMENT':
        await firstValueFrom(this._movementsClient.createMovement(action.payload.movement));
        break;

      default:
        console.error(`Unknown movement action: ${action.action}`);
        break;
    }
  }
}
