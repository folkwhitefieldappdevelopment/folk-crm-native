import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { runBidirectionalSync } from './syncService';

const BACKGROUND_CRM_SYNC_TASK = 'background-crm-sync';

// Define the background task
TaskManager.defineTask(BACKGROUND_CRM_SYNC_TASK, async () => {
  console.log('[Background Sync] Worker running in background...');
  try {
    // In a real application, read the stored credentials (e.g. from SecureStore or AsyncStorage)
    // We mock retrieving the auth token here. In production, use Expo SecureStore.
    const mockAuthToken = 'mocked-jwt-token-from-secure-store';

    if (mockAuthToken) {
      await runBidirectionalSync(mockAuthToken);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    
    console.log('[Background Sync] No credentials found. Sync skipped.');
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[Background Sync] Failed during execution:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the task periodic work
export async function registerBackgroundSync() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_CRM_SYNC_TASK);
  if (isRegistered) {
    console.log('[Background Sync] Task already registered.');
    return;
  }

  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_CRM_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 Minutes (in seconds)
      stopOnTerminate: false,   // Continue running sync even if app is terminated
      startOnBoot: true,        // Automatically start background worker when device starts
    });
    console.log('[Background Sync] Task registered successfully for 15-minute intervals.');
  } catch (err) {
    console.error('[Background Sync] Failed to register task:', err);
  }
}

export async function unregisterBackgroundSync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_CRM_SYNC_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_CRM_SYNC_TASK);
      console.log('[Background Sync] Task unregistered successfully.');
    }
  } catch (err) {
    console.error('[Background Sync] Failed to unregister task:', err);
  }
}
