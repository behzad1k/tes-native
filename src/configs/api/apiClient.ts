import { API_CONFIG } from "@/src/configs/api/api";
import { ApiResponse, ApiError, RequestConfig } from "@/src/types/api";
import { StorageService } from "@/src/utils/storage";

class ApiClient {
	private baseURL: string;
	private defaultHeaders: HeadersInit;

	constructor(baseURL: string) {
		this.baseURL = baseURL;
		this.defaultHeaders = {
			"Content-Type": "application/json",
			Accept: "application/json",
		};
	}

	private async getAuthHeaders(): Promise<HeadersInit> {
		const token = await StorageService.getItem("token");
		if (token) {
			return {
				...this.defaultHeaders,
				Authorization: `Bearer ${token}`,
			};
		}
		return this.defaultHeaders;
	}

	private async buildRequest(
		endpoint: string,
		config: RequestConfig = {},
	): Promise<Request> {
		const { skipAuth = false, baseURL, ...requestConfig } = config;

		const url = `${baseURL || this.baseURL}${endpoint}`;

		const headers = skipAuth
			? this.defaultHeaders
			: await this.getAuthHeaders();

		const finalConfig: RequestInit = {
			...requestConfig,
			headers: {
				...headers,
				...requestConfig.headers,
			},
		};
		return new Request(url, finalConfig);
	}

	private async handleResponse<T>(response: Response): Promise<T> {
		const contentType = response.headers.get("content-type");
		if (!response.ok) {
			let errorData: any;

			if (contentType?.includes("application/json")) {
				errorData = await response.json();
				return errorData;
			} else {
				errorData = { message: await response.text() };
			}

			const apiError: ApiError = {
				code: response.status,
				message: errorData.message || `HTTP ${response.status}`,
				data: errorData,
			};

			throw apiError;
		}

		if (contentType?.includes("application/json")) {
			return await response.json();
		}

		const text = await response.text();
		return {
			code: response.status,
			data: text,
		} as T;
	}

	async request<T = any>(
		endpoint: string,
		config: RequestConfig = {},
	): Promise<T> {
		try {
			const request = await this.buildRequest(endpoint, config);
			const response = await fetch(request);
			return await this.handleResponse<T>(response);
		} catch (error) {
			if (error instanceof Error && !(error as any).code) {
				const apiError: ApiError = {
					code: 0,
					message: error.message || "Network error",
				};
				throw apiError;
			}
			throw error;
		}
	}

	async get<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
		if (config?.query) {
			if (endpoint.at(endpoint.length - 1) == "/") {
				endpoint = endpoint.substring(0, endpoint.length - 1) + "?";
			}
			endpoint += new URLSearchParams(config?.query).toString();
		}
		console.log(endpoint);
		return this.request<T>(endpoint, { ...config, method: "GET" });
	}

	async post<T = any>(
		endpoint: string,
		data?: any,
		config?: RequestConfig,
	): Promise<T> {
		return this.request<T>(endpoint, {
			...config,
			method: "POST",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async put<T = any>(
		endpoint: string,
		data?: any,
		config?: RequestConfig,
	): Promise<T> {
		return this.request<T>(endpoint, {
			...config,
			method: "PUT",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async patch<T = any>(
		endpoint: string,
		data?: any,
		config?: RequestConfig,
	): Promise<T> {
		return this.request<T>(endpoint, {
			...config,
			method: "PATCH",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
		return this.request<T>(endpoint, { ...config, method: "DELETE" });
	}

	setBaseURL(baseURL: string): void {
		this.baseURL = baseURL;
	}

	getBaseURL(): string {
		return this.baseURL;
	}
}

export const apiClient = new ApiClient(
	API_CONFIG.BASE_URL || "http://localhost:9000",
);

export { ApiClient };
