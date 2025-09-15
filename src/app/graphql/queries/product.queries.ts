import { PRODUCT_FIELDS } from "@graphql/fragments/product.fragments";
import { gql } from "apollo-angular";

const GET_PRODUCTS = gql`
  query GetProducts($limit: Int, $offset: Int, $where: products_bool_exp) {
    products(limit: $limit, offset: $offset, where: $where) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export { GET_PRODUCTS };