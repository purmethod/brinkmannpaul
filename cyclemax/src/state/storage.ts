import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppState } from './schema';

const KEY = 'cyclemax/state';

/** Raw stored value (validated by sanitizeState), or null if nothing is stored or storage fails. */
export async function loadRawState(): Promise<unknown> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? (JSON.parse(json) as unknown) : null;
  } catch {
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: the app keeps working with the in-memory state.
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Nothing else to do.
  }
}
