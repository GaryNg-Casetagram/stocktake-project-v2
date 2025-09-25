import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('stocktake.db');

export const useOfflineStore = create((set, get) => ({
  // State
  isOnline: true,
  pendingSync: [],
  dbInitialized: false,

  // Database initialization
  initializeOffline: async () => {
    try {
      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          // Create tables for offline storage
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS items (
              id TEXT PRIMARY KEY,
              sku TEXT UNIQUE NOT NULL,
              short_id TEXT,
              name TEXT NOT NULL,
              description TEXT,
              has_rfid INTEGER DEFAULT 0,
              category TEXT,
              unit_price REAL,
              store_id TEXT,
              warehouse_id TEXT,
              is_active INTEGER DEFAULT 1,
              last_synced DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS counts (
              id TEXT PRIMARY KEY,
              session_id TEXT NOT NULL,
              item_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              device_id TEXT NOT NULL,
              round_number INTEGER NOT NULL,
              count_value INTEGER NOT NULL,
              scan_method TEXT,
              remarks TEXT,
              photo_url TEXT,
              is_confirmed INTEGER DEFAULT 0,
              counted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              synced INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS sessions (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              type TEXT NOT NULL,
              status TEXT NOT NULL,
              store_id TEXT,
              warehouse_id TEXT,
              created_by TEXT,
              started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              paused_at DATETIME,
              completed_at DATETIME,
              metadata TEXT,
              synced INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS sync_queue (
              id TEXT PRIMARY KEY,
              table_name TEXT NOT NULL,
              record_id TEXT NOT NULL,
              action TEXT NOT NULL,
              data TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              retry_count INTEGER DEFAULT 0,
              last_error TEXT
            );
          `);

          resolve();
        }, reject);
      });

      set({ dbInitialized: true });
      console.log('Offline database initialized');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  },

  // Network status
  setOnlineStatus: (isOnline) => {
    set({ isOnline });
    if (isOnline) {
      get().syncPendingData();
    }
  },

  // Offline item operations
  saveItemOffline: async (item) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO items 
           (id, sku, short_id, name, description, has_rfid, category, unit_price, store_id, warehouse_id, is_active, last_synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.sku,
            item.short_id,
            item.name,
            item.description,
            item.has_rfid ? 1 : 0,
            item.category,
            item.unit_price,
            item.store_id,
            item.warehouse_id,
            item.is_active ? 1 : 0,
            new Date().toISOString()
          ],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  },

  getItemBySku: async (sku) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM items WHERE sku = ?',
          [sku],
          (_, { rows }) => {
            resolve(rows.length > 0 ? rows.item(0) : null);
          },
          (_, error) => reject(error)
        );
      });
    });
  },

  // Offline count operations
  saveCountOffline: async (count) => {
    const countId = count.id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO counts 
           (id, session_id, item_id, user_id, device_id, round_number, count_value, scan_method, remarks, photo_url, is_confirmed, counted_at, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            countId,
            count.session_id,
            count.item_id,
            count.user_id,
            count.device_id,
            count.round_number,
            count.count_value,
            count.scan_method,
            count.remarks,
            count.photo_url,
            count.is_confirmed ? 1 : 0,
            count.counted_at || new Date().toISOString(),
            0 // Not synced yet
          ],
          () => {
            // Add to sync queue if offline
            if (!get().isOnline) {
              get().addToSyncQueue('counts', countId, 'create', count);
            }
            resolve(countId);
          },
          (_, error) => reject(error)
        );
      });
    });
  },

  // Sync queue management
  addToSyncQueue: async (tableName, recordId, action, data) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO sync_queue (id, table_name, record_id, action, data) VALUES (?, ?, ?, ?, ?)',
          [
            `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tableName,
            recordId,
            action,
            JSON.stringify(data)
          ],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  },

  // Sync operations
  syncPendingData: async () => {
    if (!get().isOnline) return;
    console.log('Syncing pending data...');
  },

  // Cleanup
  clearOfflineData: async () => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql('DELETE FROM items', [], () => {});
        tx.executeSql('DELETE FROM counts', [], () => {});
        tx.executeSql('DELETE FROM sessions', [], () => {});
        tx.executeSql('DELETE FROM sync_queue', [], () => {
          resolve();
        });
      }, reject);
    });
  },
}));