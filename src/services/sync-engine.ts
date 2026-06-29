import { getApiClient, getToken } from './api-client';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

const LAST_SYNC_KEY = 'last_sync_timestamp';

type SyncListener = (status: SyncStatus) => void;

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingUploads: number;
  lastError: string | null;
}

let listeners: SyncListener[] = [];
let syncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncedAt: null,
  pendingUploads: 0,
  lastError: null,
};

function notify() {
  listeners.forEach((fn) => fn({ ...syncStatus }));
}

export function onSyncStatusChange(fn: SyncListener) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

async function getLastSyncTimestamp(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

async function setLastSyncTimestamp(ts: string) {
  await SecureStore.setItemAsync(LAST_SYNC_KEY, ts);
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function enqueueOfflineOperation(
  method: 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: any
) {
  try {
    const db = await SQLite.openDatabaseAsync('sync_queue.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        body TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        retry_count INTEGER NOT NULL DEFAULT 0
      )
    `);

    await db.runAsync(
      `INSERT INTO offline_queue (method, url, body) VALUES (?, ?, ?)`,
      method,
      url,
      body ? JSON.stringify(body) : null
    );

    const pending = await db.getAllAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM offline_queue'
    );
    syncStatus.pendingUploads = pending[0]?.c || 0;
    notify();
  } catch (err) {
    console.error('[Sync] Failed to queue offline operation:', err);
  }
}

export async function flushOfflineQueue() {
  try {
    const db = await SQLite.openDatabaseAsync('sync_queue.db');
    const rows = await db.getAllAsync<{
      id: number;
      method: string;
      url: string;
      body: string | null;
    }>('SELECT * FROM offline_queue ORDER BY id ASC');

    if (rows.length === 0) return;

    const api = getApiClient();
    const batchOps: Array<{
      entityType: string;
      entityId: string;
      operation: string;
      data: Record<string, unknown>;
      clientTimestamp: string;
    }> = [];
    const singleOps: Array<{
      id: number;
      method: string;
      url: string;
      body: any;
    }> = [];

    for (const row of rows) {
      const url = row.url;
      const body = row.body ? JSON.parse(row.body) : null;

      if (url.startsWith('/people')) {
        const parts = url.split('/');
        const personId = parts[2];
        if (personId && row.method !== 'POST' && row.method !== 'DELETE') {
          batchOps.push({
            entityType: 'contact',
            entityId: personId,
            operation: row.method === 'POST' ? 'create' : row.method === 'PUT' ? 'update' : 'delete',
            data: body || {},
            clientTimestamp: new Date().toISOString(),
          });
          continue;
        }
      }

      singleOps.push({ id: row.id, method: row.method, url, body });
    }

    if (batchOps.length > 0) {
      try {
        await api.post('/sync/batch', { operations: batchOps });
      } catch (err) {
        console.error('[Sync] Batch sync failed:', err);
        syncStatus.lastError = 'Batch sync failed';
        notify();
        return;
      }
    }

    for (const op of singleOps) {
      try {
        await api({
          method: op.method as any,
          url: op.url,
          data: op.body,
        });
      } catch {
        // skip individual failures, will retry next cycle
      }
    }

    await db.runAsync('DELETE FROM offline_queue');
    syncStatus.pendingUploads = 0;
    syncStatus.lastError = null;
    notify();
  } catch (err) {
    console.error('[Sync] Failed to flush queue:', err);
  }
}

export async function pullLatestData() {
  try {
    const api = getApiClient();
    const lastSync = await getLastSyncTimestamp();

    const params: Record<string, any> = { take: 500 };

    const response = await api.get('/people', { params });
    const people = response.data || [];

    const db = await SQLite.openDatabaseAsync('sync_cache.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS people_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS groups_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS events_cache (
        id TEXT PRIMARY KEY,
        groupId TEXT NOT NULL,
        data TEXT NOT NULL,
        cached_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS notifications_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0
      );
    `);

    const now = new Date().toISOString();
    for (const person of people) {
      await db.runAsync(
        `INSERT OR REPLACE INTO people_cache (id, data, cached_at) VALUES (?, ?, ?)`,
        person.id,
        JSON.stringify(person),
        now
      );
    }

    try {
      const groupsRes = await api.get('/groups');
      const groups = groupsRes.data || [];
      for (const group of groups) {
        await db.runAsync(
          `INSERT OR REPLACE INTO groups_cache (id, data, cached_at) VALUES (?, ?, ?)`,
          group.id,
          JSON.stringify(group),
          now
        );
      }
    } catch {
      // groups pull is best-effort
    }

    try {
      const eventsRes = await api.get('/events');
      const events = eventsRes.data || [];
      for (const event of events) {
        await db.runAsync(
          `INSERT OR REPLACE INTO events_cache (id, groupId, data, cached_at) VALUES (?, ?, ?, ?)`,
          event.id,
          event.groupId,
          JSON.stringify(event),
          now
        );
      }
    } catch {
      // events pull is best-effort
    }

    await setLastSyncTimestamp(now);
    syncStatus.lastSyncedAt = now;
    notify();
  } catch (err) {
    console.error('[Sync] Failed to pull data:', err);
    syncStatus.lastError = 'Pull failed';
    notify();
  }
}

// Cache read helpers
export async function getCachedPeople(): Promise<any[]> {
  try {
    const db = await SQLite.openDatabaseAsync('sync_cache.db');
    const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM people_cache');
    return rows.map(r => JSON.parse(r.data));
  } catch { return []; }
}

export async function getCachedGroups(): Promise<any[]> {
  try {
    const db = await SQLite.openDatabaseAsync('sync_cache.db');
    const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM groups_cache');
    return rows.map(r => JSON.parse(r.data));
  } catch { return []; }
}

export async function getCachedEvents(groupId?: string): Promise<any[]> {
  try {
    const db = await SQLite.openDatabaseAsync('sync_cache.db');
    if (groupId) {
      const rows = await db.getAllAsync<{ data: string }>(
        'SELECT data FROM events_cache WHERE groupId = ?',
        groupId
      );
      return rows.map(r => JSON.parse(r.data));
    }
    const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM events_cache');
    return rows.map(r => JSON.parse(r.data));
  } catch { return []; }
}

export async function cacheNotifications(notifications: any[]) {
  try {
    const db = await SQLite.openDatabaseAsync('sync_cache.db');
    const now = new Date().toISOString();
    for (const n of notifications) {
      await db.runAsync(
        `INSERT OR REPLACE INTO notifications_cache (id, data, cached_at, is_read) VALUES (?, ?, ?, ?)`,
        n.id,
        JSON.stringify(n),
        now,
        n.isRead ? 1 : 0
      );
    }
  } catch {}
}

export async function getCachedNotifications(): Promise<any[]> {
  try {
    const db = await SQLite.openDatabaseAsync('sync_cache.db');
    const rows = await db.getAllAsync<{ data: string }>('SELECT data FROM notifications_cache ORDER BY cached_at DESC');
    return rows.map(r => JSON.parse(r.data));
  } catch { return []; }
}

export async function syncAll() {
  if (syncStatus.isSyncing) return;

  syncStatus.isSyncing = true;
  syncStatus.lastError = null;
  notify();

  try {
    await flushOfflineQueue();
    await pullLatestData();
  } catch (err) {
    console.error('[Sync] Sync cycle failed:', err);
    syncStatus.lastError = 'Sync cycle failed';
  } finally {
    syncStatus.isSyncing = false;
    notify();
  }
}

export async function initSyncEngine() {
  const lastSync = await getLastSyncTimestamp();
  syncStatus.lastSyncedAt = lastSync;

  try {
    const db = await SQLite.openDatabaseAsync('sync_queue.db');
    const rows = await db.getAllAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM offline_queue'
    );
    syncStatus.pendingUploads = rows[0]?.c || 0;
  } catch {
    syncStatus.pendingUploads = 0;
  }

  notify();
}
