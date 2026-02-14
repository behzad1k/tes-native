import { SYNC_STATUS } from "@/src/constants/global";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { syncMaintenanceData } from "../thunks";

interface SyncState {
	isSyncing: boolean;
	syncProgress: number;
	currentOperation: string | null;
	lastSyncTime: number | null;
	syncError: string | null;
	pendingOperations: {
		creates: number;
		updates: number;
		deletes: number;
		images: number;
	};
}

const initialState: SyncState = {
	isSyncing: false,
	syncProgress: 0,
	currentOperation: null,
	lastSyncTime: null,
	syncError: null,
	pendingOperations: {
		creates: 0,
		updates: 0,
		deletes: 0,
		images: 0,
	},
};

// Calculate pending operations
export const calculatePendingOperations = createAsyncThunk(
	"sync/calculatePending",
	async (_, { getState }) => {
		const state = getState() as any;

		// Signs
		const unsyncedSigns = state.signs.signs.filter(
			(s: any) => s.status === SYNC_STATUS.NOT_SYNCED || !s.isSynced,
		);

		// Supports
		const unsyncedSupports = state.supports.supports.filter(
			(s: any) => s.status === SYNC_STATUS.NOT_SYNCED || !s.isSynced,
		);

		// Jobs
		const unsyncedJobs = state.maintenance.jobs.filter(
			(j: any) => j.isEdited && !j.isSynced,
		);

		// Job images
		const unsyncedJobImages = state.maintenance.jobImages.filter(
			(img: any) => !img.isSynced && img.isNew,
		);

		const creates = [
			...unsyncedSigns.filter((s: any) => s.isNew),
			...unsyncedSupports.filter((s: any) => s.isNew),
		].length;

		const updates = [
			...unsyncedSigns.filter((s: any) => !s.isNew),
			...unsyncedSupports.filter((s: any) => !s.isNew),
			...unsyncedJobs,
		].length;

		const images = [
			...unsyncedSigns.flatMap((s: any) =>
				s.images.filter((img: any) => img.isNew && !img.isSynced),
			),
			...unsyncedSupports.flatMap((s: any) =>
				s.images.filter((img: any) => img.isNew && !img.isSynced),
			),
			...unsyncedJobImages,
		].length;

		return {
			creates,
			updates,
			deletes: 0,
			images,
		};
	},
);

// Start full sync (signs, supports, maintenance)
export const startSync = createAsyncThunk(
	"sync/start",
	async (_, { dispatch, getState, rejectWithValue }) => {
		try {
			const state = getState() as any;

			// Calculate what needs to be synced
			const pendingOps = await dispatch(calculatePendingOperations()).unwrap();

			if (
				pendingOps.creates === 0 &&
				pendingOps.updates === 0 &&
				pendingOps.images === 0
			) {
				return {
					synced: false,
					message: "No changes to sync",
					syncedCount: 0,
				};
			}

			// Sync maintenance data
			const maintenanceResult = await dispatch(syncMaintenanceData()).unwrap();

			return {
				synced: true,
				syncedCount:
					maintenanceResult.syncedJobIds.length +
					maintenanceResult.syncedImageIds.length,
				timestamp: Date.now(),
			};
		} catch (error: any) {
			return rejectWithValue(error.message || "Sync failed");
		}
	},
);

const syncSlice = createSlice({
	name: "sync",
	initialState,
	reducers: {
		updateProgress: (state, action: PayloadAction<number>) => {
			state.syncProgress = action.payload;
		},
		setCurrentOperation: (state, action: PayloadAction<string | null>) => {
			state.currentOperation = action.payload;
		},
		updatePendingCounts: (
			state,
			action: PayloadAction<{
				creates: number;
				updates: number;
				deletes: number;
				images: number;
			}>,
		) => {
			state.pendingOperations = action.payload;
		},
		clearSyncError: (state) => {
			state.syncError = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Start Sync
			.addCase(startSync.pending, (state) => {
				state.isSyncing = true;
				state.syncProgress = 0;
				state.syncError = null;
			})
			.addCase(startSync.fulfilled, (state, action) => {
				state.isSyncing = false;
				state.currentOperation = null;
				state.lastSyncTime = action.payload.timestamp || Date.now();
				state.syncProgress = 100;
			})
			.addCase(startSync.rejected, (state, action) => {
				state.isSyncing = false;
				state.syncError = action.payload as string;
				state.currentOperation = null;
				state.syncProgress = 0;
			})

			// Calculate Pending Operations
			.addCase(calculatePendingOperations.fulfilled, (state, action) => {
				state.pendingOperations = action.payload;
			})

			// Sync Maintenance Data
			.addCase(syncMaintenanceData.pending, (state) => {
				state.isSyncing = true;
				state.currentOperation = "Syncing maintenance data...";
			})
			.addCase(syncMaintenanceData.fulfilled, (state, action) => {
				state.currentOperation = null;
				state.lastSyncTime = action.payload.timestamp;
			})
			.addCase(syncMaintenanceData.rejected, (state, action) => {
				state.syncError = action.payload as string;
			});
	},
});

export const {
	updateProgress,
	setCurrentOperation,
	updatePendingCounts,
	clearSyncError,
} = syncSlice.actions;

export default syncSlice.reducer;
