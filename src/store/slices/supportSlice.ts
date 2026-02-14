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

const serializeDate = (date: Date | string): string => {
	if (typeof date === "string") return date;
	return date.toISOString();
};

const saveSupportsToStorage = async (state: SupportState) => {
	const serializedSupports = state.supports.map((support) => ({
		...support,
	}));

	await ReduxStorage.saveState("supports_data", {
		supports: serializedSupports,
		backendImages: state.backendImages,
		lastFetched: state.lastFetched,
	});
};

export const fetchSupports = createAsyncThunk(
	"supports/fetch",
	async (_, { rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No token");

			const response = await apiClient.get("api/Sign/GetSigns", {
				headers: { Authorization: `Bearer ${token}` },
			});

			const supports: Support[] = (response.data || response).map(
				(support: any) => ({
					...support,
					id: support.id,
					serverId: support.id,
					dateInstalled: support.dateInstalled,
					isNew: false,
					status: SYNC_STATUS.SYNCED,
					images: (support.images || []).map((img: any) => ({
						uri: img.url || img.uri,
						imageId: img.id,
						supportId: support.id,
						isNew: false,
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
			action: PayloadAction<Omit<Support, "id" | "status" | "isNew">>,
		) => {
			const localId = `local_support_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const processedImages = (action.payload.images || []).map((img) => ({
				...img,
				supportId: localId,
				isNew: true, // Ensure images are marked as new
				status: SYNC_STATUS.NOT_SYNCED,
			}));

			const newSupport: Support = {
				...action.payload,
				id: localId,
				localId,
				isNew: true,
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

				// Only update status to NOT_SYNCED if:
				// 1. The support was previously SYNCED, AND
				// 2. There are actual changes (new image or data updates)
				const shouldMarkUnsynced =
					support.status === SYNC_STATUS.SYNCED &&
					(isNewImage || Object.keys(updates).length > 0);

				state.supports[supportIndex] = {
					...support,
					...updates,
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

				// Update support with server ID
				support.id = serverId;
				// support.serverId = serverId;
				delete support.localId;
				support.status = SYNC_STATUS.SYNCED;
				support.isNew = false;

				// Update images with server IDs
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
				state.codes = action.payload.setups.supportCode;
				state.descriptions = action.payload.setups.supportDescription;
				state.types = action.payload.setups.supportType;
				state.conditions = action.payload.setups.supportCondition;
				state.materials = action.payload.setups.supportMaterial;
				state.locationTypes = action.payload.setups.supportLocationType;
				state.positions = action.payload.setups.supportLocationType;
				state.isLoading = false;
				state.lastFetched = Date.now();
			})
			.addCase(fetchSupports.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchJobs.fulfilled, (state, action) => {
				state.supports = [
					...state.supports.filter(
						(x) => x.isNew == true && x.status == SYNC_STATUS.NOT_SYNCED,
					),
					...action.payload.supports,
				];
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
