import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Requests the READ_CALL_LOG permission from the user at runtime on Android.
 */
export async function requestCallLogPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
    );

    if (hasPermission) {
      console.log('[Native Permissions] READ_CALL_LOG permission already granted.');
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      {
        title: 'Call Log Permission',
        message: 'Spiritual Gems CRM requires access to call logs to sync calling details with your database.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return status === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('[Native Permissions] Failed to request Call Log permission:', err);
    return false;
  }
}
