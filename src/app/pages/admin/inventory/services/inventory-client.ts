import { inject, Injectable } from '@angular/core';
import { InventoryInput } from '@core/models/inventory-input';
import { InventoryResponse } from '@core/models/inventory-response';
import { INSERT_INVENTORY_ONE } from '@graphql/mutations/inventory.mutations';
import { GET_INVENTORIES, UPDATE_INVENTORY } from '@graphql/queries/inventory.queries';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InventoryClient {
  private _apollo = inject(Apollo);

  public loadInventories(variables: Record<string, any> = {}): Observable<InventoryResponse[]> {
    return this._apollo
      .query<{ inventory: InventoryResponse[] }>({
        query: GET_INVENTORIES,
        variables,
      })
      .pipe(map(({ data }) => data.inventory));
  }

  public createInventory(data: InventoryInput): Observable<InventoryResponse> {
    return this._apollo
      .mutate<{ insert_inventory_one: InventoryResponse }>({
        mutation: INSERT_INVENTORY_ONE,
        variables: { object: data },
      })
      .pipe(map(({ data }) => data!.insert_inventory_one));
  }

  public updateInventory(
    pk_columns: { id: string },
    set: Partial<InventoryInput>
  ): Observable<InventoryResponse> {
    return this._apollo
      .mutate<{ update_inventory_by_pk: InventoryResponse }>({
        mutation: UPDATE_INVENTORY,
        variables: { pk_columns, set },
      })
      .pipe(map(({ data }) => data!.update_inventory_by_pk));
  }
}
