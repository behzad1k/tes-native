import { useEffect, useCallback, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { useRouter } from "expo-router";
import {
	loginWithOAuth,
	logout as logoutAction,
} from "@/src/store/slices/authSlice";
import { AuthConfig, ApiUrls } from "@/src/modules/auth/config";
import { ROUTES } from "@/src/constants/navigation";
import { Toast } from "toastify-react-native";
import { apiClient } from "@/src/services/api/apiClient";
import { StorageService } from "@/src/utils/storage";
import { ForgotPasswordRequest, UserProfile } from "../types";
import ENDPOINTS from "@/src/services/api/endpoints";

// Complete any in-flight browser auth sessions on app start
WebBrowser.maybeCompleteAuthSession();

// Keys that get cleared on logout
const AUTH_STORAGE_KEYS = [
	"token",
	"refresh_token",
	"userProfile",
	"expDate",
	"setup_signSetups",
	"setup_collisionFields",
	"setup_divisions",
	"setup_vehicleClassifications",
	"setup_generalSettings",
	"setup_moduleOfModule",
] as const;

// ─── Hook ──────────────────────────────────────────────────────────

export const useAuth = () => {
	const dispatch = useAppDispatch();
	const router = useRouter();
	const {
		isAuthenticated,
		user,
		isLoading: authLoading,
	} = useAppSelector((state) => state.auth);

	const [isProcessing, setIsProcessing] = useState(false);
	// ── OpenID Connect discovery ───────────────────────────────────
	const discovery = AuthSession.useAutoDiscovery(AuthConfig.issuerUrl);
	// ── Authorization code + PKCE request ──────────────────────────
	const [request, result, promptAsync] = AuthSession.useAuthRequest(
		{
			clientId: AuthConfig.clientId,
			redirectUri: AuthConfig.redirectUri,
			scopes: AuthConfig.scopes,
		},
		discovery,
	);

	// ── Browser warm-up / cool-down ────────────────────────────────
	useEffect(() => {
		WebBrowser.warmUpAsync();
		return () => {
			WebBrowser.coolDownAsync();
		};
	}, []);

	// ── Handle OAuth result ────────────────────────────────────────
	useEffect(() => {
		console.log(result);
		if (!result) return;

		if (result.type === "success" && discovery) {
			handleAuthSuccess();
		} else if (result.type === "error") {
			console.error("Auth error:", result.error);
			Toast.error(
				"Authentication error: " + (result.error?.message || "Unknown"),
			);
		}
		// result.type === 'dismiss' → user cancelled, nothing to do
	}, [result, discovery]);

	// ── Core: exchange code → token → profile → setup data ────────
	const handleAuthSuccess = async () => {
		console.log("success: ", result);
		if (!result || result.type !== "success" || !discovery) return;

		setIsProcessing(true);
		try {
			// 1. Exchange authorization code for access token
			const tokenResponse = await AuthSession.exchangeCodeAsync(
				{
					clientId: AuthConfig.clientId,
					code: result.params.code,
					redirectUri: AuthConfig.redirectUri,
					clientSecret: AuthConfig.clientSecret,
					extraParams: {
						code_verifier: request?.codeVerifier || "",
					},
				},
				discovery,
			);

			const accessToken = tokenResponse.accessToken;

			// 2. Persist the token expiry
			const expDate = decodeTokenExpiry(accessToken);
			if (expDate) {
				await StorageService.setItem("expDate", expDate.toISOString());
			}

			// 3. Dispatch Redux thunk (saves token, fetches profile, caches user)
			const action = await dispatch(loginWithOAuth(accessToken));

			if (loginWithOAuth.fulfilled.match(action)) {
				router.replace(ROUTES.HOME);
			} else {
				Toast.error("Login failed. Please try again.");
			}
		} catch (error) {
			console.error("Token exchange error:", error);
			Toast.error("Authentication failed: " + String(error));
		} finally {
			setIsProcessing(false);
		}
	};

	// ── Public actions ─────────────────────────────────────────────

	/** Open the identity-server login page in the browser */
	const login = useCallback(() => {
		if (request) {
			promptAsync({});
		}
	}, [request, promptAsync]);

	/** Clear local state + open identity-server logout page */
	const logout = useCallback(async () => {
		try {
			// Remote logout (identity server)
			await WebBrowser.openAuthSessionAsync(
				AuthConfig.logoutUrl,
				AuthConfig.redirectUri,
			).catch(() => {});

			// Local cleanup
			await AsyncStorage.multiRemove([...AUTH_STORAGE_KEYS]);
			dispatch(logoutAction());
			router.replace(ROUTES.LOGIN);
		} catch (error) {
			console.warn("Logout error:", error);
			// Force local cleanup even if browser step failed
			dispatch(logoutAction());
		}
	}, [dispatch, router]);

	/** Send a forgot-password email */
	const forgotPassword = useCallback(
		async (request: ForgotPasswordRequest): Promise<boolean> => {
			try {
				await apiClient.get(`api/user/ForgotPassword/${request.email}`);
				return true;
			} catch (error) {
				console.error("Forgot password error:", error);
				return false;
			}
		},
		[],
	);

	/** Register an Expo push-notification token with the backend */
	const registerPushToken = useCallback(
		async (pushToken: string): Promise<void> => {
			try {
				const token = await StorageService.getItem<string>("token");
				if (!token) return;

				await apiClient.get(`api/user/SetExpoNotificationToken/${pushToken}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
			} catch (error) {
				console.error("Error registering push token:", error);
			}
		},
		[],
	);

	/** Fetch fresh user profile using stored token */
	const refreshUserProfile =
		useCallback(async (): Promise<UserProfile | null> => {
			try {
				const profile = await apiClient.get<UserProfile>(
					ENDPOINTS.USER.PROFIlE,
				);

				await StorageService.setItem("userProfile", JSON.stringify(profile));
				return profile;
			} catch (error) {
				console.error("Error refreshing user profile:", error);
				return null;
			}
		}, []);
	/** Check whether the persisted token is still valid */
	const checkAuthentication = useCallback(async (): Promise<boolean> => {
		try {
			const token = await StorageService.getItem<string>("token");
			console.log("token", token);
			if (!token) return false;

			const expDateStr = await StorageService.getItem<string>("expDate");
			if (expDateStr) {
				const expDate = new Date(expDateStr);
				if (expDate < new Date()) {
					await AsyncStorage.multiRemove([...AUTH_STORAGE_KEYS]);
					return false;
				}
			}
			return true;
		} catch (error) {
			console.error("Error checking authentication:", error);
			return false;
		}
	}, []);

	// ── Derived state ──────────────────────────────────────────────

	const isReady = !!request;
	const isLoading =
		isProcessing || (result?.type === "success" && !result?.params?.error);

	return {
		// State
		isReady,
		isLoading,
		isAuthenticated,
		isAuthLoading: authLoading,
		user,
		discovery,

		// Actions
		login,
		logout,
		forgotPassword,
		registerPushToken,
		refreshUserProfile,
		checkAuthentication,
	};
};

// ─── Internal helpers (not exported) ───────────────────────────────

function decodeTokenExpiry(token: string): Date | null {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.exp ? new Date(payload.exp * 1000) : null;
	} catch {
		return null;
	}
}
