import { inject, Injectable } from '@angular/core';
import { WarehouseInput } from '@core/models/warehouse-input';
import { WarehouseResponse } from '@core/models/warehouse-response';
import { INSERT_WAREHOUSE_ONE } from '@graphql/mutations/warehouse.mutations';
import { GET_WAREHOUSES } from '@graphql/queries/warehouse.queries';
import { Apollo } from 'apollo-angular';
import { map, Observable, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WarehouseClient {
  private _apollo = inject(Apollo);

  public loadWarehouses(filters: Record<string, any> = {}): Observable<WarehouseResponse[]> {
    return this._apollo
      .query<{ warehouses: WarehouseResponse[] }>({
        query: GET_WAREHOUSES,
        variables: { where: filters },
      })
      .pipe(map(({ data }) => data.warehouses));
  }

  public createWarehouse(data: WarehouseInput): Observable<WarehouseResponse> {
    return this._apollo
      .mutate<{ insert_warehouses_one: WarehouseResponse }>({
        mutation: INSERT_WAREHOUSE_ONE,
        variables: { object: data },
      })
      .pipe(map(({ data }) => data!.insert_warehouses_one));
  }
}