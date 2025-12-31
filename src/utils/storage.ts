import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const STORAGE_KEYS = {
	TOKEN: "auth_token",
	REFRESH_TOKEN: "refresh_token",
	LANGUAGE: "user_language",
	THEME: "app_theme_preference",
	ONBOARDING_COMPLETED: "onboarding_completed",
	LAST_SYNC: "last_sync_timestamp",
	QUERY_CACHE: "REACT_QUERY_OFFLINE_CACHE",
} as const;

export class StorageService {
	static async getItem<T>(key: string): Promise<T | null> {
		try {
			const value = await AsyncStorage.getItem(key);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error(`Error getting item ${key}:`, error);
			return null;
		}
	}

	static async setItem<T>(key: string, value: T): Promise<void> {
		try {
			await AsyncStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error(`Error setting item ${key}:`, error);
			throw error;
		}
	}

	static async removeItem(key: string): Promise<void> {
		try {
			await AsyncStorage.removeItem(key);
		} catch (error) {
			console.error(`Error removing item ${key}:`, error);
			throw error;
		}
	}

	static async clear(): Promise<void> {
		try {
			await AsyncStorage.clear();
		} catch (error) {
			console.error("Error clearing storage:", error);
			throw error;
		}
	}

	static async getLanguage(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
	}

	static async setLanguage(language: string): Promise<void> {
		return AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
	}

	static async getTheme(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEYS.THEME);
	}

	static async setTheme(theme: string): Promise<void> {
		return AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
	}

	static async multiGet(keys: string[]): Promise<Record<string, any>> {
		try {
			const pairs = await AsyncStorage.multiGet(keys);
			return pairs.reduce(
				(acc, [key, value]) => {
					acc[key] = value ? JSON.parse(value) : null;
					return acc;
				},
				{} as Record<string, any>,
			);
		} catch (error) {
			console.error("Error in multiGet:", error);
			return {};
		}
	}

	// Fix: Properly type the multiSet parameter
	static async multiSet(items: Record<string, any>): Promise<void> {
		try {
			const pairs: [string, string][] = Object.entries(items).map(
				([key, value]) => [key, JSON.stringify(value)],
			);
			await AsyncStorage.multiSet(pairs);
		} catch (error) {
			console.error("Error in multiSet:", error);
			throw error;
		}
	}

	static async getAllKeys(): Promise<readonly string[]> {
		try {
			return await AsyncStorage.getAllKeys();
		} catch (error) {
			console.error("Error getting all keys:", error);
			return [];
		}
	}
}

export class SecureStorageService {
	static async getItem(key: string): Promise<string | null> {
		try {
			return await SecureStore.getItemAsync(key);
		} catch (error) {
			console.error(`Error getting secure item ${key}:`, error);
			return null;
		}
	}

	static async setItem(key: string, value: string): Promise<void> {
		try {
			await SecureStore.setItemAsync(key, value);
		} catch (error) {
			console.error(`Error setting secure item ${key}:`, error);
			throw error;
		}
	}

	static async removeItem(key: string): Promise<void> {
		try {
			await SecureStore.deleteItemAsync(key);
		} catch (error) {
			console.error(`Error removing secure item ${key}:`, error);
			throw error;
		}
	}

	static async getToken(): Promise<string | null> {
		return this.getItem(STORAGE_KEYS.TOKEN);
	}

	static async setToken(token: string): Promise<void> {
		return this.setItem(STORAGE_KEYS.TOKEN, token);
	}

	static async removeToken(): Promise<void> {
		return this.removeItem(STORAGE_KEYS.TOKEN);
	}

	static async getRefreshToken(): Promise<string | null> {
		return this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
	}

	static async setRefreshToken(token: string): Promise<void> {
		return this.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
	}
}
