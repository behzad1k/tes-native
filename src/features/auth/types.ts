export interface LoginCredentials {
	username: string;
	password: string;
}

export interface TokenResponse {
	access_token: string;
	refresh_token?: string;
	token_type: string;
	expires_in: number;
	scope?: string;
}

export interface UserProfile {
	userId: string;
	email: string;
	lastName: string;
	firstName: string;
	defaultCustomerName: string;
	defaultCustomerId: string;
	permissions: string[];
	userName: string;
}

export interface AuthState {
	token: string | null;
	refreshToken: string | null;
	user: UserProfile | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	expDate: Date | null;
}

export interface ForgotPasswordRequest {
	email: string;
}

export interface AuthResponse {
	success: boolean;
	message?: string;
	data?: {
		token: string;
		user: UserProfile;
	};
}
