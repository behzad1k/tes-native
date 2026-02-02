import { SYNC_STATUS } from "@/src/constants/global";
import { apiClient } from "@/src/services/api/apiClient";
import { updateAfterSync, updateSign } from "@/src/store/slices/signSlice";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { TokenStorage, ImageStorage } from "../persistence";
import { File } from "expo-file-system";

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

export const startSync = createAsyncThunk(
	"sync/start",
	async (_, { getState, dispatch, rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No authentication token");

			const state = getState() as any;
			const unsyncedSigns = state.signs.signs.filter(
				(sign: any) => sign.status === SYNC_STATUS.NOT_SYNCED,
			);

			if (unsyncedSigns.length === 0) {
				return { synced: false, message: "No changes to sync" };
			}

			let progress = 0;
			const totalOperations = unsyncedSigns.length;

			for (const sign of unsyncedSigns) {
				dispatch(
					setCurrentOperation(`Syncing sign ${sign.signId || sign.localId}`),
				);

				try {
					if (sign.isNew) {
						const formData = new FormData();

						const { localId, isNew, status, images, ...signData } = sign;
						formData.append("sign", JSON.stringify(signData));

						for (const image of sign.images.filter((img) => img.isNew)) {
							if (image.localPath) {
								const fileInfo = new File(image.localPath).info();
								if (fileInfo.exists) {
									formData.append("images", {
										uri: image.localPath,
										type: "image/jpeg",
										name: `sign_${sign.id}_${Date.now()}.jpg`,
									} as any);
								}
							}
						}

						const response = await apiClient.post("/signs", formData, {
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "multipart/form-data",
							},
						});

						dispatch(
							updateAfterSync({
								localId: sign.localId!,
								serverId: response.data.id,
								imageUpdates: response.data.images.map(
									(img: any, idx: number) => ({
										localImageId: sign.images[idx]?.imageId || "",
										serverImageId: img.id,
									}),
								),
							}),
						);
					} else if (sign.images.some((img) => img.isNew)) {
						const formData = new FormData();

						for (const image of sign.images.filter((img) => img.isNew)) {
							if (image.localPath) {
								const fileInfo = new File(image.localPath).info();
								if (fileInfo.exists) {
									formData.append("images", {
										uri: image.localPath,
										type: "image/jpeg",
										name: `sign_${sign.id}_${Date.now()}.jpg`,
									} as any);
								}
							}
						}

						await apiClient.post(`/signs/${sign.serverId}/images`, formData, {
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "multipart/form-data",
							},
						});

						dispatch(
							updateSign({
								id: sign.id,
								updates: { status: SYNC_STATUS.SYNCED },
								isNewImage: false,
							}),
						);
					} else {
						const { localId, isNew, status, images, serverId, ...signData } =
							sign;
						await apiClient.put(`/signs/${sign.serverId}`, signData, {
							headers: { Authorization: `Bearer ${token}` },
						});

						dispatch(
							updateSign({
								id: sign.id,
								updates: { status: SYNC_STATUS.SYNCED },
							}),
						);
					}
				} catch (error) {
					console.error(`Failed to sync sign ${sign.id}:`, error);
					continue;
				}

				progress++;
				dispatch(updateProgress((progress / totalOperations) * 100));
			}

			const syncedSignIds = state.signs.signs
				.filter((s: any) => s.status === SYNC_STATUS.SYNCED)
				.map((s: any) => s.id);

			await ImageStorage.cleanupImages(syncedSignIds);

			return {
				synced: true,
				syncedCount: progress,
				timestamp: Date.now(),
			};
		} catch (error) {
			return rejectWithValue(error.message);
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
			.addCase(startSync.pending, (state) => {
				state.isSyncing = true;
				state.syncProgress = 0;
				state.syncError = null;
			})
			.addCase(startSync.fulfilled, (state, action) => {
				state.isSyncing = false;
				state.currentOperation = null;
				state.lastSyncTime = action.payload.timestamp || Date.now();
			})
			.addCase(startSync.rejected, (state, action) => {
				state.isSyncing = false;
				state.syncError = action.payload as string;
				state.currentOperation = null;
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
