import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, STORES } from 'src/app/config/indexeddb.config';

@Injectable({
  providedIn: 'root',
})
export class IndexedDB {
  private _dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this._dbPromise = this.connectToDb();
  }

  private connectToDb(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const storeConfig of STORES) {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, storeConfig.options);

            // Iterate over the indexes defined in the configuration
            storeConfig.indexes?.forEach((index) => {
              // Create each index in the newly created 'store'
              store.createIndex(index.name, index.keyPath, index.options);
            });
          }
        }
      },
    });
  }

  async add<T>(storeName: string, value: T) {
    const db = await this._dbPromise;
    return db.add(storeName, value);
  }

  async update<T>(storeName: string, value: T) {
    const db = await this._dbPromise;
    return db.put(storeName, value);
  }

  async getFromIndex<T>(storeName: string, indexName: string, query: IDBValidKey) {
    const db = await this._dbPromise;
    return db.getFromIndex(storeName, indexName, query) as T;
  }

  async getAllFromIndex<T>(storeName: string, indexName: string, query: IDBValidKey): Promise<T[]> {
    const db = await this._dbPromise;
    return db.getAllFromIndex(storeName, indexName, query) as Promise<T[]>;
  }

  async getByKey<T>(storeName: string, key: string) {
    const db = await this._dbPromise;
    return db.get(storeName, key) as T;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this._dbPromise;
    return (await db.getAll(storeName)) as T[];
  }

  async delete(storeName: string, key: string) {
    const db = await this._dbPromise;
    return db.delete(storeName, key);
  }

  async clear(storeName: string): Promise<void> {
    const db = await this._dbPromise;
    const tx = db.transaction(storeName, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  async clearAndBulkPut<T>(storeName: string, values: T[]): Promise<void> {
    const db = await this._dbPromise;
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all([tx.store.clear(), ...values.map((value) => tx.store.put(value))]);
    await tx.done;
  }
}