import { AxiosRequestConfig } from "axios";

export interface ApiResponse<T = any> {
	code: number;
	data: T;
}

export interface ApiError {
	code: number;
	message: string;
	data?: any;
}

export interface RequestConfig extends AxiosRequestConfig {
	skipAuth?: boolean;
}
