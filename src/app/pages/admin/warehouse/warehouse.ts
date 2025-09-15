import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DataTable, DataTableHeaders } from '@shared/components/data-table/data-table';
import { VtButton } from '@shared/components/ui/vt-button/vt-button';
import { LucideIconData, Plus, LucideAngularModule } from 'lucide-angular';
import { WarehouseClient } from './services/warehouse-client';
import { VtModal } from '@shared/components/ui/vt-modal/vt-modal';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VtError } from '@shared/components/ui/vt-error/vt-error';
import { VtTextInput } from '@shared/components/ui/vt-text-input/vt-text-input';
import { VtSpinner } from '@shared/components/ui/vt-spinner/vt-spinner';
import { of, from, Subject, takeUntil, tap, catchError, finalize, Observable, map } from 'rxjs';
import { WarehouseResponse } from '@core/models/warehouse-response';
import { IndexedDB } from '@core/services/indexed-db';
import { DatePipe } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import { AppPermission } from '@core/directives/app-permission';

@Component({
  selector: 'app-warehouse',
  imports: [
    VtButton,
    LucideAngularModule,
    DataTable,
    VtModal,
    ReactiveFormsModule,
    VtError,
    VtTextInput,
    VtSpinner,
    AppPermission,
  ],
  providers: [DatePipe],
  templateUrl: './warehouse.html',
  styleUrl: './warehouse.css',
})
export class Warehouse implements OnDestroy, OnInit {
  private _warehouseClient = inject(WarehouseClient);
  private _fb = inject(FormBuilder);
  private _indexedDB = inject(IndexedDB);
  private _datePipe = inject(DatePipe);

  public readonly addIcon = signal<LucideIconData>(Plus);
  public warehouses = signal<WarehouseResponse[]>([]);
  public isLoadingList = signal<boolean>(false);
  public isCreating = signal<boolean>(false);
  public warehouseForm: FormGroup = new FormGroup({});
  public modalOpen = signal(false);
  private _destroy$ = new Subject<void>();

  public headers = signal<DataTableHeaders<WarehouseResponse>[]>([
    { key: 'name', label: 'Nombre' },
    { key: 'location', label: 'Ubicación' },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      cellValue: (row) => this._datePipe.transform(row.created_at, 'short'),
    },
  ]);

  ngOnInit(): void {
    this.warehouseForm = this._fb.group({
      name: [null, Validators.required],
      location: [null, Validators.required],
    });
    this.getWarehouses();
  }

  /**
   * Loads warehouses from API or cache
   */
  private getWarehouses(): void {
    this.isLoadingList.set(true);
    this._warehouseClient
      .loadWarehouses()
      .pipe(
        // On success, update cache
        tap((warehousesFromServer) => this.updateCache(warehousesFromServer)),
        // On error, try to load from cache
        catchError((err) => {
          console.warn('Could not load warehouses from network, trying cache.', err);
          return this.loadFromCache();
        }),
        finalize(() => this.isLoadingList.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (warehouses) => this.warehouses.set(warehouses),
        error: (err) => console.error('Failed to load warehouses from network or cache:', err),
      });
  }

  /**
   * Creates a warehouse, tries offline if online fails
   * @returns void
   */
  public createWarehouse(): void {
    if (this.warehouseForm.invalid) {
      this.warehouseForm.markAllAsTouched();
      return;
    }
    this.isCreating.set(true);

    this._warehouseClient
      .createWarehouse(this.warehouseForm.value)
      .pipe(
        // If online creation fails, try offline
        catchError((error) => {
          console.error('Online creation failed, attempting offline save.', error);
          alert('No connection. Warehouse will be saved and created when reconnected.');
          return this.createWarehouseOffline();
        }),
        // Always stop spinner at the end
        finalize(() => this.isCreating.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (newWarehouse) => {
          // Both online and offline emit the new warehouse
          this.warehouses.update((current) => [...current, newWarehouse]);
          this.finishCreation();
        },
        error: (err) => {
          // This error is only emitted if OFFLINE creation fails
          console.error('Failed to save warehouse offline:', err);
          alert('Could not save warehouse locally.');
        },
      });
  }

  /**
   * Updates local cache with new data
   * @param data New warehouse data to cache
   */
  private updateCache(data: WarehouseResponse[]): void {
    from(this._indexedDB.clearAndBulkPut('warehouses', data))
      .pipe(catchError(() => of(console.error('Failed to update warehouse cache.'))))
      .subscribe(() => console.log('Warehouse cache updated.'));
  }

  /**
   * Loads warehouses from local cache
   * @returns An observable of cached warehouse data
   */
  private loadFromCache(): Observable<WarehouseResponse[]> {
    return from(this._indexedDB.getAll<WarehouseResponse>('warehouses')).pipe(
      catchError((cacheError) => {
        console.error('Failed to load warehouses from cache:', cacheError);
        // Return empty array to keep flow working
        return of([]);
      })
    );
  }

  /**
   * Saves warehouse offline if online fails
   * @returns An observable of the newly created warehouse
   */
  private createWarehouseOffline(): Observable<WarehouseResponse> {
    const warehouseData = this.warehouseForm.value;
    const newWarehouseId = uuidv4();

    const optimisticWarehouse: WarehouseResponse = {
      ...warehouseData,
      id: newWarehouseId,
      created_at: new Date().toISOString(),
    };

    const pendingAction = {
      id: uuidv4(),
      entity: 'warehouse',
      action: 'CREATE',
      payload: { warehouse: optimisticWarehouse },
    };

    // Convert IndexedDB promises to observable
    const offlineSave$ = from(
      Promise.all([
        this._indexedDB.add('pending_actions', pendingAction),
        this._indexedDB.add('warehouses', optimisticWarehouse),
      ])
    );

    return offlineSave$.pipe(
      // If all goes well, emit the optimistic warehouse
      map(() => optimisticWarehouse)
    );
  }

  // Resets modal and form after creation
  private finishCreation(): void {
    this.modalOpen.set(false);
    this.warehouseForm.reset();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}