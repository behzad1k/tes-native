export interface TranslationResources {
	welcome: string;
	hello: string;
	buttons: {
		submit: string;
		cancel: string;
		save: string;
	};
	navigation: {
		home: string;
		profile: string;
		settings: string;
	};
	messages: {
		loading: string;
		error: string;
		success: string;
	};
}

export type Language = "en" | "fa";

export interface LanguageOption {
	code: Language;
	name: string;
	flag?: string;
}
