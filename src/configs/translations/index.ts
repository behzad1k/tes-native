import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { StorageService } from "@/src/utils/storage";
import { Language } from "@/src/types/translation";

// Import translation files
import en from "./locales/en.json";

export const defaultLanguage: Language = "en";
export const supportedLanguages: Language[] = ["en"];

export const LOCALES = {
	en: "en-US",
};

const resources = {
	en: { translation: en },
} as const;

const LANGUAGE_DETECTOR = {
	type: "languageDetector" as const,
	async: true,
	detect: async (callback: (lng: string) => void) => {
		try {
			const savedLanguage = await StorageService.getLanguage();
			if (
				savedLanguage &&
				supportedLanguages.includes(savedLanguage as Language)
			) {
				callback(savedLanguage);
			} else {
				callback(defaultLanguage);
			}
		} catch (error) {
			console.error("Error detecting language:", error);
			callback(defaultLanguage);
		}
	},
	init: () => {},
	cacheUserLanguage: async (language: string) => {
		try {
			await StorageService.setLanguage(language);
		} catch (error) {
			console.error("Error caching language:", error);
		}
	},
};

// Initialize i18n
const initI18n = async () => {
	return i18n
		.use(LANGUAGE_DETECTOR)
		.use(initReactI18next)
		.init({
			resources,
			fallbackLng: defaultLanguage,
			debug: __DEV__,
			interpolation: {
				escapeValue: false,
			},
			compatibilityJSON: "v4",
			react: {
				useSuspense: false,
			},
		});
};

// Export the initialization promise
export const i18nInitPromise = initI18n();

export default i18n;
