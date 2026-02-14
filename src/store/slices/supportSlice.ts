import { apiClient } from "@/src/services/api/apiClient";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, ImageStorage, TokenStorage } from "../persistence";
import {
	SignSupportCode,
	Support,
	SupportImage,
	SystemOption,
} from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";
import {
	fetchJobs,
	fetchSignSupportData,
	fetchSignSupportSetups,
} from "../thunks";

interface SupportState {
	supports: Support[];
	backendImages: Record<string, string>;
	isLoading: boolean;
	lastFetched: number | null;
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

// Helper to merge backend supports with local unsynced supports
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

export const fetchSupports = createAsyncThunk(
	"supports/fetch",
	async (_, { rejectWithValue }) => {
		try {
			const response = await apiClient.get("api/Support/GetSupports", {});

			const supports: Support[] = (response.data || response).map(
				(support: any) => ({
					...support,
					id: support.id,
					serverId: support.id,
					dateInstalled: support.dateInstalled,
					isNew: false,
					isSynced: true,
					status: SYNC_STATUS.SYNCED,
					signs: support.signs || [],
					images: (support.images || []).map((img: any) => ({
						uri: img.url || img.uri,
						imageId: img.id,
						supportId: support.id,
						isNew: false,
						isSynced: true,
						status: SYNC_STATUS.SYNCED,
					})),
				}),
			);

			const backendImages: Record<string, string> = {};
			supports.forEach((support) => {
				support.images.forEach((img) => {
					if (img.imageId) {
						backendImages[img.imageId] = img.uri;
					}
				});
			});

			return { supports, backendImages };
		} catch (error: any) {
			return rejectWithValue(error.message || "Failed to fetch supports");
		}
	},
);

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
			const localId = `local_support_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const processedImages = (action.payload.images || []).map((img) => ({
				...img,
				supportId: localId,
				isNew: true,
				isSynced: false,
				status: SYNC_STATUS.NOT_SYNCED,
			}));

			const newSupport: Support = {
				...action.payload,
				id: localId,
				localId,
				isNew: true,
				isSynced: false,
				status: SYNC_STATUS.NOT_SYNCED,
				images: processedImages,
			};

			state.supports.push(newSupport);
			saveSupportsToStorage(state);
		},

		updateSupport: (
			state,
			action: PayloadAction<{
				id: string;
				updates: Partial<Support>;
				isNewImage?: boolean;
			}>,
		) => {
			const { id, updates, isNewImage } = action.payload;
			const supportIndex = state.supports.findIndex((s) => s.id === id);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];

				const shouldMarkUnsynced =
					support.status === SYNC_STATUS.SYNCED &&
					(isNewImage || Object.keys(updates).length > 0);

				state.supports[supportIndex] = {
					...support,
					...updates,
					isSynced: shouldMarkUnsynced ? false : support.isSynced,
					status: shouldMarkUnsynced ? SYNC_STATUS.NOT_SYNCED : support.status,
				};

				saveSupportsToStorage(state);
			}
		},

		updateAfterSync: (
			state,
			action: PayloadAction<{
				localId: string;
				serverId: string;
				imageUpdates: Array<{ localImageId: string; serverImageId: string }>;
			}>,
		) => {
			const { localId, serverId, imageUpdates } = action.payload;
			const supportIndex = state.supports.findIndex(
				(s) => s.id === localId || s.localId === localId,
			);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];

				support.id = serverId;
				delete support.localId;
				support.status = SYNC_STATUS.SYNCED;
				support.isNew = false;
				support.isSynced = true;

				support.images.forEach((img) => {
					const update = imageUpdates.find(
						(u) =>
							img.imageId === u.localImageId ||
							img.uri.includes(u.localImageId) ||
							img.localPath?.includes(u.localImageId),
					);

					if (update) {
						img.imageId = update.serverImageId;
						img.status = SYNC_STATUS.SYNCED;
						img.isNew = false;
						img.isSynced = true;
					}
				});

				saveSupportsToStorage(state);
			}
		},

		addImageToSupport: (
			state,
			action: PayloadAction<{
				supportId: string;
				imageUri: string;
				isNew: boolean;
			}>,
		) => {
			const { supportId, imageUri, isNew } = action.payload;
			const supportIndex = state.supports.findIndex((s) => s.id === supportId);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];
				const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

				const newImage: SupportImage = {
					uri: imageUri,
					supportId,
					isNew,
					isSynced: false,
					status: SYNC_STATUS.NOT_SYNCED,
					imageId: isNew ? undefined : imageId,
				};

				if (isNew) {
					ImageStorage.saveImage(imageUri, supportId, imageId).then(
						(localPath) => {
							newImage.localPath = localPath;
						},
					);
				}

				support.images.push(newImage);
				support.status = SYNC_STATUS.NOT_SYNCED;
				support.isSynced = false;

				saveSupportsToStorage(state);
			}
		},

		removeImage: (
			state,
			action: PayloadAction<{ supportId: string; imageId: string }>,
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
					support.status = SYNC_STATUS.NOT_SYNCED;
					support.isSynced = false;
					saveSupportsToStorage(state);
				}
			}
		},

		markSupportForDeletion: (state, action: PayloadAction<string>) => {
			const supportIndex = state.supports.findIndex(
				(s) => s.id === action.payload,
			);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];

				if (support.status === SYNC_STATUS.SYNCED) {
					support.status = SYNC_STATUS.NOT_SYNCED;
					support.isSynced = false;
					support.isNew = false;
				} else {
					state.supports.splice(supportIndex, 1);
				}

				saveSupportsToStorage(state);
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
	},
	extraReducers: (builder) => {
		builder
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
			.addCase(fetchSupports.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchJobs.fulfilled, (state, action) => {
				// Merge backend supports with local unsynced supports
				state.supports = mergeSupports(action.payload.supports, state.supports);
				state.lastFetched = Date.now();
				state.isLoading = false;
				saveSupportsToStorage(state);
			})
			.addCase(fetchSupports.rejected, (state) => {
				state.isLoading = false;
			});
	},
});

export const {
	addSupport,
	updateSupport,
	addImageToSupport,
	removeImage,
	markSupportForDeletion,
	loadSavedSupports,
	updateAfterSync,
} = supportsSlice.actions;

export default supportsSlice.reducer;
