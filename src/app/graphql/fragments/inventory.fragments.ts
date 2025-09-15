import { gql } from "apollo-angular";

const INVENTORY_FIELDS = gql`
  fragment InventoryFields on inventory {
    id
    quantity
    product_id
    warehouse_id
    updated_at
    created_at
    product {
      name
      sku
    }
    warehouse {
      name
    }
  }
`;

export { INVENTORY_FIELDS };