import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageService, STORAGE_KEYS } from "@/src/utils/storage";

describe("StorageService", () => {
	beforeEach(() => {
		AsyncStorage.clear();
	});

	describe("getItem", () => {
		it("should get item from storage", async () => {
			const testData = { foo: "bar" };
			await AsyncStorage.setItem("test-key", JSON.stringify(testData));

			const result = await StorageService.getItem("test-key");

			expect(result).toEqual(testData);
		});

		it("should return null for non-existent key", async () => {
			const result = await StorageService.getItem("non-existent");

			expect(result).toBeNull();
		});
	});

	describe("setItem", () => {
		it("should set item in storage", async () => {
			const testData = { foo: "bar" };

			await StorageService.setItem("test-key", testData);

			const stored = await AsyncStorage.getItem("test-key");
			expect(JSON.parse(stored!)).toEqual(testData);
		});
	});

	describe("removeItem", () => {
		it("should remove item from storage", async () => {
			await AsyncStorage.setItem("test-key", "test-value");

			await StorageService.removeItem("test-key");

			const result = await AsyncStorage.getItem("test-key");
			expect(result).toBeNull();
		});
	});

	describe("language helpers", () => {
		it("should get and set language", async () => {
			await StorageService.setLanguage("en");

			const language = await StorageService.getLanguage();

			expect(language).toBe("en");
		});
	});

	describe("theme helpers", () => {
		it("should get and set theme", async () => {
			await StorageService.setTheme("dark");

			const theme = await StorageService.getTheme();

			expect(theme).toBe("dark");
		});
	});

	describe("multiGet", () => {
		it("should get multiple items", async () => {
			await AsyncStorage.setItem("key1", JSON.stringify("value1"));
			await AsyncStorage.setItem("key2", JSON.stringify("value2"));

			const result = await StorageService.multiGet(["key1", "key2"]);

			expect(result).toEqual({
				key1: "value1",
				key2: "value2",
			});
		});
	});

	describe("multiSet", () => {
		it("should set multiple items", async () => {
			await StorageService.multiSet({
				key1: "value1",
				key2: "value2",
			});

			const key1 = await AsyncStorage.getItem("key1");
			const key2 = await AsyncStorage.getItem("key2");

			expect(JSON.parse(key1!)).toBe("value1");
			expect(JSON.parse(key2!)).toBe("value2");
		});
	});
});
