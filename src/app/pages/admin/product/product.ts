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
import { EMPTY, catchError, Subject, takeUntil } from 'rxjs';
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
    AppPermission
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

  public productForm: FormGroup = new FormGroup({});
  public modalOpen = signal(false);
  private _destroy$ = new Subject<void>();

  public headers = signal<DataTableHeaders<ProductResponse>[]>([
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      cellValue: (row) => this._datePipe.transform(row.created_at, 'short')
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

public getProducts() {
    this.isLoadingList.set(true);
    this._productClient.loadProducts()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: async (productsFromServer) => {
          this.products.set(productsFromServer);
          this.isLoadingList.set(false);
          // Actualizamos la caché local con los datos frescos
          await this._indexedDB.clearAndBulkPut('products', productsFromServer);
          console.log('Product cache updated.');
        },
        error: async (err) => {
          console.warn('Could not load products from network, trying cache.', err);
          // Si la red falla, cargamos desde la caché
          const cachedProducts = await this._indexedDB.getAll<ProductResponse>('products');
          this.products.set(cachedProducts);
          this.isLoadingList.set(false);
        },
      });
  }

  public createProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.isCreating.set(true);
    this.createProductOnline();
  }

    private createProductOnline() {
    this._productClient.createProduct(this.productForm.value)
      .pipe(
        takeUntil(this._destroy$),
        catchError((error) => {
          console.error('Error during online save process:', error);
          this.createProductOffline();
          return EMPTY;
        })
      )
      .subscribe({
        next: (response) => {
          this.products.update((current) => [...current, response]);
          this.finishCreation();
        },
        error: (err) => {
          console.error('Error creating product online:', err);
          this.isCreating.set(false);
        },
      });
  }


    private async createProductOffline() {
    const productData = this.productForm.value;
    const newProductId = uuidv4();

    // 1. Creamos el objeto de acción pendiente con la nueva estructura
    const pendingAction = {
      id: uuidv4(), // ID único para la acción en sí
      entity: 'product',
      action: 'CREATE',
      payload: {
        product: {
          ...productData,
          id: newProductId, // El ID del objeto que se va a crear
        }
      }
    };

    const optimisticProduct = {
      ...productData,
      id: newProductId,
      created_at: new Date().toISOString(),
    };

    try {
      await this._indexedDB.add('pending_actions', pendingAction);
      await this._indexedDB.add('products', optimisticProduct);

      this.products.update((current) => [...current, optimisticProduct]);

      alert('Sin conexión. El producto se guardó y se creará al reconectar.');
      this.finishCreation();
    } catch (error) {
      console.error('Error saving product offline:', error);
      alert('No se pudo guardar el producto localmente.');
      this.isCreating.set(false);
    }
  }

    private finishCreation(): void {
      this.isCreating.set(false);
      this.modalOpen.set(false);
      this.productForm.reset();
    }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
