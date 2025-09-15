export interface IndexConfig {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

export interface StoreConfig {
  name: string;
  options?: IDBObjectStoreParameters;
  indexes?: IndexConfig[];
}

export const DB_NAME = 'offline-db';
export const DB_VERSION = 1;

export const STORES: StoreConfig[] = [
  { name: 'movements', options: { keyPath: 'id' } },
  { name: 'warehouses', options: { keyPath: 'id' } },
  { name: 'products', options: { keyPath: 'id' } },
  {
    name: 'inventories',
    options: { keyPath: 'id' },
    indexes: [
      {
        name: 'product_warehouse',
        keyPath: ['product_id', 'warehouse_id'],
      },
    ],
  },

  // Pending Actions (generic)
  {
    name: 'pending_actions',
    options: { keyPath: 'id' },
    indexes: [
      { name: 'by_entity', keyPath: 'entity' },
    ],
  },
];
