import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
	fetchWorkOrders,
	fetchVehicleClassifications,
	loadSavedTrafficData,
} from "@/src/store/slices/trafficCountSlice";
import { ReduxStorage } from "@/src/store/persistence";

/**
 * Hook to initialize traffic count data on app startup
 *
 * This hook should be called once when the app starts:
 * 1. Loads persisted data from storage
 * 2. Fetches fresh data from backend
 * 3. Merges with local unsynced data
 *
 * Usage:
 * ```tsx
 * const App = () => {
 *   const { isInitialized, error } = useTrafficCountInit(customerId);
 *   // ...
 * };
 * ```
 */
export const useTrafficCountInit = (customerId?: string) => {
	const dispatch = useAppDispatch();
	const initialized = useRef(false);

	const isLoading = useAppSelector((state) => state.trafficCount.isLoading);
	const syncError = useAppSelector((state) => state.trafficCount.syncError);

	const initializeTrafficCount = useCallback(async () => {
		if (initialized.current) return;
		initialized.current = true;

		try {
			// Step 1: Load persisted data from storage
			const savedData: any = await ReduxStorage.loadState("traffic_count_data");
			if (savedData) {
				dispatch(
					loadSavedTrafficData({
						workOrders: savedData.workOrders || [],
						vehicleClassifications: savedData.vehicleClassifications || [],
						lastFetched: savedData.lastFetched || null,
					}),
				);
			}

			// Step 2: Fetch fresh data from backend
			// This will merge with local unsynced data
			await dispatch(fetchWorkOrders()).unwrap();

			// Step 3: If we have a customerId and no classifications, fetch them
			if (customerId) {
				await dispatch(fetchVehicleClassifications(customerId)).unwrap();
			}

			console.log("Traffic count data initialized successfully");
		} catch (error) {
			console.error("Failed to initialize traffic count data:", error);
		}
	}, [dispatch, customerId]);

	useEffect(() => {
		initializeTrafficCount();
	}, [initializeTrafficCount]);

	return {
		isInitialized: !isLoading && initialized.current,
		isLoading,
		error: syncError,
		retry: () => {
			initialized.current = false;
			initializeTrafficCount();
		},
	};
};

/**
 * Hook to refresh traffic count data
 * Can be used for pull-to-refresh functionality
 */
export const useTrafficCountRefresh = () => {
	const dispatch = useAppDispatch();
	const isLoading = useAppSelector((state) => state.trafficCount.isLoading);

	const refresh = useCallback(async () => {
		try {
			await dispatch(fetchWorkOrders()).unwrap();
			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message || error };
		}
	}, [dispatch]);

	return {
		refresh,
		isRefreshing: isLoading,
	};
};

export default useTrafficCountInit;
