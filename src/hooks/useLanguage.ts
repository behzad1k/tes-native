import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import { Language, LanguageOption } from "@/src/types/translation";
import { useI18nContext } from "@/src/components/contexts/LanguageContext";

export const useLanguage = () => {
	const { t, i18n } = useTranslation();
	const { isLanguageInitialized } = useI18nContext();
	const rtlLanguages: string[] = [];
	const currentLanguage = i18n.language as Language;

	const languageOptions: LanguageOption[] = useMemo(
		() => [{ code: "en", name: "English", flag: "🇺🇸" }],
		[],
	);

	const changeLanguage = useCallback(
		async (languageCode: Language): Promise<void> => {
			if (!isLanguageInitialized) {
				console.warn("i18n not initialized yet");
				return;
			}

			try {
				await i18n.changeLanguage(languageCode);
			} catch (error) {
				console.error("Error changing language:", error);
			}
		},
		[i18n, isLanguageInitialized],
	);

	const getCurrentLanguageOption = useCallback(():
		| LanguageOption
		| undefined => {
		return languageOptions.find((lang) => lang.code === currentLanguage);
	}, [currentLanguage, languageOptions]);

	const isRTL = (): boolean => {
		return rtlLanguages.includes(currentLanguage);
	};

	return {
		t,
		currentLanguage,
		languageOptions,
		changeLanguage,
		getCurrentLanguageOption,
		isRTL,
		isLanguageLoaded: isLanguageInitialized && i18n.isInitialized,
	};
};
