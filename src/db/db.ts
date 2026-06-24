import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('spiritual_gems.db');

  // Create tables for local caching
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      photoUrl TEXT,
      age INTEGER,
      currentFolkStage TEXT DEFAULT 'Fresh Lead',
      location TEXT,
      stayingWith TEXT,
      occupation TEXT,
      organisation TEXT,
      rentDetails REAL DEFAULT 0.0,
      nativePlace TEXT,
      sgRating INTEGER DEFAULT 0,
      chantingStatus INTEGER DEFAULT 0,
      fromOtherCamp INTEGER DEFAULT 0, -- boolean 0/1
      relationshipStatus TEXT DEFAULT 'Single',
      verifiedByFg TEXT DEFAULT 'No',
      enablerId TEXT,
      folkGuideId TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      is_dirty INTEGER DEFAULT 0, -- 1 = modified locally
      is_deleted INTEGER DEFAULT 0 -- 1 = deleted locally
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      contactId TEXT NOT NULL,
      callerName TEXT,
      calledAt TEXT NOT NULL,
      status TEXT NOT NULL,
      remark TEXT,
      event TEXT,
      duration INTEGER DEFAULT 0,
      isExternal INTEGER DEFAULT 0,
      is_dirty INTEGER DEFAULT 0,
      FOREIGN KEY(contactId) REFERENCES people(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      contactId TEXT NOT NULL,
      groupId TEXT,
      groupName TEXT,
      eventId TEXT,
      eventName TEXT,
      attendedAt TEXT NOT NULL,
      is_dirty INTEGER DEFAULT 0,
      FOREIGN KEY(contactId) REFERENCES people(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  console.log('[DB] Database tables initialized successfully.');
}

export async function getDB() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

// Contacts Local Helpers
export async function getLocalContacts() {
  const database = await getDB();
  return await database.getAllAsync<any>(
    'SELECT * FROM people WHERE is_deleted = 0 ORDER BY fullName ASC'
  );
}

export async function saveLocalContact(contact: any, isDirty: boolean = false) {
  const database = await getDB();
  const dirtyFlag = isDirty ? 1 : 0;
  
  await database.runAsync(
    `INSERT OR REPLACE INTO people (
      id, fullName, phone, photoUrl, age, currentFolkStage, location, stayingWith, 
      occupation, organisation, rentDetails, nativePlace, sgRating, chantingStatus, 
      fromOtherCamp, relationshipStatus, verifiedByFg, enablerId, folkGuideId, 
      createdAt, updatedAt, is_dirty, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      contact.id,
      contact.fullName,
      contact.phone,
      contact.photoUrl || null,
      contact.age || null,
      contact.currentFolkStage || 'Fresh Lead',
      contact.location || null,
      contact.stayingWith || null,
      contact.occupation || null,
      contact.organisation || null,
      contact.rentDetails || 0.0,
      contact.nativePlace || null,
      contact.sgRating || 0,
      contact.chantingStatus || 0,
      contact.fromOtherCamp ? 1 : 0,
      contact.relationshipStatus || 'Single',
      contact.verifiedByFg || 'No',
      contact.enablerId || null,
      contact.folkGuideId || null,
      contact.createdAt || new Date().toISOString(),
      contact.updatedAt || new Date().toISOString(),
      dirtyFlag
    ]
  );
}

// Call Logs Local Helpers
export async function addLocalCallLog(log: any, isDirty: boolean = true) {
  const database = await getDB();
  const dirtyFlag = isDirty ? 1 : 0;
  await database.runAsync(
    `INSERT OR REPLACE INTO call_logs (
      id, contactId, callerName, calledAt, status, remark, event, duration, isExternal, is_dirty
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.contactId,
      log.callerName || 'System',
      log.calledAt,
      log.status,
      log.remark || '',
      log.event || null,
      log.duration || 0,
      log.isExternal ? 1 : 0,
      dirtyFlag
    ]
  );
}

// Sync Metadata Helpers
export async function getLastSyncedAt(): Promise<string | null> {
  const database = await getDB();
  const result = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = 'last_synced_at'"
  );
  return result ? result.value : null;
}

export async function setLastSyncedAt(timestamp: string) {
  const database = await getDB();
  await database.runAsync(
    "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('last_synced_at', ?)",
    [timestamp]
  );
}
