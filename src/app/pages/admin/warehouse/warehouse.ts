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
import { catchError, EMPTY, Subject, takeUntil } from 'rxjs';
import { WarehouseResponse } from '@core/models/warehouse-response';
import { IndexedDB } from '@core/services/indexed-db';
import { DatePipe } from '@angular/common';
import { InventoryResponse } from '@core/models/inventory-response';
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
    AppPermission
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

  public headers = signal<DataTableHeaders<InventoryResponse>[]>([
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

  private getWarehouses() {
    this.isLoadingList.set(true);

    this._warehouseClient
      .loadWarehouses()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: async (warehousesFromServer) => {
          this.isLoadingList.set(false);
          this.warehouses.set(warehousesFromServer);

          await this._indexedDB.clearAndBulkPut('warehouses', warehousesFromServer);
          console.log('Warehouse cache updated.');
        },
        error: async (err) => {
          console.warn('Could not load warehouses from network, trying cache.', err);
          const cachedWarehouses = await this._indexedDB.getAll<WarehouseResponse>('warehouses');
          this.warehouses.set(cachedWarehouses);
          this.isLoadingList.set(false);
        },
      });
  }

  public createWarehouse() {
    if (this.warehouseForm.invalid) {
      this.warehouseForm.markAllAsTouched();
      return;
    }
    this.isCreating.set(true);

    this.createWarehouseOnline();
  }

  private createWarehouseOnline() {
    this._warehouseClient
      .createWarehouse(this.warehouseForm.value)
      .pipe(
        takeUntil(this._destroy$),
        catchError((error) => {
          console.error('Error creating warehouse online:', error);
          this.createWarehouseOffline();
          return EMPTY;
        })
      )
      .subscribe({
        next: (response) => {
          this.warehouses.update((current) => [...current, response]);
          this.finishCreation();
        },
        error: (err) => {
          // Si la API falla a pesar de estar online, podríamos guardar offline como fallback
          console.error('Error creating warehouse online:', err);
          this.isCreating.set(false);
        },
      });
  }

  private async createWarehouseOffline() {
    const warehouseData = this.warehouseForm.value;
    const newWarehouseId = uuidv4();

    const pendingAction = {
      id: uuidv4(), // ID único para la acción en sí
      entity: 'warehouse',
      action: 'CREATE',
      payload: {
        warehouse: {
          ...warehouseData,
          id: newWarehouseId, // El ID del objeto que se va a crear
        },
      },
    };

    const optimisticWarehouse = {
      ...warehouseData,
      id: newWarehouseId,
      created_at: new Date().toISOString(),
    };

    try {
      // Guardamos la acción pendiente en su tabla
      await this._indexedDB.add('pending_actions', pendingAction);
      await this._indexedDB.add('warehouses', optimisticWarehouse);

      this.warehouses.update((current) => [...current, optimisticWarehouse]);

      alert('Sin conexión. La bodega se guardó y se creará al reconectar.');
      this.finishCreation();
    } catch (error) {
      console.error('Error saving warehouse offline:', error);
      alert('No se pudo guardar la bodega localmente.');
      this.isCreating.set(false);
    }
  }
  private finishCreation(): void {
    this.isCreating.set(false);
    this.modalOpen.set(false);
    this.warehouseForm.reset();
  }
  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
