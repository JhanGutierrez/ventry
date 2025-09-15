import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DataTable, DataTableHeaders } from '@shared/components/data-table/data-table';
import { LucideIconData, Plus, LucideAngularModule } from 'lucide-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VtSpinner } from '@shared/components/ui/vt-spinner/vt-spinner';
import { InventoryClient } from './services/inventory-client';
import { Subject, takeUntil, tap, catchError, of, finalize, from } from 'rxjs';
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

  /**
   * Loads inventories from API or cache
   */
  private getInventories(): void {
    this.isLoadingList.set(true);
    this._inventoryClient
      .loadInventories()
      .pipe(
        // On success, update cache
        tap((inventoriesFromServer) => this.updateCache(inventoriesFromServer)),
        // On error, try to load from cache
        catchError((err) => {
          console.warn('Could not load inventories from network, trying cache.', err);
          return this.loadFromCache();
        }),
        finalize(() => this.isLoadingList.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (inventories) => this.inventories.set(inventories),
        error: (err) => console.error('An unexpected error occurred:', err),
      });
  }

  /**
   * Updates local cache with new data
   * @param data New inventory data to cache
   */
  private updateCache(data: InventoryResponse[]): void {
    from(this._indexedDB.clearAndBulkPut('inventories', data))
      .pipe(catchError(() => of(console.error('Failed to update inventory cache.'))))
      .subscribe(() => console.log('Inventory cache updated.'));
  }

  /**
   * Loads inventories from local cache
   * @returns An observable of cached inventory data
   */
  private loadFromCache() {
    return from(this._indexedDB.getAll<InventoryResponse>('inventories')).pipe(
      catchError((cacheError) => {
        console.error('Failed to load inventories from cache:', cacheError);
        // Return empty array to keep flow working
        return of([]);
      })
    );
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}