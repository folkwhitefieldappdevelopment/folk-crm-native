/**
 * SQLite Entity Definitions
 * These match the Supabase schema exactly for seamless sync
 */

export interface ContactEntity {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  city?: string;
  source?: string;
  spiritual_level: string;
  assigned_to?: string;
  tags: string; // JSON string array
  notes?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
  is_deleted: number; // 0 or 1
  local_only: number; // 0 or 1
}

export interface EnablerEntity {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  created_at: string;
}

export interface CallLogEntity {
  id: string;
  contact_id: string;
  enabler_id: string;
  duration_seconds: number;
  called_at: string;
  outcome: string;
  notes?: string;
  sentiment?: string;
  created_at: string;
  synced: number; // 0 or 1
}

export interface TaskEntity {
  id: string;
  title: string;
  description?: string;
  contact_id?: string;
  assigned_to: string;
  due_date?: string;
  priority: string;
  status: string;
  type: string;
  created_at: string;
  updated_at: string;
  synced: number; // 0 or 1
}

export interface SyncQueueEntity {
  id?: number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: 'contacts' | 'enablers' | 'call_logs' | 'tasks';
  record_id: string;
  payload: string;
  created_at: number;
  retry_count: number;
}

export interface SyncMetadataEntity {
  key: string;
  value: string;
}