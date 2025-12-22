export interface ApiResponse<T = any> {
  code: number;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
  data?: any;
}

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  baseURL?: string;
  query?: string;
}
