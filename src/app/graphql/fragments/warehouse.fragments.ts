import { gql } from "apollo-angular";

const WAREHOUSE_FIELDS = gql`
  fragment WarehouseFields on warehouses {
    name
    id
    created_at
    location
    updated_at
  }
`;

export { WAREHOUSE_FIELDS };