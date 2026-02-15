import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, ImageStorage } from "../persistence";
import {
	Sign,
	SignSupportCode,
	SignImage,
	SystemOption,
} from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";
import {
	fetchJobs,
	fetchSignSupportData,
	fetchSignSupportSetups,
	syncSignSupportData,
	downloadSignAttachments,
} from "../thunks";

interface SignState {
	signs: Sign[];
	backendImages: Record<string, string>;
	isLoading: boolean;
	lastFetched: number | null;
	// Setup options from backend
	codes: SignSupportCode[];
	descriptions: SystemOption[];
	dimensions: SystemOption[];
	types: SystemOption[];
	conditions: SystemOption[];
	faceMaterials: SystemOption[];
	facingDirections: SystemOption[];
	locationTypes: SystemOption[];
	reflectiveCoatings: SystemOption[];
	reflectiveRatings: SystemOption[];
}

const initialState: SignState = {
	signs: [],
	backendImages: {},
	isLoading: false,
	lastFetched: null,
	codes: [],
	descriptions: [],
	dimensions: [],
	types: [],
	conditions: [],
	faceMaterials: [],
	facingDirections: [],
	locationTypes: [],
	reflectiveCoatings: [],
	reflectiveRatings: [],
};

// Helper to save signs to storage
const saveSignsToStorage = async (state: SignState) => {
	try {
		await ReduxStorage.saveState("signs_data", {
			signs: state.signs,
			backendImages: state.backendImages,
			lastFetched: state.lastFetched,
		});
	} catch (error) {
		console.error("Error saving signs state:", error);
	}
};

// Helper to generate local ID
const generateLocalId = (): string => {
	return `local_sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to generate UUID
const generateUUID = (): string => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

// Helper to merge backend signs with local unsynced signs
// Preserves local changes that haven't been synced yet
const mergeSigns = (backendSigns: Sign[], localSigns: Sign[]): Sign[] => {
	// Get all locally edited/unsynced signs
	const unsyncedLocalSigns = localSigns.filter(
		(sign) => !sign.isSynced || sign.status === SYNC_STATUS.NOT_SYNCED,
	);

	// Create a map of unsynced signs by ID
	const unsyncedSignsMap = new Map(
		unsyncedLocalSigns.map((sign) => [sign.id, sign]),
	);

	// Merge: use local version if unsynced, otherwise use backend version
	const mergedSigns = backendSigns.map((backendSign) => {
		const localSign = unsyncedSignsMap.get(backendSign.id);
		if (localSign && localSign.status === SYNC_STATUS.NOT_SYNCED) {
			// Keep local unsynced version
			return localSign;
		}
		return backendSign;
	});

	// Add any locally created signs that aren't on backend yet
	const backendSignIds = new Set(backendSigns.map((s) => s.id));
	const newLocalSigns = unsyncedLocalSigns.filter(
		(sign) =>
			!backendSignIds.has(sign.id) &&
			(sign.id.startsWith("local_") || sign.isNew),
	);

	return [...mergedSigns, ...newLocalSigns];
};

// ─── Slice ─────────────────────────────────────────────────────────

const signsSlice = createSlice({
	name: "signs",
	initialState,
	reducers: {
		addSign: (
			state,
			action: PayloadAction<Omit<Sign, "id" | "status" | "isNew" | "isSynced">>,
		) => {
			const localId = generateLocalId();

			// Process images with sign ID
			const processedImages = (action.payload.images || []).map((img) => ({
				...img,
				signId: localId,
				isNew: true,
				isSynced: false,
				status: SYNC_STATUS.NOT_SYNCED,
			}));

			const newSign: Sign = {
				...action.payload,
				id: localId,
				localId,
				isNew: true,
				isSynced: false,
				status: SYNC_STATUS.NOT_SYNCED,
				images: processedImages,
			};

			state.signs.push(newSign);
			saveSignsToStorage(state);
		},

		updateSign: (
			state,
			action: PayloadAction<{
				id: string;
				updates: Partial<Sign>;
			}>,
		) => {
			const { id, updates } = action.payload;
			const signIndex = state.signs.findIndex((s) => s.id === id);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];

				// Check if images changed
				const hasImageChanges =
					updates.images !== undefined &&
					JSON.stringify(updates.images) !== JSON.stringify(sign.images);

				// Check if any field (other than images) changed
				const { images: _, ...fieldUpdates } = updates;
				const hasFieldChanges = Object.keys(fieldUpdates).length > 0;

				// Only mark as unsynced if there are actual changes and it was previously synced
				const shouldMarkUnsynced =
					sign.status === SYNC_STATUS.SYNCED &&
					(hasImageChanges || hasFieldChanges);

				// If images changed, handle cleanup of removed images
				if (hasImageChanges && updates.images) {
					const newImageIds = new Set(updates.images.map((img) => img.imageId));
					sign.images.forEach((existingImg) => {
						if (
							!newImageIds.has(existingImg.imageId) &&
							existingImg.localPath
						) {
							// Delete local file for removed image
							ImageStorage.deleteImage(existingImg.localPath);
						}
					});
				}

				state.signs[signIndex] = {
					...sign,
					...updates,
					isSynced: shouldMarkUnsynced ? false : sign.isSynced,
					status: shouldMarkUnsynced ? SYNC_STATUS.NOT_SYNCED : sign.status,
				};

				saveSignsToStorage(state);
			}
		},

		updateSignAfterSync: (
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
			const signIndex = state.signs.findIndex(
				(s) => s.id === localId || s.localId === localId,
			);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];

				// Update sign IDs
				sign.id = serverId;
				sign.serverId = serverId;
				delete sign.localId;
				sign.status = SYNC_STATUS.SYNCED;
				sign.isNew = false;
				sign.isSynced = true;

				// Update image IDs
				sign.images.forEach((img) => {
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

				saveSignsToStorage(state);
			}
		},

		markSignForDeletion: (state, action: PayloadAction<string>) => {
			const signIndex = state.signs.findIndex((s) => s.id === action.payload);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];

				if (sign.status === SYNC_STATUS.SYNCED) {
					// Mark for deletion on next sync
					sign.status = SYNC_STATUS.NOT_SYNCED;
					sign.isSynced = false;
					sign.isNew = false;
				} else {
					// Delete local images
					sign.images.forEach((img) => {
						if (img.localPath) {
							ImageStorage.deleteImage(img.localPath);
						}
					});
					// Remove from store
					state.signs.splice(signIndex, 1);
				}

				saveSignsToStorage(state);
			}
		},

		addImageToSign: (
			state,
			action: PayloadAction<{
				signId: string;
				image: SignImage;
			}>,
		) => {
			const { signId, image } = action.payload;
			const signIndex = state.signs.findIndex((s) => s.id === signId);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];
				sign.images.push(image);

				// Mark sign as unsynced
				if (sign.status === SYNC_STATUS.SYNCED) {
					sign.status = SYNC_STATUS.NOT_SYNCED;
					sign.isSynced = false;
				}

				saveSignsToStorage(state);
			}
		},

		removeImageFromSign: (
			state,
			action: PayloadAction<{
				signId: string;
				imageId: string;
			}>,
		) => {
			const { signId, imageId } = action.payload;
			const signIndex = state.signs.findIndex((s) => s.id === signId);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];
				const imageIndex = sign.images.findIndex(
					(img) => img.imageId === imageId || img.uri.includes(imageId),
				);

				if (imageIndex !== -1) {
					const image = sign.images[imageIndex];
					if (image.localPath) {
						ImageStorage.deleteImage(image.localPath);
					}
					sign.images.splice(imageIndex, 1);

					// Mark sign as unsynced
					if (sign.status === SYNC_STATUS.SYNCED) {
						sign.status = SYNC_STATUS.NOT_SYNCED;
						sign.isSynced = false;
					}

					saveSignsToStorage(state);
				}
			}
		},

		assignSignToSupport: (
			state,
			action: PayloadAction<{
				signId: string;
				supportId: string;
			}>,
		) => {
			const { signId, supportId } = action.payload;
			const signIndex = state.signs.findIndex((s) => s.id === signId);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];
				sign.supportId = supportId;

				// Mark as unsynced
				if (sign.status === SYNC_STATUS.SYNCED) {
					sign.status = SYNC_STATUS.NOT_SYNCED;
					sign.isSynced = false;
				}

				saveSignsToStorage(state);
			}
		},

		unassignSignFromSupport: (state, action: PayloadAction<string>) => {
			const signId = action.payload;
			const signIndex = state.signs.findIndex((s) => s.id === signId);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];
				sign.supportId = undefined;

				// Mark as unsynced
				if (sign.status === SYNC_STATUS.SYNCED) {
					sign.status = SYNC_STATUS.NOT_SYNCED;
					sign.isSynced = false;
				}

				saveSignsToStorage(state);
			}
		},

		loadSavedSigns: (
			state,
			action: PayloadAction<{
				signs: Sign[];
				backendImages: Record<string, string>;
				lastFetched: number | null;
			}>,
		) => {
			state.signs = action.payload.signs;
			state.backendImages = action.payload.backendImages;
			state.lastFetched = action.payload.lastFetched;
		},

		clearAllSigns: (state) => {
			// Delete all local images
			state.signs.forEach((sign) => {
				sign.images.forEach((img) => {
					if (img.localPath) {
						ImageStorage.deleteImage(img.localPath);
					}
				});
			});
			state.signs = [];
			state.backendImages = {};
			saveSignsToStorage(state);
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch setups
			.addCase(fetchSignSupportSetups.fulfilled, (state, action) => {
				state.codes = action.payload.signCode;
				state.descriptions = action.payload.signDescription;
				state.types = action.payload.signType;
				state.conditions = action.payload.signCondition;
				state.dimensions = action.payload.signDimension;
				state.faceMaterials = action.payload.signFaceMaterial;
				state.facingDirections = action.payload.signFacingDirection;
				state.locationTypes = action.payload.signLocationType;
				state.reflectiveCoatings = action.payload.signReflectiveCoating;
				state.reflectiveRatings = action.payload.signReflectiveRating;
				state.isLoading = false;
				state.lastFetched = Date.now();
			})

			// Fetch jobs (includes signs)
			.addCase(fetchJobs.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchJobs.fulfilled, (state, action) => {
				// Merge backend signs with local unsynced signs
				state.signs = mergeSigns(action.payload.signWithouSupport, state.signs);
				state.isLoading = false;
				state.lastFetched = Date.now();
				saveSignsToStorage(state);
			})
			.addCase(fetchJobs.rejected, (state) => {
				state.isLoading = false;
			})

			// Fetch sign/support data
			.addCase(fetchSignSupportData.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchSignSupportData.fulfilled, (state, action) => {
				// Merge backend signs with local unsynced signs
				state.signs = mergeSigns(
					action.payload.signsWithoutSupport,
					state.signs,
				);
				state.isLoading = false;
				state.lastFetched = Date.now();
				saveSignsToStorage(state);
			})
			.addCase(fetchSignSupportData.rejected, (state) => {
				state.isLoading = false;
			})

			// Sync sign/support data
			.addCase(syncSignSupportData.fulfilled, (state, action) => {
				// Mark synced signs
				action.payload.syncedSignIds.forEach((signId) => {
					const sign = state.signs.find((s) => s.id === signId);
					if (sign) {
						sign.status = SYNC_STATUS.SYNCED;
						sign.isSynced = true;
						sign.isNew = false;
					}
				});

				// Mark synced images
				action.payload.syncedImageIds.forEach((imageId) => {
					state.signs.forEach((sign) => {
						const image = sign.images.find(
							(img) => img.imageId === imageId || img.uri.includes(imageId),
						);
						if (image) {
							image.isSynced = true;
							image.isNew = false;
						}
					});
				});

				saveSignsToStorage(state);
			})

			// Download attachments
			.addCase(downloadSignAttachments.fulfilled, (state, action) => {
				const { signId, images } = action.payload;
				const sign = state.signs.find((s) => s.id === signId);

				if (sign) {
					// Add downloaded images that don't already exist
					images.forEach((downloadedImg) => {
						const exists = sign.images.some(
							(img) => img.imageId === downloadedImg.imageId,
						);
						if (!exists) {
							sign.images.push(downloadedImg);
						}
					});

					saveSignsToStorage(state);
				}
			});
	},
});

export const {
	addSign,
	updateSign,
	updateSignAfterSync,
	markSignForDeletion,
	addImageToSign,
	removeImageFromSign,
	assignSignToSupport,
	unassignSignFromSupport,
	loadSavedSigns,
	clearAllSigns,
} = signsSlice.actions;

export default signsSlice.reducer;
