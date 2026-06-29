import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { enqueueOfflineOperation } from './sync-engine';

const BACKEND_URL = 'https://folk-crm-backend-production.up.railway.app/api';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'cached_user';

let apiClient: AxiosInstance | null = null;
let isOffline = false;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

export function setOnlineStatus(online: boolean) {
  isOffline = !online;
}

function isWriteMethod(method?: string): boolean {
  const m = method?.toUpperCase() || '';
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

function isTrackedUrl(url?: string): boolean {
  if (!url) return false;
  if (url.startsWith('/auth/')) return false;
  if (url.startsWith('/health')) return false;
  if (url.startsWith('/sync/')) return false;
  return true;
}

export function getApiClient(): AxiosInstance {
  if (apiClient) return apiClient;

  apiClient = axios.create({
    baseURL: BACKEND_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _queued?: boolean;
      };

      if (
        !error.response &&
        isOffline &&
        isWriteMethod(originalRequest?.method) &&
        isTrackedUrl(originalRequest?.url) &&
        !originalRequest._queued
      ) {
        originalRequest._queued = true;
        await enqueueOfflineOperation(
          (originalRequest.method?.toUpperCase() || 'POST') as
            | 'POST'
            | 'PUT'
            | 'DELETE',
          originalRequest.url || '',
          originalRequest.data ? JSON.parse(originalRequest.data) : undefined
        );
        return Promise.reject(new Error('Queued for offline sync'));
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient!(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await SecureStore.getItemAsync(
            REFRESH_TOKEN_KEY
          );
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          const response = await axios.post(
            `${BACKEND_URL}/auth/refresh`,
            {},
            {
              headers: { Authorization: `Bearer ${refreshToken}` },
            }
          );

          const { token } = response.data;
          await SecureStore.setItemAsync(TOKEN_KEY, token);

          processQueue(null, token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient!(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return apiClient;
}

export async function setTokens(token: string, refreshToken?: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function cacheUser(user: object) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getCachedUser<T = object>(): Promise<T | null> {
  const data = await SecureStore.getItemAsync(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export { BACKEND_URL };
