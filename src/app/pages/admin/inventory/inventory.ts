import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DataTable, DataTableHeaders } from '@shared/components/data-table/data-table';
import { LucideIconData, Plus, LucideAngularModule } from 'lucide-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VtSpinner } from '@shared/components/ui/vt-spinner/vt-spinner';
import { InventoryClient } from './services/inventory-client';
import { Subject, takeUntil } from 'rxjs';
import { InventoryResponse } from '@core/models/inventory-response';
import { DatePipe } from '@angular/common';
import { IndexedDB } from '@core/services/indexed-db';

@Component({
  selector: 'app-inventory',
  imports: [LucideAngularModule, DataTable, ReactiveFormsModule, VtSpinner],
  providers: [DatePipe],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnDestroy, OnInit {
  public readonly addIcon = signal<LucideIconData>(Plus);
  private _inventoryClient = inject(InventoryClient);
  private _datePipe = inject(DatePipe);
  private _indexedDB = inject(IndexedDB);

  private _fb = inject(FormBuilder);

  public inventories = signal<InventoryResponse[]>([]);
  public isLoadingList = signal<boolean>(false);

  public inventoryForm: FormGroup = new FormGroup({});
  private _destroy$ = new Subject<void>();

  public headers = signal<DataTableHeaders<InventoryResponse>[]>([
    { key: 'quantity', label: 'Cantidad' },
    { key: 'warehouse.name', label: 'Almacén' },
    { key: 'product.name', label: 'Producto' },
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
    });
    this.getInventories();
  }

  private getInventories() {
    this.isLoadingList.set(true);

    this._inventoryClient
      .loadInventories()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: async (inventoriesFromServer) => {
          this.inventories.set(inventoriesFromServer);
          this.isLoadingList.set(false);

          // Guardamos los datos frescos en nuestra caché local
          try {
            await this._indexedDB.clearAndBulkPut('inventories', inventoriesFromServer);
            console.log('Inventory cache updated.');
          } catch (error) {
            console.error('Failed to update inventory cache:', error);
          }
        },
        error: async (err) => {
          console.warn('Could not load inventories from network, trying cache.', err);

          // Si la red falla, intentamos cargar desde la caché de IndexedDB
          try {
            const cachedInventories = await this._indexedDB.getAll<InventoryResponse>(
              'inventories'
            );
            this.inventories.set(cachedInventories);
          } catch (cacheError) {
            console.error('Failed to load inventories from cache:', cacheError);
          }

          this.isLoadingList.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
