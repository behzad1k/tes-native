import { SYNC_STATUS } from "@/src/constants/global";
import { apiClient } from "@/src/services/api/apiClient";
import { updateAfterSync as updateSignAfterSync } from "@/src/store/slices/signSlice";
import { updateAfterSync as updateSupportAfterSync } from "@/src/store/slices/supportSlice";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { TokenStorage, ImageStorage } from "../persistence";
import * as FileSystem from "expo-file-system";

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

// Helper to create FormData with images
const createFormDataWithImages = async (
	data: any,
	images: any[],
	entityType: "sign" | "support",
) => {
	const formData = new FormData();

	// Add entity data
	formData.append(entityType, JSON.stringify(data));

	// Add images
	for (const image of images) {
		if (image.localPath) {
			try {
				const fileInfo = await FileSystem.getInfoAsync(image.localPath);
				if (fileInfo.exists) {
					const filename =
						image.localPath.split("/").pop() ||
						`${entityType}_${Date.now()}.jpg`;
					const match = /\.(\w+)$/.exec(filename);
					const type = match ? `image/${match[1]}` : "image/jpeg";

					formData.append("images", {
						uri: image.localPath,
						type,
						name: filename,
					} as any);
				}
			} catch (error) {
				console.error("Error reading image file:", error);
			}
		}
	}

	return formData;
};

export const startSync = createAsyncThunk(
	"sync/start",
	async (_, { getState, dispatch, rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No authentication token");

			const state = getState() as any;

			// Get unsynced signs and supports
			const unsyncedSigns = state.signs.signs.filter(
				(sign: any) => sign.status === SYNC_STATUS.NOT_SYNCED,
			);

			const unsyncedSupports = state.supports.supports.filter(
				(support: any) => support.status === SYNC_STATUS.NOT_SYNCED,
			);

			const totalOperations = unsyncedSigns.length + unsyncedSupports.length;

			if (totalOperations === 0) {
				return { synced: false, message: "No changes to sync" };
			}

			let progress = 0;
			let syncedCount = 0;

			// ============ SYNC SIGNS ============
			for (const sign of unsyncedSigns) {
				dispatch(
					setCurrentOperation(`Syncing sign ${sign.signId || sign.localId}`),
				);

				try {
					if (sign.isNew) {
						// CREATE NEW SIGN
						const { localId, isNew, status, images, serverId, ...signData } =
							sign;

						const newImages = images.filter((img: any) => img.isNew);
						const formData = await createFormDataWithImages(
							signData,
							newImages,
							"sign",
						);

						const response = await apiClient.post("/api/Sign/Add", formData, {
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "multipart/form-data",
							},
						});

						// Update local sign with server ID
						const imageUpdates =
							response.data.images?.map((img: any, idx: number) => ({
								localImageId:
									newImages[idx]?.imageId ||
									newImages[idx]?.uri.split("/").pop() ||
									"",
								serverImageId: img.id,
							})) || [];

						dispatch(
							updateSignAfterSync({
								localId: sign.localId || sign.id,
								serverId: response.data.id,
								imageUpdates,
							}),
						);

						syncedCount++;
					} else {
						// UPDATE EXISTING SIGN
						const hasNewImages = sign.images.some((img: any) => img.isNew);

						if (hasNewImages) {
							// Upload new images separately
							const newImages = sign.images.filter((img: any) => img.isNew);
							const formData = new FormData();

							for (const image of newImages) {
								if (image.localPath) {
									try {
										const fileInfo = await FileSystem.getInfoAsync(
											image.localPath,
										);
										if (fileInfo.exists) {
											const filename =
												image.localPath.split("/").pop() ||
												`sign_${Date.now()}.jpg`;
											const match = /\.(\w+)$/.exec(filename);
											const type = match ? `image/${match[1]}` : "image/jpeg";

											formData.append("images", {
												uri: image.localPath,
												type,
												name: filename,
											} as any);
										}
									} catch (error) {
										console.error("Error reading image:", error);
									}
								}
							}

							await apiClient.post(
								`/api/Sign/AddSignImages/${sign.serverId || sign.id}`,
								formData,
								{
									headers: {
										Authorization: `Bearer ${token}`,
										"Content-Type": "multipart/form-data",
									},
								},
							);
						}

						// Update sign data
						const { localId, isNew, status, images, ...signData } = sign;

						await apiClient.put(
							`/api/Sign/Update/${sign.serverId || sign.id}`,
							signData,
							{
								headers: { Authorization: `Bearer ${token}` },
							},
						);

						// Mark as synced
						dispatch(
							updateSignAfterSync({
								localId: sign.localId || sign.id,
								serverId: sign.serverId || sign.id,
								imageUpdates: [],
							}),
						);

						syncedCount++;
					}
				} catch (error: any) {
					console.error(`Failed to sync sign ${sign.id}:`, error);
					// Continue with other signs
					continue;
				}

				progress++;
				dispatch(updateProgress((progress / totalOperations) * 100));
			}

			// ============ SYNC SUPPORTS ============
			for (const support of unsyncedSupports) {
				dispatch(
					setCurrentOperation(
						`Syncing support ${support.supportId || support.localId}`,
					),
				);

				try {
					if (support.isNew) {
						// CREATE NEW SUPPORT
						const { localId, isNew, status, images, signs, ...supportData } =
							support;

						const newImages = images.filter((img: any) => img.isNew);
						const formData = await createFormDataWithImages(
							supportData,
							newImages,
							"support",
						);

						const response = await apiClient.post(
							"/api/Support/Add",
							formData,
							{
								headers: {
									Authorization: `Bearer ${token}`,
									"Content-Type": "multipart/form-data",
								},
							},
						);

						const imageUpdates =
							response.data.images?.map((img: any, idx: number) => ({
								localImageId:
									newImages[idx]?.imageId ||
									newImages[idx]?.uri.split("/").pop() ||
									"",
								serverImageId: img.id,
							})) || [];

						dispatch(
							updateSupportAfterSync({
								localId: support.localId || support.id,
								serverId: response.data.id,
								imageUpdates,
							}),
						);

						syncedCount++;
					} else {
						// UPDATE EXISTING SUPPORT
						const hasNewImages = support.images.some((img: any) => img.isNew);

						if (hasNewImages) {
							const newImages = support.images.filter((img: any) => img.isNew);
							const formData = new FormData();

							for (const image of newImages) {
								if (image.localPath) {
									try {
										const fileInfo = await FileSystem.getInfoAsync(
											image.localPath,
										);
										if (fileInfo.exists) {
											const filename =
												image.localPath.split("/").pop() ||
												`support_${Date.now()}.jpg`;
											const match = /\.(\w+)$/.exec(filename);
											const type = match ? `image/${match[1]}` : "image/jpeg";

											formData.append("images", {
												uri: image.localPath,
												type,
												name: filename,
											} as any);
										}
									} catch (error) {
										console.error("Error reading image:", error);
									}
								}
							}

							await apiClient.post(
								`/api/Support/AddSupportImages/${support.serverId || support.id}`,
								formData,
								{
									headers: {
										Authorization: `Bearer ${token}`,
										"Content-Type": "multipart/form-data",
									},
								},
							);
						}

						// Update support data
						const { localId, isNew, status, images, signs, ...supportData } =
							support;

						await apiClient.put(
							`/api/Support/Update/${support.serverId || support.id}`,
							supportData,
							{
								headers: { Authorization: `Bearer ${token}` },
							},
						);

						dispatch(
							updateSupportAfterSync({
								localId: support.localId || support.id,
								serverId: support.serverId || support.id,
								imageUpdates: [],
							}),
						);

						syncedCount++;
					}
				} catch (error: any) {
					console.error(`Failed to sync support ${support.id}:`, error);
					continue;
				}

				progress++;
				dispatch(updateProgress((progress / totalOperations) * 100));
			}

			// Cleanup orphaned images
			const allSignIds = state.signs.signs
				.filter((s: any) => s.status === SYNC_STATUS.SYNCED)
				.map((s: any) => s.id);

			const allSupportIds = state.supports.supports
				.filter((s: any) => s.status === SYNC_STATUS.SYNCED)
				.map((s: any) => s.id);

			await ImageStorage.cleanupImages([...allSignIds, ...allSupportIds]);

			return {
				synced: true,
				syncedCount,
				timestamp: Date.now(),
			};
		} catch (error: any) {
			return rejectWithValue(error.message || "Sync failed");
		}
	},
);

// Calculate pending operations
export const calculatePendingOperations = createAsyncThunk(
	"sync/calculatePending",
	async (_, { getState }) => {
		const state = getState() as any;

		const unsyncedSigns = state.signs.signs.filter(
			(s: any) => s.status === SYNC_STATUS.NOT_SYNCED,
		);

		const unsyncedSupports = state.supports.supports.filter(
			(s: any) => s.status === SYNC_STATUS.NOT_SYNCED,
		);

		const creates = [
			...unsyncedSigns.filter((s: any) => s.isNew),
			...unsyncedSupports.filter((s: any) => s.isNew),
		].length;

		const updates = [
			...unsyncedSigns.filter((s: any) => !s.isNew),
			...unsyncedSupports.filter((s: any) => !s.isNew),
		].length;

		const images = [
			...unsyncedSigns.flatMap((s: any) =>
				s.images.filter((img: any) => img.isNew),
			),
			...unsyncedSupports.flatMap((s: any) =>
				s.images.filter((img: any) => img.isNew),
			),
		].length;

		return {
			creates,
			updates,
			deletes: 0,
			images,
		};
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
				state.syncProgress = 100;
			})
			.addCase(startSync.rejected, (state, action) => {
				state.isSyncing = false;
				state.syncError = action.payload as string;
				state.currentOperation = null;
				state.syncProgress = 0;
			})
			.addCase(calculatePendingOperations.fulfilled, (state, action) => {
				state.pendingOperations = action.payload;
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
