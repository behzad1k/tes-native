import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

// Storage keys
const STORAGE_KEYS = {
	AUTH_USER: "auth_user",
	AUTH_TOKEN: "auth_token",
	SIGNS_DATA: "signs_data",
	SUPPORT_DATA: "supports_data",
	IMAGES_DIR: "images",
} as const;

/**
 * Token Storage - handles secure token storage
 */
export class TokenStorage {
	static async getToken(): Promise<string | null> {
		try {
			return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
		} catch (error) {
			console.error("Error getting token:", error);
			return null;
		}
	}

	static async saveToken(token: string): Promise<void> {
		try {
			await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
		} catch (error) {
			console.error("Error saving token:", error);
			throw error;
		}
	}

	static async clearToken(): Promise<void> {
		try {
			await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
		} catch (error) {
			console.error("Error clearing token:", error);
		}
	}
}

/**
 * Redux Storage - handles Redux state persistence
 */
export class ReduxStorage {
	static async loadState<T>(key: string): Promise<T | null> {
		try {
			const serialized = await AsyncStorage.getItem(key);
			if (!serialized) return null;
			return JSON.parse(serialized);
		} catch (error) {
			console.error(`Error loading state for ${key}:`, error);
			return null;
		}
	}

	static async saveState<T>(key: string, state: T): Promise<void> {
		try {
			const serialized = JSON.stringify(state);
			await AsyncStorage.setItem(key, serialized);
		} catch (error) {
			console.error(`Error saving state for ${key}:`, error);
			throw error;
		}
	}

	static async clearState(key: string): Promise<void> {
		try {
			await AsyncStorage.removeItem(key);
		} catch (error) {
			console.error(`Error clearing state for ${key}:`, error);
		}
	}

	static async clearAllStates(): Promise<void> {
		try {
			const keys = Object.values(STORAGE_KEYS).filter(
				(key) => key !== STORAGE_KEYS.AUTH_TOKEN,
			);
			await AsyncStorage.multiRemove(keys);
		} catch (error) {
			console.error("Error clearing all states:", error);
		}
	}
}

/**
 * Image Storage - handles local image file storage
 */
export class ImageStorage {
	private static imagesDir = `${FileSystem.Directory}${STORAGE_KEYS.IMAGES_DIR}/`;

	/**
	 * Initialize images directory
	 */
	static async initialize(): Promise<void> {
		try {
			const dirInfo = await FileSystem.getInfoAsync(this.imagesDir);
			if (!dirInfo.exists) {
				await FileSystem.makeDirectoryAsync(this.imagesDir, {
					intermediates: true,
				});
			}
		} catch (error) {
			console.error("Error initializing images directory:", error);
			throw error;
		}
	}

	/**
	 * Save image to local storage
	 * @param imageUri - URI of the image (from camera or gallery)
	 * @param signId - ID of the sign this image belongs to
	 * @param imageId - Unique ID for this image
	 * @returns Local file path
	 */
	static async saveImage(
		imageUri: string,
		signId: string,
		imageId: string,
	): Promise<string> {
		try {
			await this.initialize();

			const extension = imageUri.split(".").pop() || "jpg";
			const filename = `${signId}_${imageId}.${extension}`;
			const localPath = `${this.imagesDir}${filename}`;

			// Copy image to local storage
			await FileSystem.copyAsync({
				from: imageUri,
				to: localPath,
			});

			return localPath;
		} catch (error) {
			console.error("Error saving image:", error);
			throw error;
		}
	}

	/**
	 * Get image from local storage
	 * @param localPath - Local file path
	 * @returns Image URI or null if not found
	 */
	static async getImage(localPath: string): Promise<string | null> {
		try {
			const fileInfo = await FileSystem.getInfoAsync(localPath);
			if (fileInfo.exists) {
				return localPath;
			}
			return null;
		} catch (error) {
			console.error("Error getting image:", error);
			return null;
		}
	}

	/**
	 * Delete image from local storage
	 * @param localPath - Local file path
	 */
	static async deleteImage(localPath: string): Promise<void> {
		try {
			const fileInfo = await FileSystem.getInfoAsync(localPath);
			if (fileInfo.exists) {
				await FileSystem.deleteAsync(localPath);
			}
		} catch (error) {
			console.error("Error deleting image:", error);
		}
	}

	/**
	 * Delete all images for a sign
	 * @param signId - ID of the sign
	 */
	static async deleteSignImages(signId: string): Promise<void> {
		try {
			await this.initialize();

			const files = await FileSystem.readDirectoryAsync(this.imagesDir);
			const signFiles = files.filter((file) => file.startsWith(`${signId}_`));

			for (const file of signFiles) {
				await FileSystem.deleteAsync(`${this.imagesDir}${file}`);
			}
		} catch (error) {
			console.error("Error deleting sign images:", error);
		}
	}

	/**
	 * Clean up images that don't belong to any sign
	 * @param validSignIds - Array of valid sign IDs
	 */
	static async cleanupImages(validSignIds: string[]): Promise<void> {
		try {
			await this.initialize();

			const files = await FileSystem.readDirectoryAsync(this.imagesDir);

			for (const file of files) {
				const signId = file.split("_")[0];
				if (!validSignIds.includes(signId)) {
					await FileSystem.deleteAsync(`${this.imagesDir}${file}`);
				}
			}
		} catch (error) {
			console.error("Error cleaning up images:", error);
		}
	}

	/**
	 * Get all images for a sign
	 * @param signId - ID of the sign
	 * @returns Array of image paths
	 */
	static async getSignImages(signId: string): Promise<string[]> {
		try {
			await this.initialize();

			const files = await FileSystem.readDirectoryAsync(this.imagesDir);
			const signFiles = files
				.filter((file) => file.startsWith(`${signId}_`))
				.map((file) => `${this.imagesDir}${file}`);

			return signFiles;
		} catch (error) {
			console.error("Error getting sign images:", error);
			return [];
		}
	}

	/**
	 * Clear all images
	 */
	static async clearAllImages(): Promise<void> {
		try {
			const dirInfo = await FileSystem.getInfoAsync(this.imagesDir);
			if (dirInfo.exists) {
				await FileSystem.deleteAsync(this.imagesDir, { idempotent: true });
			}
		} catch (error) {
			console.error("Error clearing all images:", error);
		}
	}
}

export { STORAGE_KEYS };
