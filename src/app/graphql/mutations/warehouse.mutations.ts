import { gql } from 'apollo-angular';
import { WAREHOUSE_FIELDS } from '@graphql/fragments/warehouse.fragments';

const INSERT_WAREHOUSE_ONE = gql`
  mutation InsertWarehouse($object: warehouses_insert_input!) {
    insert_warehouses_one(object: $object) {
      ...WarehouseFields
    }
  }
  ${WAREHOUSE_FIELDS}
`;

export { INSERT_WAREHOUSE_ONE };