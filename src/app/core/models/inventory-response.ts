import { Warehouse } from "@pages/admin/warehouse/warehouse";
import { ProductResponse } from "./product-response";
import { WarehouseResponse } from "./warehouse-response";

export interface InventoryResponse {
  id: string;
  quantity: number;
  product_id: string;
  warehouse_id: string;
  updated_at: string;
  created_at: string;
  product: ProductResponse;
  warehouse: WarehouseResponse;
}
