export const AUTH_STORAGE_KEYS = {
	AUTH_TOKEN: "auth_token",
	REFRESH_TOKEN: "refresh_token",
	TOKEN_EXPIRY: "token_expiry",
	USER_DATA: "user_data",
	REMEMBER_ME: "remember_me",
	BIOMETRIC_ENABLED: "biometric_enabled",
} as const;

export const PREFERENCE_STORAGE_KEYS = {
	THEME: "theme",
	LANGUAGE: "language",
	NOTIFICATIONS_ENABLED: "notifications_enabled",
	PUSH_TOKEN: "push_token",
	SOUND_ENABLED: "sound_enabled",
	VIBRATION_ENABLED: "vibration_enabled",
	FONT_SIZE: "font_size",
	RTL_MODE: "rtl_mode",
} as const;

export const CACHE_STORAGE_KEYS = {
	SIGNS_CACHE: "signs_cache",
	USER_CACHE: "user_cache",
	NOTIFICATIONS_CACHE: "notifications_cache",
	LAST_SYNC: "last_sync",
	OFFLINE_QUEUE: "offline_queue",
	IMAGE_CACHE: "image_cache",
} as const;

export const APP_STATE_KEYS = {
	HAS_SEEN_ONBOARDING: "has_seen_onboarding",
	APP_VERSION: "app_version",
	FIRST_LAUNCH: "first_launch",
	LAST_LAUNCH: "last_launch",
	LAUNCH_COUNT: "launch_count",
	HAS_RATED: "has_rated",
	LAST_RATING_PROMPT: "last_rating_prompt",
	MAINTENANCE_MODE: "maintenance_mode",
} as const;

export const STORAGE_KEYS = {
	...AUTH_STORAGE_KEYS,
	...PREFERENCE_STORAGE_KEYS,
	...CACHE_STORAGE_KEYS,
	...APP_STATE_KEYS,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
