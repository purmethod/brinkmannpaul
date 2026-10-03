// Web preview: local notifications do not exist here. Same API as native.ts, without importing expo-notifications.
import { createScheduler } from './scheduler';

export const scheduler = createScheduler({
  isGranted: async () => false,
  cancelAll: async () => {},
  schedule: async () => {},
});

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function configureNotifications(): Promise<void> {}

export async function getPermissionState(): Promise<PermissionState> {
  return 'unsupported';
}

export async function requestPermission(): Promise<PermissionState> {
  return 'unsupported';
}
