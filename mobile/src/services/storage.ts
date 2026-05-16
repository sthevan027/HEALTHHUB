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
      console.error('[storage] Failed to save:', key);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${PREFIX}${key}`);
    } catch {
      console.error('[storage] Failed to remove:', key);
    }
  },
};
