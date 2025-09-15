import { INVENTORY_FIELDS } from '@graphql/fragments/inventory.fragments';
import { gql } from 'apollo-angular';

const GET_INVENTORIES = gql`
  query GetInventories($limit: Int, $offset: Int, $where: inventory_bool_exp) {
    inventory(limit: $limit, offset: $offset, where: $where) {
      ...InventoryFields
    }
  }
  ${INVENTORY_FIELDS}
`;

const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($pk_columns: inventory_pk_columns_input!, $set: inventory_set_input!) {
    update_inventory_by_pk(pk_columns: $pk_columns, _set: $set) {
      ...InventoryFields
    }
  }
  ${INVENTORY_FIELDS}
`;

export { GET_INVENTORIES, UPDATE_INVENTORY };
