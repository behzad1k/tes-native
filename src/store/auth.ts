import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "@/src/configs/api/apiClient";
import ENDPOINTS from "@/src/configs/api/endpoints";

interface User {
	id: string;
	name: string;
	lastName: string;
	phoneNumber: string;
	role: string;
}

interface LoginRequest {
	phoneNumber: string;
}

interface LoginResponse {
	code: number;
	token: string;
}

interface AuthState {
	token: string | null;
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;

	// Actions
	setAuth: (token: string, user: User) => void;
	clearAuth: () => void;
	updateUser: (user: Partial<User>) => void;
	login: (credentials: LoginRequest) => Promise<boolean>;
	logout: () => Promise<boolean>;
	checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			user: null,
			isAuthenticated: false,
			isLoading: true,

			setAuth: (token, user) =>
				set({
					token,
					user,
					isAuthenticated: true,
				}),

			clearAuth: () =>
				set({
					token: null,
					user: null,
					isAuthenticated: false,
				}),

			updateUser: (userData) =>
				set((state) => ({
					user: state.user ? { ...state.user, ...userData } : null,
				})),

			login: async (credentials: LoginRequest) => {
				try {
					if (
						!credentials.phoneNumber ||
						credentials.phoneNumber.length !== 11
					) {
						throw new Error("Invalid phone number");
					}

					const response: LoginResponse = await apiClient.post(
						ENDPOINTS.AUTH.LOGIN,
						credentials,
						{ headers: { "skip-auth": true } },
					);

					if (response.token) {
						await AsyncStorage.setItem("token", response.token);

						// Fetch user data
						const userResponse = await apiClient.get<{
							code: number;
							data: User;
						}>(ENDPOINTS.USER.INDEX);

						set({
							token: response.token,
							user: userResponse.data,
							isAuthenticated: true,
						});

						return true;
					}

					return false;
				} catch (error) {
					console.error("Login error:", error);
					return false;
				}
			},

			logout: async () => {
				try {
					await AsyncStorage.clear();
					set({
						token: null,
						user: null,
						isAuthenticated: false,
					});
					return true;
				} catch (error) {
					console.error("Logout error:", error);
					return false;
				}
			},

			checkAuth: async () => {
				set({ isLoading: true });
				try {
					const token = await AsyncStorage.getItem("token");

					if (token) {
						// Verify token is valid by fetching user
						const userResponse = await apiClient.get<{
							code: number;
							data: User;
						}>(ENDPOINTS.USER.INDEX);

						set({
							token,
							user: userResponse.data,
							isAuthenticated: true,
							isLoading: false,
						});
					} else {
						set({ isLoading: false });
					}
				} catch (error) {
					console.error("Auth check error:", error);
					set({
						token: null,
						user: null,
						isAuthenticated: false,
						isLoading: false,
					});
				}
			},
		}),
		{
			name: "auth-storage",
			storage: createJSONStorage(() => AsyncStorage),
			// Only persist token and user, not isLoading
			partialize: (state) => ({
				token: state.token,
				user: state.user,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
);

// Initialize auth check on app start
useAuthStore.getState().checkAuth();
