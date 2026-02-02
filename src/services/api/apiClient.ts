import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_CONFIG } from "@/src/services/api/api";
import { ApiResponse, ApiError } from "@/src/types/api";
import { StorageService } from "@/src/utils/storage";

class ApiClient {
	private client: AxiosInstance;

	constructor(baseURL: string) {
		this.client = axios.create({
			baseURL,
			timeout: API_CONFIG.TIMEOUT,
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		});

		this.setupInterceptors();
	}

	private setupInterceptors() {
		this.client.interceptors.request.use(
			async (config) => {
				const token = await StorageService.getItem<string>("token");
				if (token && !config.headers["skip-auth"]) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				delete config.headers["skip-auth"];
				return config;
			},
			(error) => Promise.reject(error),
		);

		this.client.interceptors.response.use(
			(response) => response,
			(error) => {
				const apiError: ApiError = {
					code: error.response?.status || 0,
					message:
						error.response?.data?.message || error.message || "Network error",
					data: error.response?.data,
				};
				return Promise.reject(apiError);
			},
		);
	}

	async request<T = any>(config: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await this.client.request(config);
		return response.data;
	}

	async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "GET", url });
	}

	async post<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig,
	): Promise<T> {
		return this.request<T>({ ...config, method: "POST", url, data });
	}

	async put<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig,
	): Promise<T> {
		return this.request<T>({ ...config, method: "PUT", url, data });
	}

	async patch<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig,
	): Promise<T> {
		return this.request<T>({ ...config, method: "PATCH", url, data });
	}

	async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "DELETE", url });
	}

	setBaseURL(baseURL: string): void {
		this.client.defaults.baseURL = baseURL;
	}

	getBaseURL(): string {
		return this.client.defaults.baseURL || "";
	}
}

export const apiClient = new ApiClient(
	API_CONFIG.BASE_URL || "http://localhost:9001",
);

export { ApiClient };
