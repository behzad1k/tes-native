import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
	LANGUAGE: "user-language",
	THEME: "app_theme_preference",
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
		}
	}

	static async removeItem(key: string): Promise<void> {
		try {
			await AsyncStorage.removeItem(key);
		} catch (error) {
			console.error(`Error removing item ${key}:`, error);
		}
	}

	static async getLanguage(): Promise<string | null> {
		return AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
	}

	static async setLanguage(language: string): Promise<void> {
		return AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
	}
}
