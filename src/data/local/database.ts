/**
 * SQLite Database Schema & Initialization
 * Complete offline-first schema matching Supabase
 */

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('spiritual_gems.db');

  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    -- ===========================================
    -- CONTACTS TABLE
    -- ===========================================
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      whatsapp TEXT,
      city TEXT,
      source TEXT,
      spiritual_level TEXT NOT NULL DEFAULT 'new',
      assigned_to TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      last_contacted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      local_only INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
    CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
    CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_contacts_spiritual_level ON contacts(spiritual_level);
    CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON contacts(last_contacted_at);
    CREATE INDEX IF NOT EXISTS idx_contacts_local_only ON contacts(local_only);

    -- FTS table for full-text search
    CREATE VIRTUAL TABLE IF NOT EXISTS contacts_fts USING fts5(
      name, phone, email, city, notes,
      content='contacts',
      content_rowid='rowid'
    );

    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS contacts_fts_insert AFTER INSERT ON contacts BEGIN
      INSERT INTO contacts_fts(rowid, name, phone, email, city, notes)
      VALUES (new.rowid, new.name, new.phone, new.email, new.city, new.notes);
    END;

    CREATE TRIGGER IF NOT EXISTS contacts_fts_update AFTER UPDATE ON contacts BEGIN
      UPDATE contacts_fts SET
        name = new.name,
        phone = new.phone,
        email = new.email,
        city = new.city,
        notes = new.notes
      WHERE rowid = new.rowid;
    END;

    CREATE TRIGGER IF NOT EXISTS contacts_fts_delete AFTER DELETE ON contacts BEGIN
      DELETE FROM contacts_fts WHERE rowid = old.rowid;
    END;

    -- ===========================================
    -- ENABLERS TABLE
    -- ===========================================
    CREATE TABLE IF NOT EXISTS enablers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'enabler',
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_enablers_email ON enablers(email);

    -- ===========================================
    -- CALL_LOGS TABLE
    -- ===========================================
    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      enabler_id TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      called_at TEXT NOT NULL,
      outcome TEXT NOT NULL,
      notes TEXT,
      sentiment TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY(enabler_id) REFERENCES enablers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_call_logs_contact_id ON call_logs(contact_id);
    CREATE INDEX IF NOT EXISTS idx_call_logs_enabler_id ON call_logs(enabler_id);
    CREATE INDEX IF NOT EXISTS idx_call_logs_called_at ON call_logs(called_at);
    CREATE INDEX IF NOT EXISTS idx_call_logs_synced ON call_logs(synced);

    -- ===========================================
    -- TASKS TABLE
    -- ===========================================
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      contact_id TEXT,
      assigned_to TEXT NOT NULL,
      due_date TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      type TEXT NOT NULL DEFAULT 'other',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
      FOREIGN KEY(assigned_to) REFERENCES enablers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_synced ON tasks(synced);

    -- ===========================================
    -- SYNC QUEUE TABLE
    -- ===========================================
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
      table_name TEXT NOT NULL CHECK(table_name IN ('contacts', 'enablers', 'call_logs', 'tasks')),
      record_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      retry_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_table_record ON sync_queue(table_name, record_id);

    -- ===========================================
    -- SYNC METADATA TABLE
    -- ===========================================
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  console.log('[DB] Database schema initialized successfully.');
}

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDatabase();
  }
  return db;
}

// Helper to generate UUID v4
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to get current ISO timestamp
export function nowISO(): string {
  return new Date().toISOString();
}

// Helper to get current unix timestamp
export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}