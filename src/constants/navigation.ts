export const PUBLIC_ROUTES = {
	HOME: "/(global)",
	LOGIN: "/(global)/login",
} as const;

export const PROTECTED_ROUTES = {
	ROOT: "/(protected)",
	// Sign Inventory Routes
	SIGNS_LIST: "/(protected)/sign-inventory",
	SIGN_CREATE: "/(protected)/sign-inventory/sign/create",
	SIGN_EDIT: "/(protected)/sign-inventory/sign/[id]",
	SUPPORT_CREATE: "/(protected)/sign-inventory/support/create",
	SUPPORT_EDIT: "/(protected)/sign-inventory/support/[id]",
	// Maintenance
	MAINTENCANCE_LIST: "/(protected)/maintenance",
	PROFILE: "/(protected)/profile",
	PROFILE_EDIT: "/(protected)/profile/edit",
	PROFILE_SETTINGS: "/(protected)/profile/settings",
	DASHBOARD: "/(protected)/dashboard",
	NOTIFICATIONS: "/(protected)/notifications",
} as const;

export const ROUTES = {
	...PUBLIC_ROUTES,
	...PROTECTED_ROUTES,
} as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES];

export type ProtectedRoute =
	(typeof PROTECTED_ROUTES)[keyof typeof PROTECTED_ROUTES];

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
