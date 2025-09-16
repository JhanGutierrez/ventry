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
import { from, Subject, takeUntil, tap, catchError, finalize, Observable, map } from 'rxjs';
import { WarehouseResponse } from '@core/models/warehouse-response';
import { IndexedDB } from '@core/services/indexed-db';
import { DatePipe } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import { AppPermission } from '@core/directives/app-permission';
import { OnlineStatus } from '@core/services/online-status';

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
  private _onlineStatus = inject(OnlineStatus);

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
    this.loadWarehouses();
  }

  public loadWarehouses(): void {
    this.isLoadingList.set(true);
    this.fetchDataAndCache()
      .pipe(
        finalize(() => this.isLoadingList.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (warehouses) => this.warehouses.set(warehouses),
        error: (err) => {
          console.error('Error irrecuperable al cargar almacenes:', err);
          this.warehouses.set([]);
        },
      });
  }

  private fetchDataAndCache(): Observable<WarehouseResponse[]> {
    if (this._onlineStatus.isOnline()) {
      return this._warehouseClient.loadWarehouses().pipe(
        tap((warehousesFromServer) => {
          this._indexedDB
            .clearAndBulkPut('warehouses', warehousesFromServer)
            .then(() => console.log('Cache de almacenes actualizada.'))
            .catch((err) => console.error('Fallo al cachear almacenes:', err));
        }),
        catchError((error) => {
          console.warn('API falló estando online. Usando caché como fallback.', error);
          return from(this._indexedDB.getAll<WarehouseResponse>('warehouses'));
        })
      );
    } else {
      console.log('Offline. Obteniendo almacenes directamente de la caché.');
      return from(this._indexedDB.getAll<WarehouseResponse>('warehouses'));
    }
  }

  public createWarehouse(): void {
    if (this.warehouseForm.invalid) {
      this.warehouseForm.markAllAsTouched();
      return;
    }
    this.isCreating.set(true);

    const creation$ = this._onlineStatus.isOnline()
      ? this.createWarehouseOnline()
      : this.createWarehouseOffline();

    creation$
      .pipe(
        finalize(() => this.isCreating.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (newWarehouse) => {
          this.warehouses.update((current) => [newWarehouse, ...current]);
          this.finishCreation();
        },
        error: (err) => {
          console.error('La creación del almacén falló críticamente:', err);
          alert('No se pudo guardar el almacén. Inténtalo de nuevo.');
        },
      });
  }

  private createWarehouseOnline(): Observable<WarehouseResponse> {
    return this._warehouseClient.createWarehouse(this.warehouseForm.value).pipe(
      tap((serverWarehouse) => {
        this._indexedDB.add('warehouses', { ...serverWarehouse, sync_status: 'SYNCED' });
      }),
      catchError((error) => {
        console.warn('Creación online falló. Intentando guardado offline como fallback.', error);
        alert('Conexión perdida. El almacén se guardará y sincronizará más tarde.');
        return this.createWarehouseOffline();
      })
    );
  }

  private createWarehouseOffline(): Observable<WarehouseResponse> {
    const optimisticWarehouse: WarehouseResponse = {
      ...this.warehouseForm.value,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      sync_status: 'PENDING_CREATION',
    };

    const offlineSave$ = from(this._indexedDB.add('warehouses', optimisticWarehouse));
    return offlineSave$.pipe(map(() => optimisticWarehouse));
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
