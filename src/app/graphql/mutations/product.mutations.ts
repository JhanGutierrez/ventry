import { PRODUCT_FIELDS } from '@graphql/fragments/product.fragments';
import { gql } from 'apollo-angular';

const INSERT_PRODUCT_ONE = gql`
  mutation InsertProduct($object: products_insert_input!) {
    insert_products_one(object: $object) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export { INSERT_PRODUCT_ONE };