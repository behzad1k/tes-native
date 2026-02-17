/**
 * Auth configuration — all values come from environment variables.
 * See .env.example for the full list.
 */

const required = (key: string): string => {
	const value = process.env[key];
	if (!value) {
		console.warn(`⚠️  Missing required env var: ${key}`);
		return "";
	}
	return value;
};

const optional = (key: string, fallback: string): string =>
	process.env[key] || fallback;

export const AuthConfig = {
	/** OpenID Connect issuer (used for auto-discovery) */
	issuerUrl: required("EXPO_PUBLIC_AUTH_ISSUER_URL"),

	/** OAuth2 client ID */
	clientId: required("EXPO_PUBLIC_AUTH_CLIENT_ID"),

	/** OAuth2 client secret (confidential client) */
	clientSecret: required("EXPO_PUBLIC_AUTH_CLIENT_SECRET"),

	/** OAuth2 redirect URI registered with the identity server */
	redirectUri: required("EXPO_PUBLIC_AUTH_REDIRECT_URI"),

	/** OAuth2 scopes (comma-separated in env, split to array) */
	scopes: optional("EXPO_PUBLIC_AUTH_SCOPES", "APIs").split(","),

	/** Logout endpoint */
	logoutUrl: optional(
		"EXPO_PUBLIC_AUTH_LOGOUT_URL",
		`${process.env.EXPO_PUBLIC_AUTH_API_URL || ""}Account/Logout`,
	),
} as const;

export const ApiUrls = {
	auth: optional("EXPO_PUBLIC_AUTH_API_URL", ""),
	sign: optional("EXPO_PUBLIC_SIGN_API_URL", ""),
	field: optional("EXPO_PUBLIC_FIELD_API_URL", ""),
	infrastructure: optional("EXPO_PUBLIC_INFRASTRUCTURE_API_URL", ""),
	trafficStudy: optional("EXPO_PUBLIC_TRAFFIC_STUDY_API_URL", ""),
	setting: optional("EXPO_PUBLIC_SETTING_API_URL", ""),
	moduleOfModule: optional("EXPO_PUBLIC_MODULE_OF_MODULE_API_URL", ""),
} as const;

export default AuthConfig;
