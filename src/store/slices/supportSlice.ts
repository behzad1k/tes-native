import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, ImageStorage } from "../persistence";
import {
	SignSupportCode,
	Support,
	SupportImage,
	SystemOption,
	Sign,
} from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";
import {
	fetchJobs,
	fetchSignSupportData,
	fetchSignSupportSetups,
	syncSignSupportData,
	downloadSupportAttachments,
} from "../thunks";

interface SupportState {
	supports: Support[];
	backendImages: Record<string, string>;
	isLoading: boolean;
	lastFetched: number | null;
	// Setup options from backend
	codes: SignSupportCode[];
	descriptions: SystemOption[];
	types: SystemOption[];
	conditions: SystemOption[];
	materials: SystemOption[];
	positions: SystemOption[];
	locationTypes: SystemOption[];
}

const initialState: SupportState = {
	supports: [],
	backendImages: {},
	isLoading: false,
	lastFetched: null,
	codes: [],
	descriptions: [],
	types: [],
	conditions: [],
	materials: [],
	locationTypes: [],
	positions: [],
};

// Helper to save supports to storage
const saveSupportsToStorage = async (state: SupportState) => {
	try {
		await ReduxStorage.saveState("supports_data", {
			supports: state.supports,
			backendImages: state.backendImages,
			lastFetched: state.lastFetched,
		});
	} catch (error) {
		console.error("Error saving supports state:", error);
	}
};

// Helper to generate local ID
const generateLocalId = (): string => {
	return `local_support_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to generate UUID
const generateUUID = (): string => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

// Helper to merge backend supports with local unsynced supports
// Preserves local changes that haven't been synced yet
const mergeSupports = (
	backendSupports: Support[],
	localSupports: Support[],
): Support[] => {
	// Get all locally edited/unsynced supports
	const unsyncedLocalSupports = localSupports.filter(
		(support) => !support.isSynced || support.status === SYNC_STATUS.NOT_SYNCED,
	);

	// Create a map of unsynced supports by ID
	const unsyncedSupportsMap = new Map(
		unsyncedLocalSupports.map((support) => [support.id, support]),
	);

	// Merge: use local version if unsynced, otherwise use backend version
	const mergedSupports = backendSupports.map((backendSupport) => {
		const localSupport = unsyncedSupportsMap.get(backendSupport.id);
		if (localSupport && localSupport.status === SYNC_STATUS.NOT_SYNCED) {
			// Keep local unsynced version
			return localSupport;
		}
		return backendSupport;
	});

	// Add any locally created supports that aren't on backend yet
	const backendSupportIds = new Set(backendSupports.map((s) => s.id));
	const newLocalSupports = unsyncedLocalSupports.filter(
		(support) =>
			!backendSupportIds.has(support.id) &&
			(support.id.startsWith("local_") || support.isNew),
	);

	return [...mergedSupports, ...newLocalSupports];
};

// ─── Slice ─────────────────────────────────────────────────────────

const supportsSlice = createSlice({
	name: "supports",
	initialState,
	reducers: {
		addSupport: (
			state,
			action: PayloadAction<
				Omit<Support, "id" | "status" | "isNew" | "isSynced">
			>,
		) => {
			const localId = generateLocalId();

			// Process images with support ID
			const processedImages = (action.payload.images || []).map((img) => ({
				...img,
				supportId: localId,
				isNew: true,
				isSynced: false,
				status: SYNC_STATUS.NOT_SYNCED,
			}));

			// Process signs with support ID
			const processedSigns = (action.payload.signs || []).map((sign) => ({
				...sign,
				supportId: localId,
			}));

			const newSupport: Support = {
				...action.payload,
				id: localId,
				localId,
				isNew: true,
				isSynced: false,
				status: SYNC_STATUS.NOT_SYNCED,
				images: processedImages,
				signs: processedSigns,
			};

			state.supports.push(newSupport);
			saveSupportsToStorage(state);
		},

		updateSupport: (
			state,
			action: PayloadAction<{
				id: string;
				updates: Partial<Support>;
			}>,
		) => {
			const { id, updates } = action.payload;
			const supportIndex = state.supports.findIndex((s) => s.id === id);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];

				// Check if images changed
				const hasImageChanges =
					updates.images !== undefined &&
					JSON.stringify(updates.images) !== JSON.stringify(support.images);

				// Check if signs changed
				const hasSignChanges =
					updates.signs !== undefined &&
					JSON.stringify(updates.signs) !== JSON.stringify(support.signs);

				// Check if any field (other than images/signs) changed
				const { images: _, signs: __, ...fieldUpdates } = updates;
				const hasFieldChanges = Object.keys(fieldUpdates).length > 0;

				// Only mark as unsynced if there are actual changes and it was previously synced
				const shouldMarkUnsynced =
					support.status === SYNC_STATUS.SYNCED &&
					(hasImageChanges || hasFieldChanges || hasSignChanges);

				// If images changed, handle cleanup of removed images
				if (hasImageChanges && updates.images) {
					const newImageIds = new Set(updates.images.map((img) => img.imageId));
					support.images.forEach((existingImg) => {
						if (
							!newImageIds.has(existingImg.imageId) &&
							existingImg.localPath
						) {
							// Delete local file for removed image
							ImageStorage.deleteImage(existingImg.localPath);
						}
					});
				}

				state.supports[supportIndex] = {
					...support,
					...updates,
					isSynced: shouldMarkUnsynced ? false : support.isSynced,
					status: shouldMarkUnsynced ? SYNC_STATUS.NOT_SYNCED : support.status,
				};

				saveSupportsToStorage(state);
			}
		},

		updateSupportAfterSync: (
			state,
			action: PayloadAction<{
				localId: string;
				serverId: string;
				imageUpdates?: Array<{
					localImageId: string;
					serverImageId: string;
				}>;
			}>,
		) => {
			const { localId, serverId, imageUpdates = [] } = action.payload;
			const supportIndex = state.supports.findIndex(
				(s) => s.id === localId || s.localId === localId,
			);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];

				// Update support IDs
				support.id = serverId;
				support.serverId = serverId;
				delete support.localId;
				support.status = SYNC_STATUS.SYNCED;
				support.isNew = false;
				support.isSynced = true;

				// Update image IDs
				support.images.forEach((img) => {
					const update = imageUpdates.find(
						(u) =>
							img.imageId === u.localImageId ||
							img.uri.includes(u.localImageId) ||
							img.localPath?.includes(u.localImageId),
					);

					if (update) {
						img.imageId = update.serverImageId;
						img.isNew = false;
						img.isSynced = true;
					}
				});

				saveSupportsToStorage(state);
			}
		},

		markSupportForDeletion: (state, action: PayloadAction<string>) => {
			const supportIndex = state.supports.findIndex(
				(s) => s.id === action.payload,
			);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];

				if (support.status === SYNC_STATUS.SYNCED) {
					// Mark for deletion on next sync
					support.status = SYNC_STATUS.NOT_SYNCED;
					support.isSynced = false;
					support.isNew = false;
				} else {
					// Delete local images
					support.images.forEach((img) => {
						if (img.localPath) {
							ImageStorage.deleteImage(img.localPath);
						}
					});
					// Remove from store
					state.supports.splice(supportIndex, 1);
				}

				saveSupportsToStorage(state);
			}
		},

		addImageToSupport: (
			state,
			action: PayloadAction<{
				supportId: string;
				image: SupportImage;
			}>,
		) => {
			const { supportId, image } = action.payload;
			const supportIndex = state.supports.findIndex((s) => s.id === supportId);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];
				support.images.push(image);

				// Mark support as unsynced
				if (support.status === SYNC_STATUS.SYNCED) {
					support.status = SYNC_STATUS.NOT_SYNCED;
					support.isSynced = false;
				}

				saveSupportsToStorage(state);
			}
		},

		removeImageFromSupport: (
			state,
			action: PayloadAction<{
				supportId: string;
				imageId: string;
			}>,
		) => {
			const { supportId, imageId } = action.payload;
			const supportIndex = state.supports.findIndex((s) => s.id === supportId);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];
				const imageIndex = support.images.findIndex(
					(img) => img.imageId === imageId || img.uri.includes(imageId),
				);

				if (imageIndex !== -1) {
					const image = support.images[imageIndex];
					if (image.localPath) {
						ImageStorage.deleteImage(image.localPath);
					}
					support.images.splice(imageIndex, 1);

					// Mark support as unsynced
					if (support.status === SYNC_STATUS.SYNCED) {
						support.status = SYNC_STATUS.NOT_SYNCED;
						support.isSynced = false;
					}

					saveSupportsToStorage(state);
				}
			}
		},

		addSignToSupport: (
			state,
			action: PayloadAction<{
				supportId: string;
				sign: Sign;
			}>,
		) => {
			const { supportId, sign } = action.payload;
			const supportIndex = state.supports.findIndex((s) => s.id === supportId);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];

				// Check if sign already exists
				const signExists = support.signs.some((s) => s.id === sign.id);
				if (!signExists) {
					// Add sign with updated supportId
					support.signs.push({
						...sign,
						supportId,
					});

					// Mark support as unsynced
					if (support.status === SYNC_STATUS.SYNCED) {
						support.status = SYNC_STATUS.NOT_SYNCED;
						support.isSynced = false;
					}

					saveSupportsToStorage(state);
				}
			}
		},

		removeSignFromSupport: (
			state,
			action: PayloadAction<{
				supportId: string;
				signId: string;
			}>,
		) => {
			const { supportId, signId } = action.payload;
			const supportIndex = state.supports.findIndex((s) => s.id === supportId);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];
				const signIndex = support.signs.findIndex((s) => s.id === signId);

				if (signIndex !== -1) {
					support.signs.splice(signIndex, 1);

					// Mark support as unsynced
					if (support.status === SYNC_STATUS.SYNCED) {
						support.status = SYNC_STATUS.NOT_SYNCED;
						support.isSynced = false;
					}

					saveSupportsToStorage(state);
				}
			}
		},

		updateSignInSupport: (
			state,
			action: PayloadAction<{
				supportId: string;
				sign: Sign;
			}>,
		) => {
			const { supportId, sign } = action.payload;
			const supportIndex = state.supports.findIndex((s) => s.id === supportId);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];
				const signIndex = support.signs.findIndex((s) => s.id === sign.id);

				if (signIndex !== -1) {
					support.signs[signIndex] = {
						...sign,
						supportId,
					};

					// Mark support as unsynced
					if (support.status === SYNC_STATUS.SYNCED) {
						support.status = SYNC_STATUS.NOT_SYNCED;
						support.isSynced = false;
					}

					saveSupportsToStorage(state);
				}
			}
		},

		loadSavedSupports: (
			state,
			action: PayloadAction<{
				supports: Support[];
				backendImages: Record<string, string>;
				lastFetched: number | null;
			}>,
		) => {
			state.supports = action.payload.supports;
			state.backendImages = action.payload.backendImages;
			state.lastFetched = action.payload.lastFetched;
		},

		clearAllSupports: (state) => {
			// Delete all local images
			state.supports.forEach((support) => {
				support.images.forEach((img) => {
					if (img.localPath) {
						ImageStorage.deleteImage(img.localPath);
					}
				});
			});
			state.supports = [];
			state.backendImages = {};
			saveSupportsToStorage(state);
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch setups
			.addCase(fetchSignSupportSetups.fulfilled, (state, action) => {
				state.codes = action.payload.supportCode;
				state.descriptions = action.payload.supportDescription;
				state.types = action.payload.supportType;
				state.conditions = action.payload.supportCondition;
				state.materials = action.payload.supportMaterial;
				state.locationTypes = action.payload.supportLocationType;
				state.positions = action.payload.supportPosition;
				state.isLoading = false;
				state.lastFetched = Date.now();
			})

			// Fetch jobs (includes supports)
			.addCase(fetchJobs.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchJobs.fulfilled, (state, action) => {
				// Merge backend supports with local unsynced supports
				state.supports = mergeSupports(action.payload.supports, state.supports);
				state.isLoading = false;
				state.lastFetched = Date.now();
				saveSupportsToStorage(state);
			})
			.addCase(fetchJobs.rejected, (state) => {
				state.isLoading = false;
			})

			// Fetch sign/support data
			.addCase(fetchSignSupportData.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchSignSupportData.fulfilled, (state, action) => {
				// Merge backend supports with local unsynced supports
				state.supports = mergeSupports(action.payload.supports, state.supports);
				state.isLoading = false;
				state.lastFetched = Date.now();
				saveSupportsToStorage(state);
			})
			.addCase(fetchSignSupportData.rejected, (state) => {
				state.isLoading = false;
			})

			// Sync sign/support data
			.addCase(syncSignSupportData.fulfilled, (state, action) => {
				// Mark synced supports
				action.payload.syncedSupportIds.forEach((supportId) => {
					const support = state.supports.find((s) => s.id === supportId);
					if (support) {
						support.status = SYNC_STATUS.SYNCED;
						support.isSynced = true;
						support.isNew = false;
					}
				});

				// Mark synced images
				action.payload.syncedImageIds.forEach((imageId) => {
					state.supports.forEach((support) => {
						const image = support.images.find(
							(img) => img.imageId === imageId || img.uri.includes(imageId),
						);
						if (image) {
							image.isSynced = true;
							image.isNew = false;
						}
					});
				});

				saveSupportsToStorage(state);
			})

			// Download attachments
			.addCase(downloadSupportAttachments.fulfilled, (state, action) => {
				const { supportId, images } = action.payload;
				const support = state.supports.find((s) => s.id === supportId);

				if (support) {
					// Add downloaded images that don't already exist
					images.forEach((downloadedImg) => {
						const exists = support.images.some(
							(img) => img.imageId === downloadedImg.imageId,
						);
						if (!exists) {
							support.images.push(downloadedImg);
						}
					});

					saveSupportsToStorage(state);
				}
			});
	},
});

export const {
	addSupport,
	updateSupport,
	updateSupportAfterSync,
	markSupportForDeletion,
	addImageToSupport,
	removeImageFromSupport,
	addSignToSupport,
	removeSignFromSupport,
	updateSignInSupport,
	loadSavedSupports,
	clearAllSupports,
} = supportsSlice.actions;

export default supportsSlice.reducer;
