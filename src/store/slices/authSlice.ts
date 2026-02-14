import { apiClient } from "@/src/services/api/apiClient";
import { User } from "@/src/types/models";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { TokenStorage, ReduxStorage } from "../persistence";
import { AuthConfig, ApiUrls } from "@/src/modules/auth/config";
import ENDPOINTS from "@/src/services/api/endpoints";
import { BUser } from "@/src/types/api";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	tokenLastUpdated: number | null;
	tokenExpiry: number | null;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true,
	tokenLastUpdated: null,
	tokenExpiry: null,
};

// ─── Helpers ───────────────────────────────────────────────────────

const getTokenExpiry = (token: string): number | null => {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.exp ? payload.exp * 1000 : null;
	} catch (error) {
		console.error("Error decoding token:", error);
		return null;
	}
};

// ─── Thunks ────────────────────────────────────────────────────────

/** Initialize auth from persisted storage */
export const initializeAuth = createAsyncThunk(
	"auth/initialize",
	async (_, { rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();

			if (!token) {
				return { user: null, isAuthenticated: false, tokenExpiry: null };
			}

			const expiry = getTokenExpiry(token);
			const now = Date.now();

			if (expiry && expiry < now) {
				await TokenStorage.clearToken();
				await ReduxStorage.clearState("auth_user");
				return { user: null, isAuthenticated: false, tokenExpiry: null };
			}

			const savedUser = await ReduxStorage.loadState<User>("auth_user");

			if (savedUser) {
				return { user: savedUser, isAuthenticated: true, tokenExpiry: expiry };
			}

			return { user: null, isAuthenticated: false, tokenExpiry: null };
		} catch (error) {
			return rejectWithValue("Auth initialization failed");
		}
	},
);

/**
 * OAuth login — called after the OAuth2 code exchange gives us an access token.
 * Fetches user profile and setup data (mirrors the old Login2 component).
 */
export const loginWithOAuth = createAsyncThunk(
	"auth/loginWithOAuth",
	async (accessToken: string, { rejectWithValue }) => {
		try {
			// 1. Save token
			await TokenStorage.saveToken(accessToken);
			const expiry = getTokenExpiry(accessToken);

			// 2. Fetch user profile
			const userResponse = await apiClient.get(
				"api/user/UserProfileMobileApp",
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			);

			// 3. Save user to storage
			await ReduxStorage.saveState("auth_user", userResponse);

			// 4. Fetch setup data in parallel (non-blocking — mirrors old app)
			const customerId =
				userResponse?.defaultCustomerId ||
				userResponse?.data?.defaultCustomerId;

			if (customerId) {
				fetchSetupDataInBackground(accessToken, customerId);
			}

			return {
				user: userResponse,
				token: accessToken,
				tokenExpiry: expiry,
			};
		} catch (error: any) {
			console.error("loginWithOAuth error:", error);
			return rejectWithValue(error.message || "Login failed");
		}
	},
);

/**
 * Legacy password-based login (kept for backwards compatibility).
 * Uses env vars for client_id / client_secret instead of hardcoded values.
 */
export const loginThunk = createAsyncThunk(
	"auth/login",
	async (
		credentials: { username: string; password: string },
		{ rejectWithValue },
	) => {
		try {
			const formData = new URLSearchParams({
				username: credentials.username,
				password: credentials.password,
				grant_type: "password",
				client_id: AuthConfig.clientId,
				client_secret: AuthConfig.clientSecret,
				scope: AuthConfig.scopes.join(" "),
			});

			const response = await apiClient.post(
				"connect/token",
				formData.toString(),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					useToken: false,
				},
			);

			if (response.access_token) {
				await TokenStorage.saveToken(response.access_token);
				const expiry = getTokenExpiry(response.access_token);

				const userResponse = await apiClient.get(
					"api/user/UserProfileMobileApp",
					{
						headers: { Authorization: `Bearer ${response.access_token}` },
					},
				);

				await ReduxStorage.saveState("auth_user", userResponse);

				return {
					user: userResponse,
					token: response.access_token,
					tokenExpiry: expiry,
				};
			}

			return rejectWithValue("Login failed");
		} catch (error: any) {
			return rejectWithValue(error.message || "Login failed");
		}
	},
);

/** Refresh / validate token when coming back online */
export const updateToken = createAsyncThunk(
	"auth/updateToken",
	async (_, { rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No token");

			// const expiry = getTokenExpiry(token);
			// if (expiry && expiry < Date.now()) {
			// 	await TokenStorage.clearToken();
			// 	await ReduxStorage.clearState("auth_user");
			// 	return rejectWithValue("Token expired");
			// }

			try {
				const userResponse: BUser = await apiClient.get(ENDPOINTS.USER.PROFIlE);
				await ReduxStorage.saveState("auth_user", userResponse);
				return {
					tokenUpdated: true,
					timestamp: Date.now(),
					user: userResponse,
				};
			} catch {
				return { tokenUpdated: false, timestamp: Date.now() };
			}
		} catch (error: any) {
			return rejectWithValue(error.message);
		}
	},
);

// ─── Background setup data fetch ──────────────────────────────────

async function fetchSetupDataInBackground(
	token: string,
	customerId: string,
): Promise<void> {
	const headers = { Authorization: `Bearer ${token}` };

	const safeGet = async (url: string, label: string) => {
		try {
			return await apiClient.get(url, { headers });
		} catch (error) {
			console.warn(`[${label}] fetch failed:`, error);
			return null;
		}
	};

	try {
		await Promise.allSettled([
			safeGet(`${ApiUrls.sign}sync/GetSetups/${customerId}`, "SignSetups"),
			safeGet(
				`${ApiUrls.field}TesFields/AppCollisionFields/${customerId}`,
				"CollisionFields",
			),
			safeGet(
				`${ApiUrls.auth}api/divisions/GetUserDivisionUI/${customerId}`,
				"Divisions",
			),
			safeGet(
				`${ApiUrls.trafficStudy}Setups/GetCustomerVehicleClassification/${customerId}`,
				"VehicleClassification",
			),
			safeGet(
				`${ApiUrls.setting}ClientGeneralSettings/${customerId}`,
				"GeneralSettings",
			),
			apiClient
				.post(
					`${ApiUrls.moduleOfModule}Sync/MobileApplication`,
					{ ClientModule: [] },
					{ headers },
				)
				.catch((e) => console.warn("[ModuleOfModule]", e)),
		]);
	} catch (error) {
		console.warn("Background setup fetch error:", error);
	}
}

// ─── Slice ─────────────────────────────────────────────────────────

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		logout: (state) => {
			state.user = null;
			state.isAuthenticated = false;
			state.isLoading = false;
			state.tokenExpiry = null;
			TokenStorage.clearToken();
			ReduxStorage.clearState("auth_user");
		},
	},
	extraReducers: (builder) => {
		builder
			// Initialize
			.addCase(initializeAuth.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(initializeAuth.fulfilled, (state, action) => {
				state.user = action.payload.user;
				state.isAuthenticated = action.payload.isAuthenticated;
				state.tokenExpiry = action.payload.tokenExpiry;
				state.isLoading = false;
			})
			.addCase(initializeAuth.rejected, (state) => {
				state.user = null;
				state.isAuthenticated = false;
				state.isLoading = false;
			})

			// OAuth login
			.addCase(loginWithOAuth.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(loginWithOAuth.fulfilled, (state, action) => {
				state.user = action.payload.user;
				state.isAuthenticated = true;
				state.tokenExpiry = action.payload.tokenExpiry;
				state.tokenLastUpdated = Date.now();
				state.isLoading = false;
			})
			.addCase(loginWithOAuth.rejected, (state) => {
				state.isLoading = false;
			})

			// Legacy password login
			.addCase(loginThunk.fulfilled, (state, action) => {
				state.user = action.payload.user;
				state.isAuthenticated = true;
				state.tokenExpiry = action.payload.tokenExpiry;
				state.tokenLastUpdated = Date.now();
			})

			// Token update
			.addCase(updateToken.fulfilled, (state, action) => {
				state.tokenLastUpdated = action.payload.timestamp;
				if (action.payload.user) {
					state.user = action.payload.user;
				}
			})
			.addCase(updateToken.rejected, (state) => {
				state.isAuthenticated = false;
			});
	},
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
