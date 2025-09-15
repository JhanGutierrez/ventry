import { UserResponse } from "./user-response";

export interface MovementResponse {
  id: string;
  inventory_id: string;
  quantity: number;
  reason: string;
  type: 'INBOUND' | 'OUTBOUND';
  user_id: string;
  created_at: string;
  user?: UserResponse | null;
}
