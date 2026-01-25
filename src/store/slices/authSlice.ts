// store/slices/authSlice.ts
import { apiClient } from "@/src/services/api/apiClient";
import { User } from "@/src/types/models";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { TokenStorage, ReduxStorage } from "../persistence";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	tokenLastUpdated: number | null;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true,
	tokenLastUpdated: null,
};

// Initialize auth from storage
export const initializeAuth = createAsyncThunk(
	"auth/initialize",
	async (_, { rejectWithValue }) => {
		try {
			// 1. Check if token exists
			const token = await TokenStorage.getToken();

			if (!token) {
				return { user: null, isAuthenticated: false };
			}

			// 2. Load user data from storage
			const savedUser = await ReduxStorage.loadState<User>("auth_user");

			if (savedUser) {
				return { user: savedUser, isAuthenticated: true };
			}

			return { user: null, isAuthenticated: false };
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
			// API call to login
			const response = await apiClient.post("/auth/login", credentials);

			if (response.token) {
				// Save token securely
				await TokenStorage.saveToken(response.token);

				// Fetch user data
				const userResponse = await apiClient.get("/user");
				const user = userResponse.data;

				// Save user to storage
				await ReduxStorage.saveState("auth_user", user);

				return { user, token: response.token };
			}

			return rejectWithValue("Login failed");
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

// Update token when online
export const updateToken = createAsyncThunk(
	"auth/updateToken",
	async (_, { rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No token");

			// Verify token with backend
			const response = await apiClient.get("/auth/verify", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.valid) {
				// Optionally refresh token
				const newToken = response.newToken || token;
				await TokenStorage.saveToken(newToken);

				return { tokenUpdated: true, timestamp: Date.now() };
			}

			return rejectWithValue("Token invalid");
		} catch (error) {
			// Still allow offline access
			return { tokenUpdated: false, timestamp: Date.now() };
		}
	},
);

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setOfflineAuth: (state, action) => {
			state.user = action.payload.user;
			state.isAuthenticated = true;
			state.isLoading = false;
		},
		logout: (state) => {
			state.user = null;
			state.isAuthenticated = false;
			state.isLoading = false;
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
				state.isLoading = false;
			})
			.addCase(initializeAuth.rejected, (state) => {
				state.user = null;
				state.isAuthenticated = false;
				state.isLoading = false;
			})
			.addCase(updateToken.fulfilled, (state, action) => {
				state.tokenLastUpdated = action.payload.timestamp;
			});
	},
});

export const { setOfflineAuth, logout } = authSlice.actions;
export default authSlice.reducer;
