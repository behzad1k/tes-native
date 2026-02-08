import { apiClient } from "@/src/services/api/apiClient";
import { User } from "@/src/types/models";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { TokenStorage, ReduxStorage } from "../persistence";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	tokenLastUpdated: number | null;
	tokenExpiry: number | null; // ADD THIS
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true,
	tokenLastUpdated: null,
	tokenExpiry: null, // ADD THIS
};

// Helper to decode JWT and get expiry
const getTokenExpiry = (token: string): number | null => {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
	} catch (error) {
		console.error("Error decoding token:", error);
		return null;
	}
};

// Initialize auth from storage
export const initializeAuth = createAsyncThunk(
	"auth/initialize",
	async (_, { rejectWithValue }) => {
		try {
			// 1. Check if token exists
			const token = await TokenStorage.getToken();

			if (!token) {
				return { user: null, isAuthenticated: false, tokenExpiry: null };
			}

			// 2. Check token expiry
			const expiry = getTokenExpiry(token);
			const now = Date.now();

			if (expiry && expiry < now) {
				// Token expired
				await TokenStorage.clearToken();
				await ReduxStorage.clearState("auth_user");
				return { user: null, isAuthenticated: false, tokenExpiry: null };
			}

			// 3. Load user data from storage
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

// Login - saves token and user
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
				client_id: "MainMobileApp",
				client_secret: "1f1df3dc-bbd6-41be-bb11-34a7bc47a937",
				scope: "TMC",
			});

			const response = await apiClient.post(
				"connect/token",
				formData.toString(),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						"skip-auth": true,
					},
				},
			);

			if (response.access_token) {
				// Save token securely
				await TokenStorage.saveToken(response.access_token);

				// Get token expiry
				const expiry = getTokenExpiry(response.access_token);

				// Fetch user data
				const userResponse = await apiClient.get(
					"api/user/UserProfileMobileApp",
					{
						headers: { Authorization: `Bearer ${response.access_token}` },
					},
				);

				// Save user to storage
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

// Update token when online
export const updateToken = createAsyncThunk(
	"auth/updateToken",
	async (_, { getState, rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No token");

			// Check if token is still valid
			const expiry = getTokenExpiry(token);
			const now = Date.now();

			if (expiry && expiry < now) {
				// Token expired, need to re-login
				await TokenStorage.clearToken();
				await ReduxStorage.clearState("auth_user");
				return rejectWithValue("Token expired");
			}

			// Optionally refresh user data
			try {
				const userResponse = await apiClient.get(
					"api/user/UserProfileMobileApp",
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);

				await ReduxStorage.saveState("auth_user", userResponse);

				return {
					tokenUpdated: true,
					timestamp: Date.now(),
					user: userResponse,
				};
			} catch (error) {
				// If offline, just return success with existing data
				return { tokenUpdated: false, timestamp: Date.now() };
			}
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

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
			.addCase(loginThunk.fulfilled, (state, action) => {
				state.user = action.payload.user;
				state.isAuthenticated = true;
				state.tokenExpiry = action.payload.tokenExpiry;
				state.tokenLastUpdated = Date.now();
			})
			.addCase(updateToken.fulfilled, (state, action) => {
				state.tokenLastUpdated = action.payload.timestamp;
				if (action.payload.user) {
					state.user = action.payload.user;
				}
			})
			.addCase(updateToken.rejected, (state) => {
				// Token update failed, user will be logged out by app initialization
				state.isAuthenticated = false;
			});
	},
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
