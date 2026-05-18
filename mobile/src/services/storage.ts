import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@healthhub:';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(`${PREFIX}${key}`);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    } catch {
      if (__DEV__) console.error('[storage] Failed to save:', key);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${PREFIX}${key}`);
    } catch {
      if (__DEV__) console.error('[storage] Failed to remove:', key);
    }
  },
};

export async function readCache<T>(key: string): Promise<T | null> {
  return storage.get<T>(key);
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  await storage.set(key, value);
}
