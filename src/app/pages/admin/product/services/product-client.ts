import { inject, Injectable } from '@angular/core';
import { ProductInput } from '@core/models/product-input';
import { ProductResponse } from '@core/models/product-response';
import { INSERT_PRODUCT_ONE } from '@graphql/mutations/product.mutations';
import { GET_PRODUCTS } from '@graphql/queries/product.queries';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductClient {
  private _apollo = inject(Apollo);

  public loadProducts(): Observable<ProductResponse[]> {
    return this._apollo
      .query<{ products: ProductResponse[] }>({
        query: GET_PRODUCTS,
      })
      .pipe(map(({ data }) => data.products));
  }

  public createProduct(data: ProductInput): Observable<ProductResponse> {
    return this._apollo
      .mutate<{ insert_products_one: ProductResponse }>({
        mutation: INSERT_PRODUCT_ONE,
        variables: { object: data },
      })
      .pipe(map(({ data }) => data!.insert_products_one));
  }
}
