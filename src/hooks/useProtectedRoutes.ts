import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../store/auth";
import { useEffect } from "react";

function useProtectedRoute() {
	const segments = useSegments();
	const router = useRouter();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isLoading = useAuthStore((state) => state.isLoading);

	useEffect(() => {
		if (isLoading) return;

		const inProtectedGroup = segments[0] === "(protected)";
		// router.replace("/(protected)/signs/");

		if (!isAuthenticated && inProtectedGroup) {
			router.replace("/(protected)/signs/");
		} else if (
			isAuthenticated &&
			!inProtectedGroup &&
			segments[0] !== "(global)"
		) {
			router.replace("/(protected)/signs");
		}
	}, [isAuthenticated, segments, isLoading]);
}

export default useProtectedRoute;
