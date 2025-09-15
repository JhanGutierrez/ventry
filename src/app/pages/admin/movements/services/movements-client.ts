import { inject, Injectable } from '@angular/core';
import { InventoryInput } from '@core/models/inventory-input';
import { InventoryResponse } from '@core/models/inventory-response';
import { MovementInput } from '@core/models/movement-input';
import { MovementResponse } from '@core/models/movement-response';
import { INSERT_INVENTORY_ONE } from '@graphql/mutations/inventory.mutations';
import { INSERT_MOVEMENT_ONE } from '@graphql/mutations/movement.mutations';
import { GET_INVENTORIES } from '@graphql/queries/inventory.queries';
import { GET_MOVEMENTS } from '@graphql/queries/movement.queries';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MovementsClient {
  private _apollo = inject(Apollo);

  public loadMovements(): Observable<MovementResponse[]> {
    return this._apollo
      .query<{ movements: MovementResponse[] }>({
        query: GET_MOVEMENTS,
      })
      .pipe(map(({ data }) => data.movements));
  }

  public createMovement(data: MovementInput): Observable<MovementResponse> {
    return this._apollo
      .mutate<{ insert_movements_one: MovementResponse }>({
        mutation: INSERT_MOVEMENT_ONE,
        variables: { object: data },
      })
      .pipe(map(({ data }) => data!.insert_movements_one));
  }
}
