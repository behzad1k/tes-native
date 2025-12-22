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
