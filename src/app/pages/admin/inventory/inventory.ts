import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DataTable, DataTableHeaders } from '@shared/components/data-table/data-table';
import { LucideIconData, Plus, LucideAngularModule } from 'lucide-angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VtSpinner } from '@shared/components/ui/vt-spinner/vt-spinner';
import { InventoryClient } from './services/inventory-client';
import { Subject, takeUntil, tap, catchError, finalize, from, Observable } from 'rxjs';
import { InventoryResponse } from '@core/models/inventory-response';
import { DatePipe } from '@angular/common';
import { IndexedDB } from '@core/services/indexed-db';
import { OnlineStatus } from '@core/services/online-status';

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
  private _onlineStatus = inject(OnlineStatus);

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
    this.loadInventories();
  }

  public loadInventories(): void {
    this.isLoadingList.set(true);
    this.fetchDataAndCache()
      .pipe(
        finalize(() => this.isLoadingList.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (inventories) => this.inventories.set(inventories),
        error: (err) => {
          console.error('Error irrecuperable al cargar inventarios:', err);
          this.inventories.set([]);
        },
      });
  }

  private fetchDataAndCache(): Observable<InventoryResponse[]> {
    if (this._onlineStatus.isOnline()) {
      return this._inventoryClient.loadInventories().pipe(
        tap((inventoriesFromServer) => {
          this._indexedDB
            .clearAndBulkPut('inventories', inventoriesFromServer)
            .then(() => console.log('Cache de inventarios actualizada.'))
            .catch((err) => console.error('Fallo al cachear inventarios:', err));
        }),
        catchError((error) => {
          console.warn('API falló estando online. Usando caché como fallback.', error);
          return from(this._indexedDB.getAll<InventoryResponse>('inventories'));
        })
      );
    } else {
      console.log('Offline. Obteniendo inventarios directamente de la caché.');
      return from(this._indexedDB.getAll<InventoryResponse>('inventories'));
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
