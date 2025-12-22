export interface ApiClient {
	post<T>(url: string, data: any, config?: any): Promise<T>;
	get<T>(url: string, config?: any): Promise<T>;
	put<T>(url: string, data: any, config?: any): Promise<T>;
	delete<T>(url: string, config?: any): Promise<T>;
}

export interface StorageProvider {
	setItem(key: string, value: string): Promise<void>;
	getItem(key: string): Promise<string | null>;
	removeItem(key: string): Promise<void>;
}

export interface ServiceDependencies {
	apiClient: ApiClient;
	storage: StorageProvider;
}
