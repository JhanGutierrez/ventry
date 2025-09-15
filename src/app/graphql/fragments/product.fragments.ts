import { gql } from "apollo-angular";

const PRODUCT_FIELDS = gql`
  fragment ProductFields on products {
    id
    sku
    name
    description
    created_at
    updated_at
  }
`;

export { PRODUCT_FIELDS };