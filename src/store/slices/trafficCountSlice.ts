import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "@/src/services/api/apiClient";
import { ReduxStorage } from "@/src/store/persistence";
import {
	TrafficCountWorkOrder,
	TrafficCount,
	VehicleClassification,
	WorkOrderStatus,
	transformWorkOrder,
	transformVehicleClassification,
} from "@/src/modules/traffic-count/types";
import {
	BTrafficCountSyncRequest,
	BTrafficCountSyncResponse,
	BVehicleClassification,
	BTrafficCountWorkOrder,
} from "@/src/types/api";
import ENDPOINTS from "@/src/services/api/endpoints";
import { RootState } from "@/src/store";
import mockData from "../../data/mockTrafficCountData.json";

// ─── State Interface ───────────────────────────────────────────────

interface TrafficCountState {
	workOrders: TrafficCountWorkOrder[];
	vehicleClassifications: VehicleClassification[];
	isLoading: boolean;
	isSyncing: boolean;
	lastFetched: number | null;
	syncError: string | null;
}

const initialState: TrafficCountState = {
	workOrders: [],
	vehicleClassifications: [],
	isLoading: false,
	isSyncing: false,
	lastFetched: null,
	syncError: null,
};

// ─── Helper Functions ──────────────────────────────────────────────

const saveToStorage = async (state: TrafficCountState) => {
	try {
		await ReduxStorage.saveState("traffic_count_data", {
			workOrders: state.workOrders,
			vehicleClassifications: state.vehicleClassifications,
			lastFetched: state.lastFetched,
		});
	} catch (error) {
		console.error("Error saving traffic count state:", error);
	}
};

/**
 * Calculate days left until work order end date
 */
const computeDaysLeft = (endDT: string): number => {
	const end = new Date(endDT);
	const now = new Date();
	const diff = end.getTime() - now.getTime();
	return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

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
 * Calculate slot time based on current time and aggregation interval
 * Mirrors old app's slotTimeCalculator function
 */
export const calculateSlotTime = (slot: number): string => {
	const now = new Date();
	const utcNow = new Date(
		Date.UTC(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			now.getHours(),
			now.getMinutes(),
			now.getSeconds(),
		),
	);

	const minutes = utcNow.getMinutes();
	const slottedMinutes = Math.floor(minutes / slot) * slot;
	utcNow.setMinutes(slottedMinutes, 0, 0);

	return utcNow.toISOString();
};

/**
 * Merge backend work orders with local work orders, preserving unsynced local data
 */
const mergeWorkOrders = (
	backendWorkOrders: BTrafficCountWorkOrder[],
	localWorkOrders: TrafficCountWorkOrder[],
): TrafficCountWorkOrder[] => {
	const localMap = new Map(localWorkOrders.map((wo) => [wo.studyId, wo]));
	const result: TrafficCountWorkOrder[] = [];

	// Process backend work orders
	for (const backendWO of backendWorkOrders) {
		const existingLocal = localMap.get(backendWO.studyId);
		result.push(transformWorkOrder(backendWO, existingLocal));
	}

	// Add any local-only work orders (shouldn't happen normally, but just in case)
	for (const localWO of localWorkOrders) {
		if (!backendWorkOrders.some((wo) => wo.studyId === localWO.studyId)) {
			// Keep local work order if it has unsynced counts
			if (localWO.counts.some((c) => !c.isSynced)) {
				result.push(localWO);
			}
		}
	}

	return result;
};

// ─── Async Thunks ──────────────────────────────────────────────────

/**
 * Fetch vehicle classifications on app startup
 */
export const fetchVehicleClassifications = createAsyncThunk<
	VehicleClassification[],
	string, // customerId
	{ state: RootState; rejectValue: string }
>(
	"trafficCount/fetchVehicleClassifications",
	async (customerId, { rejectWithValue }) => {
		try {
			const response: BVehicleClassification[] = await apiClient.get(
				ENDPOINTS.TRAFFIC_COUNTER.VEHICLE_CLASSIFICATIONS(customerId),
			);

			return response.map((vc, index) =>
				transformVehicleClassification(vc, index),
			);
		} catch (error: any) {
			console.error("Error fetching vehicle classifications:", error);
			return rejectWithValue(
				error.message || "Failed to fetch vehicle classifications",
			);
		}
	},
);

/**
 * Fetch work orders from backend
 * Called on app startup and pull-to-refresh
 */
export const fetchWorkOrders = createAsyncThunk<
	{
		workOrders: TrafficCountWorkOrder[];
		vehicleClassifications: VehicleClassification[];
	},
	void,
	{ state: RootState; rejectValue: string }
>("trafficCount/fetchWorkOrders", async (_, { getState, rejectWithValue }) => {
	try {
		const state = getState();
		const existingWorkOrders = state.trafficCount.workOrders;

		// Sync with empty data to get current work orders
		// This mirrors old app's postAppData which both sends and receives data
		const syncRequest: BTrafficCountSyncRequest = {
			WorkOrderData: [],
		};

		const response: BTrafficCountSyncResponse = await apiClient.post(
			ENDPOINTS.TRAFFIC_COUNTER.SYNC_MOBILE_APP,
			syncRequest,
		);

		if (response.responseCode !== 200) {
			return rejectWithValue(
				response.errorMessages?.join(", ") || "Failed to fetch work orders",
			);
		}

		const backendWorkOrders = response.results?.workOrders || [];
		const backendClassifications =
			response.results?.vehicleClassifications || [];

		// Merge with existing local data, preserving unsynced counts
		const mergedWorkOrders = mergeWorkOrders(
			backendWorkOrders,
			existingWorkOrders,
		);

		// Transform classifications
		const vehicleClassifications = backendClassifications.map((vc, index) =>
			transformVehicleClassification(vc, index),
		);
		if (response.results?.workOrders?.length === 0) {
			return mockData;
		}
		return {
			workOrders: mergedWorkOrders,
			vehicleClassifications,
		};
	} catch (error: any) {
		console.error("Error fetching work orders:", error);
		return rejectWithValue(error.message || "Failed to fetch work orders");
	}
});

/**
 * Sync local data to backend
 * Called when user clicks sync button
 * Mirrors old app's postAppData function
 */
export const syncTrafficCountData = createAsyncThunk<
	{
		workOrders: TrafficCountWorkOrder[];
		vehicleClassifications: VehicleClassification[];
		syncedCount: number;
		timestamp: number;
	},
	void,
	{ state: RootState; rejectValue: string }
>("trafficCount/sync", async (_, { getState, rejectWithValue }) => {
	try {
		const state = getState();
		const { workOrders } = state.trafficCount;

		// Prepare work orders with unsynced counts for sync
		const workOrdersToSync = workOrders
			.filter((wo) => wo.counts.some((c) => !c.isSynced) || wo.isEdited)
			.map((wo) => ({
				studyId: wo.studyId,
				counts: wo.counts
					.filter((c) => !c.isSynced)
					.map((c) => ({
						id: c.id,
						siteId: c.siteId,
						isSynced: c.isSynced,
						videoId: c.videoId,
						lat: c.lat,
						long: c.long,
						userId: c.userId,
						dateTime: c.dateTime,
						slot: c.slot,
						movements: c.movements,
					})),
				isCompleted: wo.isCompleted,
			}));

		const syncRequest: BTrafficCountSyncRequest = {
			WorkOrderData: workOrdersToSync,
		};

		console.log("Syncing traffic count data:", JSON.stringify(syncRequest));

		const response: BTrafficCountSyncResponse = await apiClient.post(
			ENDPOINTS.TRAFFIC_COUNTER.SYNC_MOBILE_APP,
			syncRequest,
		);

		if (response.responseCode !== 200) {
			return rejectWithValue(
				response.errorMessages?.join(", ") || "Sync failed",
			);
		}

		const backendWorkOrders = response.results?.workOrders || [];
		const backendClassifications =
			response.results?.vehicleClassifications || [];

		// After successful sync, merge with response data
		// All local counts should now be marked as synced
		const updatedWorkOrders: TrafficCountWorkOrder[] = workOrders.map((wo) => {
			const backendWO = backendWorkOrders.find(
				(bwo) => bwo.studyId === wo.studyId,
			);

			if (backendWO) {
				return transformWorkOrder(backendWO, {
					...wo,
					// Mark all counts as synced
					counts: wo.counts.map((c) => ({ ...c, isSynced: true })),
					isSynced: true,
					isEdited: false,
				});
			}

			// If not in response, mark local data as synced
			return {
				...wo,
				counts: wo.counts.map((c) => ({ ...c, isSynced: true })),
				isSynced: true,
				isEdited: false,
				syncStatus: "Synced" as const,
			};
		});

		// Add any new work orders from backend
		for (const backendWO of backendWorkOrders) {
			if (!updatedWorkOrders.some((wo) => wo.studyId === backendWO.studyId)) {
				updatedWorkOrders.push(transformWorkOrder(backendWO));
			}
		}

		// Transform classifications
		const vehicleClassifications = backendClassifications.map((vc, index) =>
			transformVehicleClassification(vc, index),
		);

		// Count how many items were synced
		const syncedCount = workOrdersToSync.reduce(
			(sum, wo) => sum + wo.counts.length,
			0,
		);

		return {
			workOrders: updatedWorkOrders,
			vehicleClassifications,
			syncedCount,
			timestamp: Date.now(),
		};
	} catch (error: any) {
		console.error("Error syncing traffic count data:", error);
		return rejectWithValue(error.message || "Sync failed");
	}
});

// ─── Slice Definition ──────────────────────────────────────────────

const trafficCountSlice = createSlice({
	name: "trafficCount",
	initialState,
	reducers: {
		/**
		 * Update work order status locally
		 */
		updateWorkOrderStatus: (
			state,
			action: PayloadAction<{ id: string; status: WorkOrderStatus }>,
		) => {
			const wo = state.workOrders.find((w) => w.id === action.payload.id);
			if (wo) {
				wo.status = action.payload.status;
				wo.isEdited = true;
				wo.isSynced = false;
				wo.syncStatus = "Not Synced";
				wo.isCompleted = action.payload.status === "Done";
				saveToStorage(state);
			}
		},

		/**
		 * Update entire work order locally
		 */
		updateWorkOrderLocally: (
			state,
			action: PayloadAction<TrafficCountWorkOrder>,
		) => {
			const index = state.workOrders.findIndex(
				(w) => w.id === action.payload.id,
			);
			if (index !== -1) {
				state.workOrders[index] = {
					...action.payload,
					isEdited: true,
					isSynced: false,
					syncStatus: "Not Synced",
				};
				saveToStorage(state);
			}
		},

		/**
		 * Add a count to a work order
		 * Called when user records a vehicle movement
		 */
		addCountToWorkOrder: (
			state,
			action: PayloadAction<{ workOrderId: string; count: TrafficCount }>,
		) => {
			const wo = state.workOrders.find(
				(w) => w.id === action.payload.workOrderId,
			);
			if (wo) {
				if (!wo.counts) wo.counts = [];
				wo.counts.push(action.payload.count);
				wo.isEdited = true;
				wo.isSynced = false;
				wo.syncStatus = "Not Synced";

				// Auto-update status
				if (wo.status === "To Do") {
					wo.status = "In Progress";
				}
				saveToStorage(state);
			}
		},

		/**
		 * Update an existing count's movements
		 * Used when adding to the same time slot
		 * Mirrors old app's updateActiveCount
		 */
		updateCountMovements: (
			state,
			action: PayloadAction<{
				workOrderId: string;
				countId: string;
				movementId: string;
				classificationId: string;
			}>,
		) => {
			const wo = state.workOrders.find(
				(w) => w.id === action.payload.workOrderId,
			);
			if (wo) {
				const count = wo.counts.find((c) => c.id === action.payload.countId);
				if (count) {
					const { movementId, classificationId } = action.payload;

					// Initialize movement if not exists
					if (!count.movements[movementId]) {
						count.movements[movementId] = {};
					}

					// Increment count for this classification
					if (!count.movements[movementId][classificationId]) {
						count.movements[movementId][classificationId] = 0;
					}
					count.movements[movementId][classificationId] += 1;

					count.isSynced = false;
					wo.isSynced = false;
					wo.syncStatus = "Not Synced";
					saveToStorage(state);
				}
			}
		},

		/**
		 * Remove the last count from a work order (undo)
		 */
		removeLastCountFromWorkOrder: (
			state,
			action: PayloadAction<{ workOrderId: string; countId: string }>,
		) => {
			const wo = state.workOrders.find(
				(w) => w.id === action.payload.workOrderId,
			);
			if (wo && wo.counts) {
				const idx = wo.counts.findIndex((c) => c.id === action.payload.countId);
				if (idx !== -1) {
					wo.counts.splice(idx, 1);
					wo.isEdited = true;
					wo.isSynced = false;
					wo.syncStatus = "Not Synced";

					// Update status if no counts left
					if (wo.counts.length === 0 && wo.status === "In Progress") {
						wo.status = "To Do";
					}
					saveToStorage(state);
				}
			}
		},

		/**
		 * Mark a work order as synced
		 */
		markWorkOrderSynced: (state, action: PayloadAction<string>) => {
			const wo = state.workOrders.find((w) => w.id === action.payload);
			if (wo) {
				wo.isSynced = true;
				wo.isEdited = false;
				wo.syncStatus = "Synced";
				wo.counts = wo.counts.map((c) => ({ ...c, isSynced: true }));
				saveToStorage(state);
			}
		},

		/**
		 * Mark all counts as synced
		 */
		markAllCountsSynced: (state) => {
			state.workOrders.forEach((wo) => {
				wo.counts = wo.counts.map((c) => ({ ...c, isSynced: true }));
				wo.isSynced = true;
				wo.isEdited = false;
				wo.syncStatus = "Synced";
			});
			saveToStorage(state);
		},

		/**
		 * Load saved data from async storage
		 */
		loadSavedTrafficData: (
			state,
			action: PayloadAction<{
				workOrders: TrafficCountWorkOrder[];
				vehicleClassifications: VehicleClassification[];
				lastFetched: number | null;
			}>,
		) => {
			state.workOrders = action.payload.workOrders;
			state.vehicleClassifications = action.payload.vehicleClassifications;
			state.lastFetched = action.payload.lastFetched;
		},

		/**
		 * Clear sync error
		 */
		clearSyncError: (state) => {
			state.syncError = null;
		},

		/**
		 * Set vehicle classifications directly
		 * Used when fetched separately on app startup
		 */
		setVehicleClassifications: (
			state,
			action: PayloadAction<VehicleClassification[]>,
		) => {
			state.vehicleClassifications = action.payload;
			saveToStorage(state);
		},
	},
	extraReducers: (builder) => {
		builder
			// ─── Fetch Vehicle Classifications ─────────────────────────
			.addCase(fetchVehicleClassifications.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchVehicleClassifications.fulfilled, (state, action) => {
				state.vehicleClassifications = action.payload;
				state.isLoading = false;
				saveToStorage(state);
			})
			.addCase(fetchVehicleClassifications.rejected, (state, action) => {
				state.isLoading = false;
				state.syncError = action.payload as string;
			})

			// ─── Fetch Work Orders ─────────────────────────────────────
			.addCase(fetchWorkOrders.pending, (state) => {
				state.isLoading = true;
				state.syncError = null;
			})
			.addCase(fetchWorkOrders.fulfilled, (state, action) => {
				state.workOrders = action.payload.workOrders;
				if (action.payload.vehicleClassifications.length > 0) {
					state.vehicleClassifications = action.payload.vehicleClassifications;
				}
				state.lastFetched = Date.now();
				state.isLoading = false;
				saveToStorage(state);
			})
			.addCase(fetchWorkOrders.rejected, (state, action) => {
				state.isLoading = false;
				state.syncError = action.payload as string;
			})

			// ─── Sync Traffic Count Data ───────────────────────────────
			.addCase(syncTrafficCountData.pending, (state) => {
				state.isSyncing = true;
				state.syncError = null;
			})
			.addCase(syncTrafficCountData.fulfilled, (state, action) => {
				state.workOrders = action.payload.workOrders;
				if (action.payload.vehicleClassifications.length > 0) {
					state.vehicleClassifications = action.payload.vehicleClassifications;
				}
				state.lastFetched = action.payload.timestamp;
				state.isSyncing = false;
				saveToStorage(state);
			})
			.addCase(syncTrafficCountData.rejected, (state, action) => {
				state.isSyncing = false;
				state.syncError = action.payload as string;
			});
	},
});

export const {
	updateWorkOrderStatus,
	updateWorkOrderLocally,
	addCountToWorkOrder,
	updateCountMovements,
	removeLastCountFromWorkOrder,
	markWorkOrderSynced,
	markAllCountsSynced,
	loadSavedTrafficData,
	clearSyncError,
	setVehicleClassifications,
} = trafficCountSlice.actions;

export default trafficCountSlice.reducer;
