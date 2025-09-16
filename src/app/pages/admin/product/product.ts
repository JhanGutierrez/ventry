import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DataTable, DataTableHeaders } from '@shared/components/data-table/data-table';
import { VtButton } from '@shared/components/ui/vt-button/vt-button';
import { LucideIconData, Plus, LucideAngularModule } from 'lucide-angular';
import { VtModal } from '@shared/components/ui/vt-modal/vt-modal';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VtError } from '@shared/components/ui/vt-error/vt-error';
import { VtTextInput } from '@shared/components/ui/vt-text-input/vt-text-input';
import { VtSpinner } from '@shared/components/ui/vt-spinner/vt-spinner';
import { ProductClient } from './services/product-client';
import {
  EMPTY,
  of,
  from,
  Subject,
  takeUntil,
  tap,
  catchError,
  finalize,
  Observable,
  map,
} from 'rxjs';
import { ProductResponse } from '@core/models/product-response';
import { IndexedDB } from '@core/services/indexed-db';
import { DatePipe } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import { AppPermission } from '@core/directives/app-permission';
import { OnlineStatus } from '@core/services/online-status';

@Component({
  selector: 'app-product',
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
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class Product implements OnDestroy, OnInit {
  public readonly addIcon = signal<LucideIconData>(Plus);
  private _onlineStatus = inject(OnlineStatus);
  private _productClient = inject(ProductClient);
  private _fb = inject(FormBuilder);
  private _indexedDB = inject(IndexedDB);
  private _datePipe = inject(DatePipe);

  public products = signal<ProductResponse[]>([]);
  public isLoadingList = signal<boolean>(false);
  public isCreating = signal<boolean>(false);
  public modalOpen = signal(false);

  public productForm: FormGroup = new FormGroup({});
  private _destroy$ = new Subject<void>();

  public headers = signal<DataTableHeaders<ProductResponse>[]>([
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      cellValue: (row) => this._datePipe.transform(row.created_at, 'short'),
    },
  ]);

  ngOnInit(): void {
    this.productForm = this._fb.group({
      sku: [null, Validators.required],
      name: [null, Validators.required],
      description: [null, Validators.required],
    });
    this.getProducts();
  }

  public getProducts(): void {
    this.isLoadingList.set(true);
    this.fetchDataAndCache()
      .pipe(
        finalize(() => this.isLoadingList.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (products) => this.products.set(products),
        error: (err) => {
          console.error('Error irrecuperable al cargar productos:', err);
          this.products.set([]); // Limpia la lista en caso de un error fatal
        },
      });
  }

  private fetchDataAndCache(): Observable<ProductResponse[]> {
    if (this._onlineStatus.isOnline()) {
      return this._productClient.loadProducts().pipe(
        tap((productsFromServer) => {
          this._indexedDB
            .clearAndBulkPut('products', productsFromServer)
            .then(() => console.log('Cache de productos actualizada.'))
            .catch((err) => console.error('Fallo al cachear productos:', err));
        }),
        catchError((error) => {
          console.warn('API falló estando online. Usando caché como fallback.', error);
          return from(this._indexedDB.getAll<ProductResponse>('products'));
        })
      );
    } else {
      console.log('Offline. Obteniendo productos directamente de la caché.');
      return from(this._indexedDB.getAll<ProductResponse>('products'));
    }
  }

  public createProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);

    const creation$ = this._onlineStatus.isOnline()
      ? this.createProductOnline()
      : this.createProductOffline();

    creation$
      .pipe(
        finalize(() => this.isCreating.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (newProduct) => {
          this.products.update((current) => [newProduct, ...current]);
          this.finishCreation();
        },
        error: (err) => {
          console.error('La creación falló críticamente (ni online ni offline):', err);
          alert('No se pudo guardar el producto. Inténtalo de nuevo.');
        },
      });
  }

  private createProductOnline(): Observable<ProductResponse> {
    return this._productClient.createProduct(this.productForm.value).pipe(
      tap((serverProduct) => {
        this._indexedDB.add('products', { ...serverProduct, sync_status: 'SYNCED' });
      }),
      catchError((error) => {
        console.warn('Creación online falló. Intentando guardado offline como fallback.', error);
        alert('Conexión perdida. El producto se guardará y sincronizará más tarde.');
        return this.createProductOffline();
      })
    );
  }

  private createProductOffline(): Observable<ProductResponse> {
    const optimisticProduct: ProductResponse = {
      ...this.productForm.value,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      sync_status: 'PENDING_CREATION',
    };

    const offlineSave$ = from(this._indexedDB.add('products', optimisticProduct));
    return offlineSave$.pipe(map(() => optimisticProduct));
  }

  // Resets modal and form after creation
  private finishCreation(): void {
    this.modalOpen.set(false);
    this.productForm.reset();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
