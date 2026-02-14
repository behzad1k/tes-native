import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Directory, Paths } from "expo-file-system/next";

const STORAGE_PREFIX = "@app_store:";

/**
 * Redux storage utilities for persisting state to AsyncStorage
 */
export const ReduxStorage = {
	/**
	 * Save state to AsyncStorage
	 */
	saveState: async (key: string, state: any): Promise<void> => {
		try {
			const serializedState = JSON.stringify(state);
			await AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedState);
		} catch (error) {
			console.error(`Error saving state for ${key}:`, error);
			throw error;
		}
	},

	/**
	 * Load state from AsyncStorage
	 */
	loadState: async <T>(key: string): Promise<T | null> => {
		try {
			const serializedState = await AsyncStorage.getItem(
				`${STORAGE_PREFIX}${key}`,
			);
			if (serializedState === null) {
				return null;
			}
			return JSON.parse(serializedState) as T;
		} catch (error) {
			console.error(`Error loading state for ${key}:`, error);
			return null;
		}
	},

	/**
	 * Remove state from AsyncStorage
	 */
	removeState: async (key: string): Promise<void> => {
		try {
			await AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`);
		} catch (error) {
			console.error(`Error removing state for ${key}:`, error);
		}
	},

	/**
	 * Clear all app state from AsyncStorage
	 */
	clearAll: async (): Promise<void> => {
		try {
			const keys = await AsyncStorage.getAllKeys();
			const appKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
			await AsyncStorage.multiRemove(appKeys);
		} catch (error) {
			console.error("Error clearing all state:", error);
		}
	},
};

/**
 * Image storage utilities for managing local image files
 * Using new Expo FileSystem API (expo-file-system/next)
 */
export const ImageStorage = {
	/**
	 * Get the base directory for storing images
	 */
	getBaseDirectory: (customerName: string = "default"): Directory => {
		return new Directory(Paths.document, customerName);
	},

	/**
	 * Ensure the image directory exists
	 */
	ensureDirectory: async (
		customerName: string = "default",
	): Promise<Directory> => {
		const dir = ImageStorage.getBaseDirectory(customerName);
		if (!dir.exists) {
			dir.create();
		}
		return dir;
	},

	/**
	 * Save an image from a URI to local storage
	 */
	saveImage: async (
		sourceUri: string,
		customerName: string = "default",
		filename?: string,
	): Promise<string> => {
		try {
			const dir = await ImageStorage.ensureDirectory(customerName);
			const actualFilename =
				filename ||
				`${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

			const sourceFile = new File(sourceUri);
			const destFile = new File(dir, actualFilename);

			sourceFile.copy(destFile);

			return destFile.uri;
		} catch (error) {
			console.error("Error saving image:", error);
			throw error;
		}
	},

	/**
	 * Download an image from a URL
	 */
	downloadImage: async (
		downloadUrl: string,
		customerName: string = "default",
		filename?: string,
	): Promise<string> => {
		try {
			const dir = await ImageStorage.ensureDirectory(customerName);
			const actualFilename =
				filename ||
				`${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
			const destFile = new File(dir, actualFilename);

			// Fetch and save the image
			const response = await fetch(downloadUrl);
			const blob = await response.blob();
			const base64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					const result = reader.result as string;
					// Remove data URL prefix
					resolve(result.split(",")[1]);
				};
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});

			destFile.write(base64, { encoding: "base64" });

			return destFile.uri;
		} catch (error) {
			console.error("Error downloading image:", error);
			throw error;
		}
	},

	/**
	 * Delete an image from local storage
	 */
	deleteImage: async (imageUri: string): Promise<void> => {
		try {
			const file = new File(imageUri);
			if (file.exists) {
				file.delete();
			}
		} catch (error) {
			console.error("Error deleting image:", error);
		}
	},

	/**
	 * Delete all images for a customer
	 */
	deleteAllImages: async (customerName: string = "default"): Promise<void> => {
		try {
			const dir = ImageStorage.getBaseDirectory(customerName);
			if (dir.exists) {
				dir.delete();
			}
		} catch (error) {
			console.error("Error deleting all images:", error);
		}
	},

	/**
	 * Check if an image exists
	 */
	imageExists: (imageUri: string): boolean => {
		try {
			const file = new File(imageUri);
			return file.exists;
		} catch (error) {
			return false;
		}
	},

	/**
	 * Get the file size of an image
	 */
	getImageSize: (imageUri: string): number | null => {
		try {
			const file = new File(imageUri);
			if (file.exists) {
				return file.size ?? null;
			}
			return null;
		} catch (error) {
			return null;
		}
	},
};

/**
 * Token storage utilities
 */
export const TokenStorage = {
	TOKEN_KEY: "@auth_token",
	REFRESH_TOKEN_KEY: "@refresh_token",
	EXPIRY_KEY: "@token_expiry",

	saveTokens: async (
		accessToken: string,
		refreshToken?: string,
		expiresIn?: number,
	): Promise<void> => {
		try {
			await AsyncStorage.setItem(TokenStorage.TOKEN_KEY, accessToken);

			if (refreshToken) {
				await AsyncStorage.setItem(
					TokenStorage.REFRESH_TOKEN_KEY,
					refreshToken,
				);
			}

			if (expiresIn) {
				const expiryTime = Date.now() + expiresIn * 1000;
				await AsyncStorage.setItem(
					TokenStorage.EXPIRY_KEY,
					expiryTime.toString(),
				);
			}
		} catch (error) {
			console.error("Error saving tokens:", error);
			throw error;
		}
	},

	getAccessToken: async (): Promise<string | null> => {
		try {
			return await AsyncStorage.getItem(TokenStorage.TOKEN_KEY);
		} catch (error) {
			console.error("Error getting access token:", error);
			return null;
		}
	},

	getRefreshToken: async (): Promise<string | null> => {
		try {
			return await AsyncStorage.getItem(TokenStorage.REFRESH_TOKEN_KEY);
		} catch (error) {
			console.error("Error getting refresh token:", error);
			return null;
		}
	},

	isTokenExpired: async (): Promise<boolean> => {
		try {
			const expiryStr = await AsyncStorage.getItem(TokenStorage.EXPIRY_KEY);
			if (!expiryStr) {
				return true;
			}
			const expiry = parseInt(expiryStr, 10);
			// Add 60 second buffer
			return Date.now() >= expiry - 60000;
		} catch (error) {
			console.error("Error checking token expiry:", error);
			return true;
		}
	},

	clearTokens: async (): Promise<void> => {
		try {
			await AsyncStorage.multiRemove([
				TokenStorage.TOKEN_KEY,
				TokenStorage.REFRESH_TOKEN_KEY,
				TokenStorage.EXPIRY_KEY,
			]);
		} catch (error) {
			console.error("Error clearing tokens:", error);
		}
	},
};
