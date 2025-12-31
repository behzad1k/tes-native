// Override undici types with React Native types
declare module "undici-types" {
	export {};
}

// Ensure we're using React Native's fetch types
declare global {
	// Re-export React Native fetch types
	type HeadersInit = Headers | string[][] | Record<string, string>;
	type BodyInit =
		| string
		| Blob
		| ArrayBufferView
		| ArrayBuffer
		| FormData
		| URLSearchParams
		| ReadableStream<Uint8Array>
		| ArrayBufferView<ArrayBufferLike>;
	type RequestInit = {
		method?: string;
		headers?: HeadersInit;
		body?: BodyInit;
		mode?: RequestMode;
		credentials?: RequestCredentials;
		cache?: RequestCache;
		redirect?: RequestRedirect;
		referrer?: string;
		referrerPolicy?: ReferrerPolicy;
		integrity?: string;
		keepalive?: boolean;
		signal?: AbortSignal | null;
	};
}

export {};
