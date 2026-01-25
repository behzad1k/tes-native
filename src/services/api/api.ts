export const API_CONFIG = {
	BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:9001",
	TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "10000", 10),
	RETRY_ATTEMPTS: 3,
	APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || "development",
};

if (__DEV__) {
	console.log("API Config:", API_CONFIG);
}
