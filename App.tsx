import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/auth-context';
import { ConnectivityProvider } from './src/contexts/connectivity-context';
import { AppNavigator } from './src/navigation/app-navigator';
import { ReminderManager } from './src/ui/components/ReminderManager';
import { initSyncEngine } from './src/services/sync-engine';
import { registerBackgroundSync } from './src/services/backgroundSync';
import { getApiClient } from './src/services/api-client';

// Configure notification handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Create notification channel for Android
async function setupNotificationChannel() {
  await Notifications.setNotificationChannelAsync('follow-ups', {
    name: 'Follow-up Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'alarm_chime.wav',
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#3F51B5',
  });

  await Notifications.setNotificationChannelAsync('broadcasts', {
    name: 'Broadcasts & Alerts',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

// Register for push notifications
async function registerForPushNotifications() {
  const existingStatus = await Notifications.getPermissionsAsync();
  const existingGranted = (existingStatus as any).granted;
  let finalGranted = existingGranted;

  if (!existingGranted) {
    const result = await Notifications.requestPermissionsAsync();
    finalGranted = (result as any).granted;
  }

  if (!finalGranted) {
    console.log('[Push] Permission not granted');
    return null;
  }

  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'fc588c02-79af-45ca-bcd5-1a060faaad0b',
    });
    return pushTokenData.data;
  } catch (err) {
    console.error('[Push] Failed to get token:', err);
    return null;
  }
}

// Send push token to backend
async function sendPushTokenToServer(token: string) {
  try {
    const api = getApiClient();
    await api.post('/notifications/register', {
      token,
      platform: 'expo',
    });
    console.log('[Push] Token registered with server');
  } catch (err) {
    console.error('[Push] Failed to register token:', err);
  }
}

function AppInit({ children }: { children: React.ReactNode }) {
  const notificationResponseListener = useRef<any>();

  useEffect(() => {
    initSyncEngine();
    registerBackgroundSync();
    setupNotificationChannel();

    // Register for push notifications on first launch
    registerForPushNotifications().then((token) => {
      if (token) {
        sendPushTokenToServer(token);
      }
    });

    // Handle notification tap (deep linking)
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.personId) {
          // Deep link handled by navigation state management
          console.log('[Push] Navigate to person:', data.personId);
        }
        if (data?.sessionId) {
          console.log('[Push] Navigate to session:', data.sessionId);
        }
      });

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  return <>{children}</>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ConnectivityProvider>
        <AuthProvider>
          <AppInit>
            <AppNavigator />
            <ReminderManager />
          </AppInit>
          <StatusBar style="light" />
        </AuthProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>
  );
}
