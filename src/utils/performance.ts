import React from "react";
import { useEffect, useRef } from "react";

/**
 * Debounce hook for search inputs
 */
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

/**
 * Throttle hook for scroll events
 */
export function useThrottle<T>(value: T, limit: number): T {
	const [throttledValue, setThrottledValue] = React.useState<T>(value);
	const lastRan = useRef(Date.now());

	useEffect(() => {
		const handler = setTimeout(
			() => {
				if (Date.now() - lastRan.current >= limit) {
					setThrottledValue(value);
					lastRan.current = Date.now();
				}
			},
			limit - (Date.now() - lastRan.current),
		);

		return () => {
			clearTimeout(handler);
		};
	}, [value, limit]);

	return throttledValue;
}
