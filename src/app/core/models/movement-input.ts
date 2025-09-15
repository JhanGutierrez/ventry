export interface MovementInput {
  inventory_id: string;
  quantity: number;
  reason: string;
  type: 'INBOUND' | 'OUTBOUND';
  user_id?: string | null;
}
