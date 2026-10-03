import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { colors } from '@/theme';

import { createScheduler, type NotificationApi } from './scheduler';

const CHANNEL_ID = 'cyclemax';
// The web preview resolves native.web.ts instead of this file.
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

const api: NotificationApi = {
  async isGranted() {
    const status = await Notifications.getPermissionsAsync();
    return status.granted;
  },
  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
  async schedule(request) {
    await Notifications.scheduleNotificationAsync({
      identifier: request.identifier,
      content: { title: request.title, body: request.body, sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: request.date, channelId: CHANNEL_ID },
    });
  },
};

const noop: NotificationApi = {
  isGranted: async () => false,
  cancelAll: async () => {},
  schedule: async () => {},
};

export const scheduler = createScheduler(supported ? api : noop);

let configured = false;

/** Foreground presentation + Android channel. Safe to call more than once. */
export async function configureNotifications(): Promise<void> {
  if (!supported || configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Cyclemax',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: colors.accent,
    });
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermissionState(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  try {
    const status = await Notifications.getPermissionsAsync();
    if (status.granted) return 'granted';
    return status.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export async function requestPermission(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  try {
    await configureNotifications();
    const status = await Notifications.requestPermissionsAsync();
    scheduler.invalidate();
    if (status.granted) return 'granted';
    return status.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unsupported';
  }
}
