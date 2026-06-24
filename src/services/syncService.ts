import axios from 'axios';
import { 
  getDB, 
  getLastSyncedAt, 
  setLastSyncedAt, 
  saveLocalContact 
} from '../db/db';

const BACKEND_URL = 'https://YOUR-RAILWAY-URL.up.railway.app'; // Replace with your Railway URL
// const BACKEND_URL = 'http://10.0.2.2:9002'; // For local Android emulator testing

export async function runBidirectionalSync(authToken: string) {
  console.log('[Sync] Starting bidirectional synchronization...');
  const db = await getDB();

  try {
    // ==========================================
    // 1. PUSH PHASE (Local Changes -> Server)
    // ==========================================
    
    // Find locally modified/created contacts
    const dirtyContacts = await db.getAllAsync<any>(
      'SELECT * FROM people WHERE is_dirty = 1 AND is_deleted = 0'
    );
    
    // Find locally deleted contacts
    const deletedContacts = await db.getAllAsync<any>(
      'SELECT id FROM people WHERE is_deleted = 1'
    );

    // Find locally created call logs
    const dirtyLogs = await db.getAllAsync<any>(
      'SELECT * FROM call_logs WHERE is_dirty = 1'
    );

    // Find locally created attendance entries
    const dirtyAttendance = await db.getAllAsync<any>(
      'SELECT * FROM attendance WHERE is_dirty = 1'
    );

    const hasLocalChanges = 
      dirtyContacts.length > 0 || 
      deletedContacts.length > 0 || 
      dirtyLogs.length > 0 || 
      dirtyAttendance.length > 0;

    if (hasLocalChanges) {
      console.log('[Sync] Found local changes. Pushing...');

      const payload = {
        changes: {
          people: {
            created: dirtyContacts.filter(c => !c.createdAt || c.createdAt === c.updatedAt),
            updated: dirtyContacts.filter(c => c.createdAt && c.createdAt !== c.updatedAt),
            deleted: deletedContacts.map(c => c.id)
          },
          callLogs: {
            created: dirtyLogs,
            updated: [],
            deleted: []
          },
          attendance: {
            created: dirtyAttendance,
            updated: [],
            deleted: []
          }
        }
      };

      const pushResponse = await axios.post(`${BACKEND_URL}/sync/push`, payload, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (pushResponse.data.success) {
        console.log('[Sync] Push succeeded. Clearing local dirty flags...');
        
        // Clear people flags
        if (dirtyContacts.length > 0) {
          const ids = dirtyContacts.map(c => `'${c.id}'`).join(',');
          await db.runAsync(`UPDATE people SET is_dirty = 0 WHERE id IN (${ids})`);
        }
        
        // Clean deleted people records
        if (deletedContacts.length > 0) {
          const ids = deletedContacts.map(c => `'${c.id}'`).join(',');
          await db.runAsync(`DELETE FROM people WHERE id IN (${ids})`);
        }

        // Clear call log flags
        if (dirtyLogs.length > 0) {
          const ids = dirtyLogs.map(l => `'${l.id}'`).join(',');
          await db.runAsync(`UPDATE call_logs SET is_dirty = 0 WHERE id IN (${ids})`);
        }

        // Clear attendance flags
        if (dirtyAttendance.length > 0) {
          const ids = dirtyAttendance.map(a => `'${a.id}'`).join(',');
          await db.runAsync(`UPDATE attendance SET is_dirty = 0 WHERE id IN (${ids})`);
        }
      } else {
        console.warn('[Sync] Push failed on server:', pushResponse.data.errors);
      }
    } else {
      console.log('[Sync] No local changes to push.');
    }

    // ==========================================
    // 2. PULL PHASE (Server Changes -> Local Cache)
    // ==========================================
    const since = await getLastSyncedAt();
    console.log(`[Sync] Pulling updates since: ${since || 'Beginning of time'}`);

    const pullResponse = await axios.get(
      `${BACKEND_URL}/sync/pull?since=${since || ''}`, 
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const { timestamp, changes } = pullResponse.data;

    // Apply pulled people updates
    if (changes.people && changes.people.updated) {
      for (const serverPerson of changes.people.updated) {
        // Resolve conflicts locally (if user has edited locally in the meantime)
        const localCheck = await db.getFirstAsync<any>(
          'SELECT is_dirty, updatedAt FROM people WHERE id = ?',
          [serverPerson.id]
        );

        if (localCheck && localCheck.is_dirty === 1) {
          const localUpdated = new Date(localCheck.updatedAt).getTime();
          const serverUpdated = new Date(serverPerson.updatedAt).getTime();
          
          if (serverUpdated > localUpdated) {
            // Server wins, overwrite local
            await saveLocalContact(serverPerson, false);
          } else {
            // Local wins, keep local (will sync on next run)
            console.log(`[Sync] Conflict detected for ${serverPerson.fullName}. Local changes kept.`);
          }
        } else {
          // No local edits, safe to overwrite/insert
          await saveLocalContact(serverPerson, false);
        }
      }
    }

    // Apply pulled deleted people
    if (changes.people && changes.people.deleted) {
      for (const id of changes.people.deleted) {
        await db.runAsync('DELETE FROM people WHERE id = ?', [id]);
        await db.runAsync('DELETE FROM call_logs WHERE contactId = ?', [id]);
        await db.runAsync('DELETE FROM attendance WHERE contactId = ?', [id]);
      }
    }

    // Apply pulled call logs
    if (changes.callLogs && changes.callLogs.updated) {
      for (const log of changes.callLogs.updated) {
        await db.runAsync(
          `INSERT OR REPLACE INTO call_logs (
            id, contactId, callerName, calledAt, status, remark, event, duration, isExternal, is_dirty
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            log.id,
            log.contactId,
            log.callerName,
            log.calledAt,
            log.status,
            log.remark || '',
            log.event || null,
            log.duration || 0,
            log.isExternal ? 1 : 0
          ]
        );
      }
    }

    // Apply pulled attendance records
    if (changes.attendance && changes.attendance.updated) {
      for (const ent of changes.attendance.updated) {
        await db.runAsync(
          `INSERT OR REPLACE INTO attendance (
            id, contactId, groupId, groupName, eventId, eventName, attendedAt, is_dirty
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            ent.id,
            ent.contactId,
            ent.groupId || null,
            ent.groupName || null,
            ent.eventId || null,
            ent.eventName || null,
            ent.attendedAt
          ]
        );
      }
    }

    // Update last synced metadata
    await setLastSyncedAt(timestamp);
    console.log(`[Sync] Sync pull completed successfully. New sync marker: ${timestamp}`);
  } catch (error) {
    console.error('[Sync] Error during synchronization cycle:', error.message);
  }
}
