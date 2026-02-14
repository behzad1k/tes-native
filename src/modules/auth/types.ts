export interface LoginFormData {
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

export interface LoginForm {
	phoneNumber: string;
}

export interface LoginRequest {
	phoneNumber: string;
}

export interface VerifyRequest {
	code: string;
	token: string;
}

export interface LoginResponse {
	code: number;
	token: string;
}

/**
 * Shape of the decoded JWT token payload
 */
export interface TokenPayload {
	exp: number;
	sub: string;
	iss: string;
	aud: string | string[];
	scope?: string;
	[key: string]: any;
}
