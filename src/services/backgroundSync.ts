import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncAll } from './sync-engine';
import { getToken } from './api-client';

const BACKGROUND_CRM_SYNC_TASK = 'background-crm-sync';

TaskManager.defineTask(BACKGROUND_CRM_SYNC_TASK, async () => {
  console.log('[Background Sync] Worker running in background...');
  try {
    const token = await getToken();
    if (token) {
      await syncAll();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    console.log('[Background Sync] No credentials found. Sync skipped.');
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[Background Sync] Failed during execution:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_CRM_SYNC_TASK
  );
  if (isRegistered) {
    console.log('[Background Sync] Task already registered.');
    return;
  }

  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_CRM_SYNC_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log(
      '[Background Sync] Task registered successfully for 15-minute intervals.'
    );
  } catch (err) {
    console.error('[Background Sync] Failed to register task:', err);
  }
}

export async function unregisterBackgroundSync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_CRM_SYNC_TASK
    );
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_CRM_SYNC_TASK);
      console.log('[Background Sync] Task unregistered successfully.');
    }
  } catch (err) {
    console.error('[Background Sync] Failed to unregister task:', err);
  }
}
