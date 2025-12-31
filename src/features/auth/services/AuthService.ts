import ENDPOINTS from "@/src/configs/api/endpoints";
import { LoginRequest, LoginResponse } from "@/src/features/auth/authTypes";
import { ServiceDependencies } from "@/src/types/services";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/src/store/auth";

export class AuthServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
	) {
		super(message);
		this.name = "AuthServiceError";
	}
}

export class AuthService {
	constructor(private deps: ServiceDependencies) {}

	async login(credentials: LoginRequest): Promise<boolean> {
		if (!credentials.phoneNumber) {
			throw new AuthServiceError("Phone number is required");
		} else if (credentials.phoneNumber.length !== 11) {
			throw new AuthServiceError("Phone number must be 11 digits");
		}

		try {
			const response: LoginResponse = await this.deps.apiClient.post(
				ENDPOINTS.AUTH.LOGIN,
				credentials,
				{ skipAuth: true },
			);

			if (response.token) {
				await this.deps.storage.setItem("token", response.token);
				// Store auth in Zustand
				useAuthStore.getState().setAuth(response.token, {
					id: "",
					name: "",
					lastName: "",
					phoneNumber: credentials.phoneNumber,
					role: "USER",
				});
				return true;
			}

			return false;
		} catch (error) {
			console.error("Login error:", error);
			throw new AuthServiceError("Login failed");
		}
	}

	async logout(): Promise<boolean> {
		try {
			await AsyncStorage.clear();
			useAuthStore.getState().clearAuth();
			return true;
		} catch (error) {
			console.error("Logout error:", error);
			return false;
		}
	}

	async isAuthenticated(): Promise<boolean> {
		try {
			const token = await this.deps.storage.getItem("token");
			return !!token;
		} catch (error) {
			console.error("Error checking authentication:", error);
			return false;
		}
	}
}
