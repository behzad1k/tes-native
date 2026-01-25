import {
	LoginFormData,
	TokenResponse,
	UserProfile,
	ForgotPasswordRequest,
	AuthResponse,
} from "@/src/modules/auth/types";
import { ServiceDependencies } from "@/src/types/services";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class AuthServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
	) {
		super(message);
		this.name = "AuthServiceError";
	}
}

interface TokenData {
	exp: number;
	sub: string;
	[key: string]: any;
}

export class AuthService {
	constructor(private deps: ServiceDependencies) {}
	async login(credentials: LoginFormData): Promise<AuthResponse> {
		if (!credentials.username || !credentials.password) {
			throw new AuthServiceError("Username and password are required");
		}

		try {
			const formData = new URLSearchParams({
				username: credentials.username,
				password: credentials.password,
				grant_type: "password",
				client_id: "MainMobileApp",
				client_secret: "1f1df3dc-bbd6-41be-bb11-34a7bc47a937",
				scope: "TMC",
			});

			const response = await this.deps.apiClient.post<TokenResponse>(
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
				const tokenData = { exp: 1 };
				const expDate = new Date(tokenData.exp * 1000);

				await this.deps.storage.setItem("token", response.access_token);
				if (response.refresh_token) {
					await this.deps.storage.setItem(
						"refresh_token",
						response.refresh_token,
					);
				}

				const userProfile = await this.getUserProfile(response.access_token);

				// useAuthStore.getState().setAuth(response.access_token, {
				// 	id: userProfile.userId,
				// 	name: userProfile.firstName,
				// 	lastName: userProfile.lastName,
				// 	phoneNumber: userProfile.email, // Use email as phoneNumber for compatibility
				// 	role: "USER",
				// });

				await this.deps.storage.setItem(
					"userProfile",
					JSON.stringify(userProfile),
				);
				await this.deps.storage.setItem("expDate", expDate.toISOString());

				return {
					success: true,
					data: {
						token: response.access_token,
						user: userProfile,
					},
				};
			}

			return {
				success: false,
				message: "Login failed",
			};
		} catch (error: any) {
			console.error("Login error:", error);

			if (error.response?.status === 400) {
				throw new AuthServiceError("Username or Password is wrong!");
			}

			throw new AuthServiceError(error.message || "Login failed");
		}
	}
	async getUserProfile(token: string): Promise<UserProfile> {
		try {
			const response = await this.deps.apiClient.get<UserProfile>(
				"api/user/UserProfileMobileApp",
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			return response;
		} catch (error) {
			console.error("Error fetching user profile:", error);
			throw new AuthServiceError("Failed to fetch user profile");
		}
	}

	async logout(): Promise<boolean> {
		try {
			await AsyncStorage.multiRemove([
				"token",
				"refresh_token",
				"userProfile",
				"expDate",
			]);
			// useAuthStore.getState().clearAuth();
			return true;
		} catch (error) {
			console.error("Logout error:", error);
			return false;
		}
	}

	async isAuthenticated(): Promise<boolean> {
		try {
			const token = await this.deps.storage.getItem("token");
			if (!token) return false;

			// Check if token is expired
			const expDateStr = await this.deps.storage.getItem("expDate");
			if (expDateStr) {
				const expDate = new Date(expDateStr);
				if (expDate < new Date()) {
					// Token expired, try to refresh
					return await this.refreshToken();
				}
			}

			return true;
		} catch (error) {
			console.error("Error checking authentication:", error);
			return false;
		}
	}

	async refreshToken(): Promise<boolean> {
		try {
			const refreshToken = await this.deps.storage.getItem("refresh_token");
			if (!refreshToken) return false;

			const formData = new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: refreshToken,
				client_id: "MainMobileApp",
				client_secret: "1f1df3dc-bbd6-41be-bb11-34a7bc47a937",
			});

			const response = await this.deps.apiClient.post<TokenResponse>(
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
				const tokenData = { exp: 1 };
				const expDate = new Date(tokenData.exp * 1000);

				await this.deps.storage.setItem("token", response.access_token);
				await this.deps.storage.setItem("expDate", expDate.toISOString());

				if (response.refresh_token) {
					await this.deps.storage.setItem(
						"refresh_token",
						response.refresh_token,
					);
				}

				return true;
			}

			return false;
		} catch (error) {
			console.error("Token refresh error:", error);
			await this.logout();
			return false;
		}
	}

	async forgotPassword(request: ForgotPasswordRequest): Promise<boolean> {
		try {
			await this.deps.apiClient.get(
				`api/user/ForgotPassword/${request.email}`,
				{
					headers: { "skip-auth": true },
				},
			);
			return true;
		} catch (error) {
			console.error("Forgot password error:", error);
			return false;
		}
	}

	async registerPushToken(pushToken: string): Promise<void> {
		try {
			const token = await this.deps.storage.getItem("token");
			if (!token) return;

			await this.deps.apiClient.get(
				`api/user/SetExpoNotificationToken/${pushToken}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
		} catch (error) {
			console.error("Error registering push token:", error);
		}
	}
}
