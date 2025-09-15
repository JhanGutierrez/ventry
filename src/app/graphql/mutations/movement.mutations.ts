import { MOVEMENT_FIELDS } from '@graphql/fragments/movement.fragments';
import { gql } from 'apollo-angular';

const INSERT_MOVEMENT_ONE = gql`
  mutation InsertMovement($object: movements_insert_input!) {
    insert_movements_one(object: $object) {
      ...MovementFields
    }
  }
  ${MOVEMENT_FIELDS}
`;

export { INSERT_MOVEMENT_ONE };
