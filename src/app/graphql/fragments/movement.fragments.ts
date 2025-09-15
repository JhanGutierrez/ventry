import { gql } from 'apollo-angular';

const MOVEMENT_FIELDS = gql`
  fragment MovementFields on movements {
    id
    inventory_id
    quantity
    reason
    type
    user_id
    created_at
    user {
      username
    }
  }
`;

export { MOVEMENT_FIELDS };
