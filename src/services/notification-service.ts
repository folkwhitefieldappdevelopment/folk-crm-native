import { getApiClient } from './api-client';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'info' | 'alarm' | 'success' | 'warning';
  senderId?: string;
  senderName?: string;
  personId?: string;
}

export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  const api = getApiClient();
  const response = await api.get(`/notifications/user/${userId}`);
  return response.data;
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  senderId?: string;
  senderName?: string;
  personId?: string;
}): Promise<AppNotification> {
  const api = getApiClient();
  const response = await api.post('/notifications', data);
  return response.data;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const api = getApiClient();
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
}

export async function clearNotifications(userId: string): Promise<void> {
  const api = getApiClient();
  await api.delete(`/notifications/user/${userId}`);
}

export async function broadcastNotification(data: {
  title: string;
  message: string;
  targetRoles?: string[];
  senderId?: string;
  senderName?: string;
}): Promise<{ sentCount: number }> {
  const api = getApiClient();
  const response = await api.post('/notifications/broadcast', data);
  return response.data;
}

export async function registerPushToken(token: string): Promise<void> {
  const api = getApiClient();
  await api.post('/notifications/register', { token, platform: 'expo' });
}
