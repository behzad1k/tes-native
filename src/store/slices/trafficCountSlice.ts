import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "@/src/services/api/apiClient";
import { ReduxStorage, TokenStorage } from "../persistence";
import {
	TrafficCountWorkOrder,
	TrafficCount,
	TrafficCountClassification,
	WorkOrderStatus,
} from "@/src/modules/traffic-count/types";
import mockData from "@/src/data/mockTrafficCountData.json";

interface TrafficCountState {
	workOrders: TrafficCountWorkOrder[];
	classifications: TrafficCountClassification[];
	isLoading: boolean;
	lastFetched: number | null;
}

const initialState: TrafficCountState = {
	workOrders: [],
	classifications: [],
	isLoading: false,
	lastFetched: null,
};

const saveToStorage = async (state: TrafficCountState) => {
	await ReduxStorage.saveState("traffic_count_data", {
		workOrders: state.workOrders,
		classifications: state.classifications,
		lastFetched: state.lastFetched,
	});
};

const computeDaysLeft = (endDT: string): number => {
	const end = new Date(endDT);
	const now = new Date();
	const diff = end.getTime() - now.getTime();
	return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const fetchWorkOrders = createAsyncThunk(
	"trafficCount/fetchWorkOrders",
	async (_, { rejectWithValue }) => {
		try {
			console.log("Using mock traffic count data");
			await new Promise((resolve) => setTimeout(resolve, 800));
			const workOrders = mockData.workOrders.map((wo) => ({
				...wo,
				daysLeft: computeDaysLeft(wo.endDT),
			}));
			return { workOrders, classifications: mockData.classifications };
		} catch (error: any) {
			return rejectWithValue(error.message || "Failed to fetch work orders");
		}
	},
);

export const syncTrafficCountData = createAsyncThunk(
	"trafficCount/sync",
	async (_, { getState, rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No token");
			const state = (getState() as any).trafficCount as TrafficCountState;
			const postData = {
				WorkOrderData: state.workOrders.map((wo) => ({
					studyId: wo.studyId,
					counts: wo.counts,
					isCompleted: wo.isCompleted,
				})),
			};
			const response = await apiClient.post(
				"api/TrafficStudy/sync/MobileApplication",
				postData,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			const data = response.data || response;
			if (data.responseCode !== 200) {
				return rejectWithValue(data.errorMessages || "Sync failed");
			}
			return {
				workOrders: data.results?.workOrders || [],
				classifications: data.results?.vehicleClassifications || [],
				timestamp: Date.now(),
			};
		} catch (error: any) {
			return rejectWithValue(error.message || "Sync failed");
		}
	},
);

const trafficCountSlice = createSlice({
	name: "trafficCount",
	initialState,
	reducers: {
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
				if (wo.status === "To Do") {
					wo.status = "In Progress";
				}
				saveToStorage(state);
			}
		},

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
					if (wo.counts.length === 0 && wo.status === "In Progress") {
						wo.status = "To Do";
					}
					saveToStorage(state);
				}
			}
		},

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

		markAllCountsSynced: (state) => {
			state.workOrders.forEach((wo) => {
				wo.counts = wo.counts.map((c) => ({ ...c, isSynced: true }));
				wo.isSynced = true;
				wo.isEdited = false;
				wo.syncStatus = "Synced";
			});
			saveToStorage(state);
		},

		loadSavedTrafficData: (
			state,
			action: PayloadAction<{
				workOrders: TrafficCountWorkOrder[];
				classifications: TrafficCountClassification[];
				lastFetched: number | null;
			}>,
		) => {
			state.workOrders = action.payload.workOrders;
			state.classifications = action.payload.classifications;
			state.lastFetched = action.payload.lastFetched;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchWorkOrders.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchWorkOrders.fulfilled, (state, action) => {
				state.workOrders = action.payload.workOrders as TrafficCountWorkOrder[];
				state.classifications = action.payload
					.classifications as TrafficCountClassification[];
				state.lastFetched = Date.now();
				state.isLoading = false;
				saveToStorage(state);
			})
			.addCase(fetchWorkOrders.rejected, (state) => {
				state.isLoading = false;
			})
			.addCase(syncTrafficCountData.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(syncTrafficCountData.fulfilled, (state, action) => {
				if (action.payload.workOrders?.length > 0) {
					state.workOrders = action.payload
						.workOrders as TrafficCountWorkOrder[];
				}
				if (action.payload.classifications?.length > 0) {
					state.classifications = action.payload
						.classifications as TrafficCountClassification[];
				}
				state.workOrders.forEach((wo) => {
					wo.isSynced = true;
					wo.isEdited = false;
					wo.syncStatus = "Synced";
					wo.counts = wo.counts.map((c) => ({ ...c, isSynced: true }));
				});
				state.lastFetched = action.payload.timestamp;
				state.isLoading = false;
				saveToStorage(state);
			})
			.addCase(syncTrafficCountData.rejected, (state) => {
				state.isLoading = false;
			});
	},
});

export const {
	updateWorkOrderStatus,
	updateWorkOrderLocally,
	addCountToWorkOrder,
	removeLastCountFromWorkOrder,
	markWorkOrderSynced,
	markAllCountsSynced,
	loadSavedTrafficData,
} = trafficCountSlice.actions;

export default trafficCountSlice.reducer;
