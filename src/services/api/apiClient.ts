import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
	/** When true (default), the stored Bearer token is attached automatically. */
	useToken?: boolean;
	headers?: Record<string, string>;
	/** Query-string params — appended to the URL. */
	params?: Record<string, string | number | boolean>;
	/** Request timeout in ms (default: 30 000). */
	timeout?: number;
}

interface ApiClientConfig {
	/** Base URL prepended to every relative path. */
	baseURL?: string;
	/** Default timeout in ms. */
	timeout?: number;
	/** Default headers merged into every request. */
	defaultHeaders?: Record<string, string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const TOKEN_STORAGE_KEY = "@auth_token";

async function getStoredToken(): Promise<string | null> {
	try {
		return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
	} catch {
		return null;
	}
}

function buildUrl(
	base: string,
	path: string,
	params?: Record<string, string | number | boolean>,
): string {
	// If path is already a full URL, use it as-is
	const url = /^https?:\/\//i.test(path)
		? path
		: `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

	if (params && Object.keys(params).length > 0) {
		const qs = new URLSearchParams(
			Object.entries(params).map(([k, v]) => [k, String(v)]),
		).toString();
		return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
	}

	return url;
}

// ─── Client factory ──────────────────────────────────────────────────

function createApiClient(config: ApiClientConfig = {}) {
	const {
		baseURL = "",
		timeout: defaultTimeout = 30_000,
		defaultHeaders = {},
	} = config;

	/**
	 * Core request function.
	 *
	 * Usage:
	 *   apiClient('https://endpoint.com/')                          // GET, with token
	 *   apiClient('users/me')                                       // GET relative to baseURL, with token
	 *   apiClient('connect/token', { useToken: false })             // GET, no token
	 *   apiClient.post('items', { name: 'x' })                     // POST JSON, with token
	 *   apiClient.get('public/health', { useToken: false })         // GET, no token
	 */
	async function apiClient<T = any>(
		path: string,
		options: RequestOptions = {},
	): Promise<T> {
		return request<T>("GET", path, undefined, options);
	}

	async function request<T = any>(
		method: HttpMethod,
		path: string,
		body?: unknown,
		options: RequestOptions = {},
	): Promise<T> {
		const {
			useToken = true,
			headers = {},
			params,
			timeout = defaultTimeout,
			...rest
		} = options;

		// ── Build headers ────────────────────────────────────────────
		const mergedHeaders: Record<string, string> = {
			...defaultHeaders,
			...headers,
		};

		// Auto-attach token when useToken is true
		if (useToken && !mergedHeaders["Authorization"]) {
			const token = await getStoredToken();
			if (token) {
				mergedHeaders["Authorization"] = `Bearer ${token}`;
			}
		}

		// Default Content-Type for JSON bodies
		if (body !== undefined && !mergedHeaders["Content-Type"]) {
			if (typeof body === "string") {
				// Likely form-encoded — caller should set Content-Type explicitly
			} else {
				mergedHeaders["Content-Type"] = "application/json";
			}
		}

		// ── Build URL ────────────────────────────────────────────────
		const url = buildUrl(baseURL, path, params);

		// ── Timeout via AbortController ──────────────────────────────
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(url, {
				method,
				headers: mergedHeaders,
				body:
					body === undefined
						? undefined
						: typeof body === "string"
							? body
							: JSON.stringify(body),
				signal: controller.signal,
				...rest,
			});

			clearTimeout(timer);

			// ── Handle non-2xx ───────────────────────────────────────
			if (!response.ok) {
				let errorBody: string | undefined;
				try {
					errorBody = await response.text();
				} catch {}

				const error = new ApiError(
					`${method} ${url} failed with status ${response.status}`,
					response.status,
					errorBody,
				);
				throw error;
			}

			// ── Parse response ───────────────────────────────────────
			const contentType = response.headers.get("Content-Type") || "";

			if (response.status === 204 || contentType.length === 0) {
				return undefined as T;
			}

			if (contentType.includes("application/json")) {
				return (await response.json()) as T;
			}

			return (await response.text()) as unknown as T;
		} catch (error) {
			clearTimeout(timer);

			if (error instanceof ApiError) throw error;

			if ((error as Error).name === "AbortError") {
				throw new ApiError(`Request timed out after ${timeout}ms`, 0);
			}

			throw new ApiError(
				(error as Error).message || "Network request failed",
				0,
			);
		}
	}

	// ── Convenience methods ──────────────────────────────────────────

	apiClient.get = <T = any>(path: string, options?: RequestOptions) =>
		request<T>("GET", path, undefined, options);

	apiClient.post = <T = any>(
		path: string,
		body?: unknown,
		options?: RequestOptions,
	) => request<T>("POST", path, body, options);

	apiClient.put = <T = any>(
		path: string,
		body?: unknown,
		options?: RequestOptions,
	) => request<T>("PUT", path, body, options);

	apiClient.patch = <T = any>(
		path: string,
		body?: unknown,
		options?: RequestOptions,
	) => request<T>("PATCH", path, body, options);

	apiClient.delete = <T = any>(path: string, options?: RequestOptions) =>
		request<T>("DELETE", path, undefined, options);

	apiClient.getBaseURL = () => baseURL;

	return apiClient;
}

// ─── Error class ─────────────────────────────────────────────────────

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public body?: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

// ─── Default instance ───────────────────────────────────────────────

export const apiClient = createApiClient({
	timeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 30000,
	defaultHeaders: {
		Accept: "application/json",
	},
});

export { createApiClient };
export type { RequestOptions, ApiClientConfig };
