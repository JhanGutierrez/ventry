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
import { EMPTY, of, from, Subject, takeUntil, tap, catchError, finalize, Observable, map } from 'rxjs';
import { ProductResponse } from '@core/models/product-response';
import { IndexedDB } from '@core/services/indexed-db';
import { DatePipe } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import { AppPermission } from '@core/directives/app-permission';

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

  /**
   * Loads products from API or cache
   */
  public getProducts(): void {
    this.isLoadingList.set(true);
    this._productClient
      .loadProducts()
      .pipe(
        // On success, update cache
        tap((productsFromServer) => this.updateCache(productsFromServer)),
        // On error, try to load from cache
        catchError((err) => {
          console.warn('Could not load products from network, trying cache.', err);
          return this.loadFromCache();
        }),
        finalize(() => this.isLoadingList.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (products) => this.products.set(products),
        error: (err) => console.error('Failed to load products from network or cache:', err),
      });
  }

  /**
   * Creates a product, tries offline if online fails
   * @returns void
   */
  public createProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);

    this._productClient
      .createProduct(this.productForm.value)
      .pipe(
        // If online creation fails, try offline
        catchError((error) => {
          console.error('Online creation failed, attempting offline save.', error);
          alert('No connection. Product will be saved and created when reconnected.');
          return this.createProductOffline();
        }),
        // Always stop spinner at the end
        finalize(() => this.isCreating.set(false)),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: (newProduct) => {
          // Both online and offline emit the new product
          this.products.update((current) => [...current, newProduct]);
          this.finishCreation();
        },
        error: (err) => {
          // This error is only emitted if OFFLINE creation fails
          console.error('Failed to save product offline:', err);
          alert('Could not save product locally.');
        },
      });
  }

  /**
   * Updates local cache with new data
   * @param data New product data to cache
   */
  private updateCache(data: ProductResponse[]): void {
    from(this._indexedDB.clearAndBulkPut('products', data))
      .pipe(catchError(() => of(console.error('Failed to update product cache.'))))
      .subscribe(() => console.log('Product cache updated.'));
  }

  /**
   * Loads products from local cache
   * @returns An observable of cached product data
   */
  private loadFromCache(): Observable<ProductResponse[]> {
    return from(this._indexedDB.getAll<ProductResponse>('products')).pipe(
      catchError((cacheError) => {
        console.error('Failed to load products from cache:', cacheError);
        // Return empty array to keep flow working
        return of([]);
      })
    );
  }

  /**
   * Saves product offline if online fails
   * @returns Observable emitting the optimistically created product
   */
  private createProductOffline(): Observable<ProductResponse> {
    const productData = this.productForm.value;
    const newProductId = uuidv4();

    const optimisticProduct: ProductResponse = {
      ...productData,
      id: newProductId,
      created_at: new Date().toISOString(),
    };

    const pendingAction = {
      id: uuidv4(),
      entity: 'product',
      action: 'CREATE',
      payload: { product: optimisticProduct },
    };

    // Convert IndexedDB promises to observable
    const offlineSave$ = from(
      Promise.all([
        this._indexedDB.add('pending_actions', pendingAction),
        this._indexedDB.add('products', optimisticProduct),
      ])
    );
    return offlineSave$.pipe(
      // If all goes well, emit the optimistic product
      map(() => optimisticProduct)
    );
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