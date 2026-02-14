export const API_CONFIG = {
	BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:9001/",
	AUTH_BASE_URL:
		process.env.EXPO_PUBLIC_AUTH_API_URL || "http://localhost:9001/",
	POST_FIX: process.env.EXPO_PUBLIC_API_POST_FIX,
	TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "10000", 10),
	RETRY_ATTEMPTS: 3,
	APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || "development",
};

if (__DEV__) {
	console.log("API Config:", {
		BASE_URL: API_CONFIG.BASE_URL,
		TIMEOUT: API_CONFIG.TIMEOUT,
		APP_ENV: API_CONFIG.APP_ENV,
	});
}
