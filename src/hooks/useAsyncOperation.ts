import { useState, useCallback, useRef } from "react";
import { useLoading } from "@/src/components/contexts/LoadingContext";

interface UseAsyncOperationOptions {
	useGlobalLoading?: boolean;
	loadingMessage?: string;
	onSuccess?: (result: any) => void;
	onError?: (error: Error) => void;
	onFinally?: () => void;
	showErrorAlert?: boolean;
	errorTitle?: string;
	maxRetries?: number;
	retryDelay?: number;
	cancelable?: boolean;
}

interface UseAsyncOperationReturn {
	execute: (asyncFunction: () => Promise<any>) => Promise<any>;
	loading: boolean;
	error: Error | null;
	data: any;
	retry: () => Promise<void>;
	cancel: () => void;
	reset: () => void;
}

export const useAsyncOperation = (
	options: UseAsyncOperationOptions = {},
): UseAsyncOperationReturn => {
	const {
		useGlobalLoading = false,
		loadingMessage,
		onSuccess,
		onError,
		onFinally,
		showErrorAlert = false,
		errorTitle = "Error",
		maxRetries = 0,
		retryDelay = 10000,
		cancelable = false,
	} = options;

	const [localLoading, setLocalLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [data, setData] = useState<any>(null);

	const cancelRef = useRef<boolean>(false);
	const lastAsyncFunctionRef = useRef<(() => Promise<any>) | null>(null);
	const retryCountRef = useRef<number>(0);

	const { showLoading, hideLoading } = useLoading();

	const reset = useCallback(() => {
		setError(null);
		setData(null);
		retryCountRef.current = 0;
		cancelRef.current = false;
	}, []);

	const cancel = useCallback(() => {
		if (cancelable) {
			cancelRef.current = true;
			if (useGlobalLoading) {
				hideLoading();
			} else {
				setLocalLoading(false);
			}
		}
	}, [cancelable, useGlobalLoading, hideLoading]);

	const executeWithRetries = useCallback(
		async (asyncFunction: () => Promise<any>, isRetry: boolean = false) => {
			cancelRef.current = false;

			if (!isRetry) {
				setError(null);
				retryCountRef.current = 0;
			}

			try {
				if (useGlobalLoading) {
					showLoading(loadingMessage);
				} else {
					setLocalLoading(true);
				}

				let lastError: Error | null = null;
				let currentRetry = 0;

				while (currentRetry <= maxRetries) {
					try {
						if (cancelable && cancelRef.current) {
							throw new Error("Operation cancelled");
						}

						const result = await asyncFunction();

						if (cancelable && cancelRef.current) {
							throw new Error("Operation cancelled");
						}

						setData(result);
						retryCountRef.current = 0;
						if (onSuccess) {
							onSuccess(result);
						}
						return result;
					} catch (err) {
						lastError =
							err instanceof Error ? err : new Error("Unknown error occurred");

						if (lastError.message === "Operation cancelled") {
							throw lastError;
						}

						currentRetry++;
						retryCountRef.current = currentRetry;

						if (currentRetry <= maxRetries) {
							await new Promise((resolve) => setTimeout(resolve, retryDelay));
						}
					}
				}

				throw lastError;
			} catch (err) {
				const error =
					err instanceof Error
						? err
						: new Error("An unexpected error occurred");
				setError(error);

				if (onError) {
					onError(error);
				}

				if (showErrorAlert && !cancelable) {
					console.error(`${errorTitle}:`, error.message);
				}

				throw error;
			} finally {
				if (useGlobalLoading) {
					hideLoading();
				} else {
					setLocalLoading(false);
				}

				if (onFinally) {
					onFinally();
				}
			}
		},
		[
			useGlobalLoading,
			loadingMessage,
			showLoading,
			hideLoading,
			onSuccess,
			onError,
			onFinally,
			showErrorAlert,
			errorTitle,
			maxRetries,
			retryDelay,
			cancelable,
		],
	);

	const execute = useCallback(
		async (asyncFunction: () => Promise<any>) => {
			lastAsyncFunctionRef.current = asyncFunction;
			return executeWithRetries(asyncFunction, false);
		},
		[executeWithRetries],
	);

	const retry = useCallback(async () => {
		if (
			lastAsyncFunctionRef.current &&
			error &&
			retryCountRef.current < maxRetries
		) {
			await executeWithRetries(lastAsyncFunctionRef.current, true);
		}
	}, [executeWithRetries, error, maxRetries]);

	return {
		execute,
		loading: useGlobalLoading ? false : localLoading,
		error,
		data,
		retry,
		cancel,
		reset,
	};
};
