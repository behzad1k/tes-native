import { SYNC_STATUS } from "@/src/constants/global";
import { ChangeLog, ChangeLogType } from "@/src/types/models";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { syncMaintenanceData, syncSignSupportData } from "../thunks";

interface SyncState {
	isSyncing: boolean;
	syncProgress: number;
	currentOperation: string | null;
	lastSyncTime: number | null;
	syncError: string | null;
	changeLogs: ChangeLog[];
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
	changeLogs: [],
	pendingOperations: {
		creates: 0,
		updates: 0,
		deletes: 0,
		images: 0,
	},
};

// Helper to generate UUID
const generateUUID = (): string => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

// Calculate pending operations
export const calculatePendingOperations = createAsyncThunk(
	"sync/calculatePending",
	async (_, { getState }) => {
		const state = getState() as any;

		// Signs
		const unsyncedSigns = state.signs.signs.filter(
			(s: any) => s.status === SYNC_STATUS.NOT_SYNCED || !s.isSynced
		);

		// Supports
		const unsyncedSupports = state.supports.supports.filter(
			(s: any) => s.status === SYNC_STATUS.NOT_SYNCED || !s.isSynced
		);

		// Jobs (if maintenance exists)
		const unsyncedJobs = state.maintenance?.jobs?.filter(
			(j: any) => j.isEdited && !j.isSynced
		) || [];

		// Job images (if maintenance exists)
		const unsyncedJobImages = state.maintenance?.jobImages?.filter(
			(img: any) => !img.isSynced && img.isNew
		) || [];

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
				s.images.filter((img: any) => img.isNew && !img.isSynced)
			),
			...unsyncedSupports.flatMap((s: any) =>
				s.images.filter((img: any) => img.isNew && !img.isSynced)
			),
			...unsyncedJobImages,
		].length;

		return {
			creates,
			updates,
			deletes: 0,
			images,
		};
	}
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

			let syncedCount = 0;

			// Sync sign/support data
			const signSupportResult = await dispatch(syncSignSupportData()).unwrap();
			syncedCount +=
				signSupportResult.syncedSignIds.length +
				signSupportResult.syncedSupportIds.length +
				signSupportResult.syncedImageIds.length;

			// Sync maintenance data if there's maintenance state
			if (state.maintenance) {
				const maintenanceResult = await dispatch(syncMaintenanceData()).unwrap();
				syncedCount +=
					maintenanceResult.syncedJobIds.length +
					maintenanceResult.syncedImageIds.length;
			}

			return {
				synced: true,
				syncedCount,
				timestamp: Date.now(),
			};
		} catch (error: any) {
			return rejectWithValue(error.message || "Sync failed");
		}
	}
);

const syncSlice = createSlice({
	name: "sync",
	initialState,
	reducers: {
		// Add a change log entry
		addChangeLog: (
			state,
			action: PayloadAction<{
				customerId: string;
				userId: string;
				username: string;
				type: ChangeLogType;
				field: string;
				fromValue: string;
				toValue: string;
				supportId?: string;
				signId?: string;
			}>
		) => {
			const changeLog: ChangeLog = {
				id: generateUUID(),
				changeDate: new Date().toISOString(),
				customerId: action.payload.customerId,
				userId: action.payload.userId,
				username: action.payload.username,
				type: action.payload.type,
				field: action.payload.field,
				fromValue: action.payload.fromValue,
				toValue: action.payload.toValue,
				supportId: action.payload.supportId || "",
				signId: action.payload.signId || "",
			};
			state.changeLogs.push(changeLog);
		},

		// Clear all change logs (after successful sync)
		clearChangeLogs: (state) => {
			state.changeLogs = [];
		},

		// Remove specific change logs
		removeChangeLogs: (state, action: PayloadAction<string[]>) => {
			state.changeLogs = state.changeLogs.filter(
				(log) => !action.payload.includes(log.id)
			);
		},

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
			}>
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
				// Clear change logs on successful sync
				state.changeLogs = [];
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

			// Sync Sign/Support Data
			.addCase(syncSignSupportData.pending, (state) => {
				state.isSyncing = true;
				state.currentOperation = "Syncing signs and supports...";
			})
			.addCase(syncSignSupportData.fulfilled, (state, action) => {
				state.currentOperation = null;
				state.lastSyncTime = action.payload.timestamp;
			})
			.addCase(syncSignSupportData.rejected, (state, action) => {
				state.syncError = action.payload as string;
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
	addChangeLog,
	clearChangeLogs,
	removeChangeLogs,
	updateProgress,
	setCurrentOperation,
	updatePendingCounts,
	clearSyncError,
} = syncSlice.actions;

export default syncSlice.reducer;
