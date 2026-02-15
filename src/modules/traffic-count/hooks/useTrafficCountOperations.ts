import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
	fetchWorkOrders,
	fetchVehicleClassifications,
	syncTrafficCountData,
	updateWorkOrderStatus,
	updateWorkOrderLocally,
	addCountToWorkOrder,
	updateCountMovements,
	removeLastCountFromWorkOrder,
	markWorkOrderSynced,
	clearSyncError,
	calculateSlotTime,
} from "@/src/store/slices/trafficCountSlice";
import {
	TrafficCountWorkOrder,
	TrafficCount,
	VehicleClassification,
	WorkOrderStatus,
	SyncStatusType,
} from "../types";

/**
 * Generate UUID (same as old app's broofa function)
 */
const generateUUID = (): string => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

/**
 * Hook for traffic count operations
 * Provides all actions and selectors for the traffic count module
 */
export const useTrafficCountOperations = () => {
	const dispatch = useAppDispatch();

	// Selectors
	const workOrders = useAppSelector((state) => state.trafficCount.workOrders);
	const vehicleClassifications = useAppSelector(
		(state) => state.trafficCount.vehicleClassifications,
	);
	const isLoading = useAppSelector((state) => state.trafficCount.isLoading);
	const isSyncing = useAppSelector((state) => state.trafficCount.isSyncing);
	const lastFetched = useAppSelector((state) => state.trafficCount.lastFetched);
	const syncError = useAppSelector((state) => state.trafficCount.syncError);

	// ─── Fetch Operations ──────────────────────────────────────────

	/**
	 * Refresh work orders from backend
	 * Preserves local unsynced data
	 */
	const refreshWorkOrders = useCallback(async () => {
		try {
			await dispatch(fetchWorkOrders()).unwrap();
			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message || error };
		}
	}, [dispatch]);

	/**
	 * Fetch vehicle classifications
	 * Called on app startup
	 */
	const loadVehicleClassifications = useCallback(
		async (customerId: string) => {
			try {
				await dispatch(fetchVehicleClassifications(customerId)).unwrap();
				return { success: true };
			} catch (error: any) {
				return { success: false, error: error.message || error };
			}
		},
		[dispatch],
	);

	// ─── Sync Operations ───────────────────────────────────────────

	/**
	 * Sync local data to backend
	 * Mirrors old app's postAppData function
	 */
	const syncData = useCallback(async () => {
		try {
			const result = await dispatch(syncTrafficCountData()).unwrap();
			return {
				success: true,
				syncedCount: result.syncedCount,
			};
		} catch (error: any) {
			return { success: false, error: error.message || error };
		}
	}, [dispatch]);

	// ─── Work Order Operations ─────────────────────────────────────

	/**
	 * Change work order status
	 */
	const changeWorkOrderStatus = useCallback(
		(id: string, status: WorkOrderStatus) => {
			dispatch(updateWorkOrderStatus({ id, status }));
		},
		[dispatch],
	);

	/**
	 * Update work order locally
	 */
	const updateWorkOrder = useCallback(
		(workOrder: TrafficCountWorkOrder) => {
			dispatch(updateWorkOrderLocally(workOrder));
		},
		[dispatch],
	);

	/**
	 * Get work order by ID
	 */
	const getWorkOrderById = useCallback(
		(id: string) => {
			return workOrders.find((wo) => wo.id === id || wo.studyId === id);
		},
		[workOrders],
	);

	// ─── Count Operations ──────────────────────────────────────────

	/**
	 * Add a new count to a work order
	 * Creates a new count entry for the current time slot
	 */
	const addCount = useCallback(
		(
			workOrderId: string,
			movementKey: string,
			classificationId: string,
			classificationName: string,
			location: { lat: number; long: number },
			userId: string,
			slot: number,
		) => {
			const countId = generateUUID();
			const slotTime = calculateSlotTime(slot);

			const newCount: TrafficCount = {
				id: countId,
				siteId: workOrderId,
				isSynced: false,
				videoId: "",
				lat: location.lat,
				long: location.long,
				userId,
				dateTime: slotTime,
				slot,
				movements: {
					[movementKey]: {
						[classificationId]: 1,
					},
				},
				classificationId,
				classificationName,
			};

			dispatch(addCountToWorkOrder({ workOrderId, count: newCount }));
			return countId;
		},
		[dispatch],
	);

	/**
	 * Add count to existing time slot
	 * If a count already exists for this time slot, increment it
	 */
	const addCountToSlot = useCallback(
		(
			workOrderId: string,
			existingCountId: string,
			movementKey: string,
			classificationId: string,
		) => {
			dispatch(
				updateCountMovements({
					workOrderId,
					countId: existingCountId,
					movementId: movementKey,
					classificationId,
				}),
			);
		},
		[dispatch],
	);

	/**
	 * Find or create count for current time slot
	 * Mirrors old app's addToActiveCount logic
	 */
	const recordMovement = useCallback(
		(
			workOrderId: string,
			fromDirection: string,
			toDirection: string,
			classificationId: string,
			classificationName: string,
			location: { lat: number; long: number },
			userId: string,
			slot: number,
		): string => {
			const workOrder = workOrders.find(
				(wo) => wo.id === workOrderId || wo.studyId === workOrderId,
			);
			if (!workOrder) return "";

			const slotTime = calculateSlotTime(slot);
			const movementKey = `${fromDirection}_${toDirection}`;

			// Check if count exists for this slot
			const existingCount = workOrder.counts.find(
				(c) => c.dateTime === slotTime,
			);

			if (existingCount) {
				// Update existing count
				addCountToSlot(
					workOrderId,
					existingCount.id,
					movementKey,
					classificationId,
				);
				return existingCount.id;
			} else {
				// Create new count
				return addCount(
					workOrderId,
					movementKey,
					classificationId,
					classificationName,
					location,
					userId,
					slot,
				);
			}
		},
		[workOrders, addCount, addCountToSlot],
	);

	/**
	 * Remove a count (undo)
	 */
	const removeCount = useCallback(
		(workOrderId: string, countId: string) => {
			dispatch(removeLastCountFromWorkOrder({ workOrderId, countId }));
		},
		[dispatch],
	);

	// ─── Computed Values ───────────────────────────────────────────

	/**
	 * Get counts for a specific work order
	 */
	const getCountsForWorkOrder = useCallback(
		(workOrderId: string): TrafficCount[] => {
			const wo = workOrders.find(
				(w) => w.id === workOrderId || w.studyId === workOrderId,
			);
			return wo?.counts || [];
		},
		[workOrders],
	);

	/**
	 * Get unsynced work orders
	 */
	const getUnsyncedWorkOrders = useCallback(() => {
		return workOrders.filter(
			(wo) => !wo.isSynced || wo.isEdited || wo.counts.some((c) => !c.isSynced),
		);
	}, [workOrders]);

	/**
	 * Get work orders by status
	 */
	const getWorkOrdersByStatus = useCallback(
		(status: WorkOrderStatus) => {
			return workOrders.filter((wo) => wo.status === status);
		},
		[workOrders],
	);

	/**
	 * Count of unsynced items
	 */
	const unsyncedCount = useMemo(() => {
		return workOrders.reduce((count, wo) => {
			const unsyncedCounts = wo.counts.filter((c) => !c.isSynced).length;
			return count + unsyncedCounts;
		}, 0);
	}, [workOrders]);

	/**
	 * Filter and sort work orders
	 */
	const filterAndSortWorkOrders = useCallback(
		(
			filterByStatus: WorkOrderStatus[] = [],
			filterBySyncStatus: SyncStatusType[] = [],
			sortBy: "newest" | "oldest" | "nearer_due" | "later_due" | null = null,
		) => {
			let result = [...workOrders];

			// Filter by status
			if (filterByStatus.length > 0) {
				result = result.filter((wo) => filterByStatus.includes(wo.status));
			}

			// Filter by sync status
			if (filterBySyncStatus.length > 0) {
				result = result.filter((wo) =>
					filterBySyncStatus.includes(wo.syncStatus),
				);
			}

			// Sort
			switch (sortBy) {
				case "newest":
					result.sort(
						(a, b) =>
							new Date(b.startDT).getTime() - new Date(a.startDT).getTime(),
					);
					break;
				case "oldest":
					result.sort(
						(a, b) =>
							new Date(a.startDT).getTime() - new Date(b.startDT).getTime(),
					);
					break;
				case "nearer_due":
					result.sort(
						(a, b) => new Date(a.endDT).getTime() - new Date(b.endDT).getTime(),
					);
					break;
				case "later_due":
					result.sort(
						(a, b) => new Date(b.endDT).getTime() - new Date(a.endDT).getTime(),
					);
					break;
			}

			return result;
		},
		[workOrders],
	);

	/**
	 * Get classification by ID
	 */
	const getClassificationById = useCallback(
		(id: string) => {
			return vehicleClassifications.find((vc) => vc.id === id || vc.in === id);
		},
		[vehicleClassifications],
	);

	/**
	 * Get pedestrian classification
	 */
	const pedestrianClassification = useMemo(() => {
		return vehicleClassifications.find((vc) => vc.isPedestrian);
	}, [vehicleClassifications]);

	/**
	 * Clear sync error
	 */
	const dismissSyncError = useCallback(() => {
		dispatch(clearSyncError());
	}, [dispatch]);

	return {
		// State
		workOrders,
		vehicleClassifications,
		isLoading,
		isSyncing,
		lastFetched,
		syncError,
		unsyncedCount,
		pedestrianClassification,

		// Fetch operations
		refreshWorkOrders,
		loadVehicleClassifications,

		// Sync operations
		syncData,

		// Work order operations
		changeWorkOrderStatus,
		updateWorkOrder,
		getWorkOrderById,
		getWorkOrdersByStatus,
		getUnsyncedWorkOrders,
		filterAndSortWorkOrders,

		// Count operations
		addCount,
		addCountToSlot,
		recordMovement,
		removeCount,
		getCountsForWorkOrder,

		// Classification operations
		getClassificationById,

		// Error handling
		dismissSyncError,
	};
};

/**
 * Hook for getting vehicle types formatted for the counter UI
 */
export const useVehicleTypes = () => {
	const vehicleClassifications = useAppSelector(
		(state) => state.trafficCount.vehicleClassifications,
	);

	const vehicleTypes = useMemo(() => {
		return vehicleClassifications
			.slice()
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((vc) => ({
				id: vc.id,
				internalId: vc.in,
				name: vc.name,
				icon: vc.icon || vc.name,
				isPedestrian: vc.isPedestrian,
			}));
	}, [vehicleClassifications]);

	const nonPedestrianTypes = useMemo(() => {
		return vehicleTypes.filter((v) => !v.isPedestrian);
	}, [vehicleTypes]);

	const pedestrianTypes = useMemo(() => {
		return vehicleTypes.filter((v) => v.isPedestrian);
	}, [vehicleTypes]);

	return {
		vehicleTypes,
		nonPedestrianTypes,
		pedestrianTypes,
	};
};
