import { INVENTORY_FIELDS } from '@graphql/fragments/inventory.fragments';
import { gql } from 'apollo-angular';

const INSERT_INVENTORY_ONE = gql`
  mutation InsertInventory($object: inventory_insert_input!) {
    insert_inventory_one(object: $object) {
      ...InventoryFields
    }
  }
  ${INVENTORY_FIELDS}
`;

export { INSERT_INVENTORY_ONE };
