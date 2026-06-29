import { getApiClient } from './api-client';

export interface GroupEvent {
  id: string;
  groupId: string;
  name: string;
  date: string;
  createdAt: string;
  linkInfo?: {
    categoryName: string;
    statementIndex: number;
  } | null;
  attendeeCount?: number;
}

export interface AttendanceResult {
  success: boolean;
  message: string;
}

export async function getGroupEvents(groupId: string): Promise<GroupEvent[]> {
  const api = getApiClient();
  const response = await api.get(`/events/group/${groupId}`);
  return response.data;
}

export async function createGroupEvent(
  groupId: string,
  data: { name: string; date: string; linkInfo?: any }
): Promise<GroupEvent> {
  const api = getApiClient();
  const response = await api.post(`/events/group/${groupId}`, data);
  return response.data;
}

export async function markAttendance(data: {
  personId: string;
  groupId: string;
  eventId?: string;
  date?: string;
}): Promise<AttendanceResult> {
  const api = getApiClient();
  const response = await api.post('/events/attendance', data);
  return response.data;
}

export async function removeAttendance(data: {
  personId: string;
  groupId: string;
  eventId: string;
}): Promise<{ success: boolean }> {
  const api = getApiClient();
  const response = await api.delete('/events/attendance', { data });
  return response.data;
}

export async function updatePersonProgress(
  personId: string,
  progress: any,
  attendanceHistory: any[]
): Promise<void> {
  const api = getApiClient();
  await api.put(`/people/${personId}`, { progress, attendanceHistory });
}

export async function getPerson(personId: string): Promise<any> {
  const api = getApiClient();
  const response = await api.get(`/people/${personId}`);
  return response.data;
}
