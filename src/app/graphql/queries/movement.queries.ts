import { MOVEMENT_FIELDS } from '@graphql/fragments/movement.fragments';
import { gql } from 'apollo-angular';

const GET_MOVEMENTS = gql`
  query GetMovements($limit: Int, $offset: Int, $where: movements_bool_exp) {
    movements(limit: $limit, offset: $offset, where: $where) {
      ...MovementFields
    }
  }
  ${MOVEMENT_FIELDS}
`;

export { GET_MOVEMENTS };