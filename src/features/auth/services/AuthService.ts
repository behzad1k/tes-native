import ENDPOINTS from "@/src/configs/api/endpoints";
import { translate as t } from "@/src/configs/translations/staticTranslations";
import { LoginRequest, LoginResponse } from "@/src/features/auth/authTypes";
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

export type AuthEventType =
	| "login"
	| "logout"
	| "tokenExpired"
	| "authStateChanged";
export type AuthEventCallback = (eventType: AuthEventType, data?: any) => void;

export class AuthService {
	private authEventListeners: AuthEventCallback[] = [];

	constructor(private deps: ServiceDependencies) {}

	onAuthStateChange(callback: AuthEventCallback): () => void {
		this.authEventListeners.push(callback);

		return () => {
			const index = this.authEventListeners.indexOf(callback);
			if (index > -1) {
				this.authEventListeners.splice(index, 1);
			}
		};
	}

	private emitAuthEvent(eventType: AuthEventType, data?: any): void {
		this.authEventListeners.forEach((callback) => {
			try {
				callback(eventType, data);
			} catch (error) {
				console.error("Error in auth event callback:", error);
			}
		});
	}

	async login(credentials: LoginRequest): Promise<boolean> {
		if (!credentials.phoneNumber) {
			throw new AuthServiceError(t("validation.phoneNumberNotSet"));
		} else if (credentials.phoneNumber.length != 11) {
			throw new AuthServiceError(t("validation.phoneNumberInvalid"));
		}
		try {
			const response: LoginResponse = await this.deps.apiClient.post(
				ENDPOINTS.AUTH.LOGIN,
				credentials,
				{ skipAuth: true },
			);
			return true;
		} catch (error) {
			console.error("Login error:", error);
			throw new AuthServiceError("Login failed");
		}
	}

	async logout(): Promise<boolean> {
		try {
			await AsyncStorage.clear();

			this.emitAuthEvent("logout");
			this.emitAuthEvent("authStateChanged", { isAuthenticated: false });

			return true;
		} catch (error) {
			console.error("Logout error:", error);
			return false;
		}
	}

	async isAuthenticated(): Promise<boolean> {
		try {
			const token = await this.deps.storage.getItem("token");

			if (!token) {
				return false;
			}

			return true;
		} catch (error) {
			console.error("Error checking authentication:", error);
			return false;
		}
	}

	private async handleInvalidToken(): Promise<void> {
		this.emitAuthEvent("tokenExpired");
		this.emitAuthEvent("authStateChanged", { isAuthenticated: false });
	}
}
