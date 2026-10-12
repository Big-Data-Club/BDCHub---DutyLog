import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// On the web refresh tokens remain in memory only. Never persist them to localStorage.
const webSession = new Map<string, string>();
export const WHEN_UNLOCKED = SecureStore.WHEN_UNLOCKED;
export async function getItemAsync(key: string): Promise<string | null> {
  return Platform.OS === 'web' ? webSession.get(key) || null : SecureStore.getItemAsync(key);
}
export async function setItemAsync(key: string, value: string, options?: SecureStore.SecureStoreOptions): Promise<void> {
  if (Platform.OS === 'web') { webSession.set(key, value); return; }
  await SecureStore.setItemAsync(key, value, options);
}
export async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === 'web') { webSession.delete(key); return; }
  await SecureStore.deleteItemAsync(key);
}
