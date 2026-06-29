/**
 * Domain Models - Pure TypeScript types for the CRM
 * These are used throughout the app (UI, repositories, sync)
 */

export type SpiritualLevel = 
  | 'new' 
  | 'interested' 
  | 'regular' 
  | 'committed' 
  | 'leader';

export type ContactSource = 
  | 'event' 
  | 'referral' 
  | 'walk-in' 
  | 'call' 
  | 'online';

export type EnablerRole = 'admin' | 'leader' | 'enabler';

export type CallOutcome = 
  | 'answered' 
  | 'no_answer' 
  | 'voicemail' 
  | 'busy' 
  | 'follow_up';

export type CallSentiment = 'positive' | 'neutral' | 'negative';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

export type TaskType = 'call' | 'visit' | 'follow_up' | 'event' | 'other';

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  city?: string;
  source?: ContactSource;
  spiritualLevel: SpiritualLevel;
  assignedTo?: string; // enabler ID
  tags: string[];
  notes?: string;
  lastContactedAt?: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  localOnly: boolean; // created offline, not yet synced
}

export interface Enabler {
  id: string;
  name: string;
  email: string;
  role: EnablerRole;
  phone?: string;
  createdAt: string;
}

export interface CallLog {
  id: string;
  contactId: string;
  enablerId: string;
  durationSeconds: number;
  calledAt: string;
  outcome: CallOutcome;
  notes?: string;
  sentiment?: CallSentiment;
  createdAt: string;
  synced: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  contactId?: string;
  assignedTo: string;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface SyncQueueItem {
  id?: number; // auto-increment in SQLite
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  tableName: 'contacts' | 'enablers' | 'call_logs' | 'tasks';
  recordId: string;
  payload: string; // JSON string
  createdAt: number; // unix timestamp
  retryCount: number;
}

// Sync status for UI
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt?: string;
  pendingUploads: number;
  pendingDownloads: number;
  lastError?: string;
}

// Filter types
export interface ContactFilter {
  search?: string;
  spiritualLevels?: SpiritualLevel[];
  sources?: ContactSource[];
  assignedTo?: string;
  tags?: string[];
  lastContacted?: 'today' | 'this_week' | 'this_month' | 'never' | 'overdue';
  hasPendingTask?: boolean;
  sortBy?: 'name' | 'created_at' | 'last_contacted' | 'most_calls';
  sortOrder?: 'asc' | 'desc';
}

export interface TaskFilter {
  statuses?: TaskStatus[];
  types?: TaskType[];
  priorities?: TaskPriority[];
  assignedTo?: string;
  contactId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  sortBy?: 'due_date' | 'priority' | 'created_at' | 'contact_name';
  sortOrder?: 'asc' | 'desc';
}

export interface CallLogFilter {
  contactId?: string;
  enablerId?: string;
  outcomes?: CallOutcome[];
  dateFrom?: string;
  dateTo?: string;
}

// Pagination
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
}

// Dashboard stats
export interface DashboardStats {
  totalContacts: number;
  contactsAddedThisWeek: number;
  callsMadeToday: number;
  pendingTasks: number;
  overdueFollowUps: number;
  spiritualLevelCounts: Record<SpiritualLevel, number>;
}