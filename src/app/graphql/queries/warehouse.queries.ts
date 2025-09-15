import { WAREHOUSE_FIELDS } from '@graphql/fragments/warehouse.fragments';
import { gql } from 'apollo-angular';

const GET_WAREHOUSES = gql`
  query GetWarehouses($limit: Int, $offset: Int, $where: warehouses_bool_exp) {
    warehouses(limit: $limit, offset: $offset, where: $where) {
      ...WarehouseFields
    }
  }
  ${WAREHOUSE_FIELDS}
`;

export { GET_WAREHOUSES };