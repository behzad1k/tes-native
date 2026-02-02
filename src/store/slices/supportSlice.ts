import { apiClient } from "@/src/services/api/apiClient";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, ImageStorage, TokenStorage } from "../persistence";
import { Support, SupportImage } from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";

interface SupportState {
	supports: Support[];
	backendImages: Record<string, string>;
	isLoading: boolean;
	lastFetched: number | null;
}

const initialState: SupportState = {
	supports: [],
	backendImages: {},
	isLoading: false,
	lastFetched: null,
};

const serializeDate = (date: Date | string): string => {
	if (typeof date === "string") return date;
	return date.toISOString();
};

const deserializeDate = (dateString: string): Date => {
	return new Date(dateString);
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

			const response = await apiClient.get("/supports", {
				headers: { Authorization: `Bearer ${token}` },
			});

			const supports: Support[] = response.data.map((support: any) => ({
				...support,
				dateInstalled: support.dateInstalled,
				isNew: false,
				status: SYNC_STATUS.SYNCED,
				images: support.images.map((img: any) => ({
					...img,
					isNew: false,
					status: SYNC_STATUS.SYNCED,
				})),
			}));

			const backendImages: Record<string, string> = {};
			supports.forEach((support) => {
				support.images.forEach((img) => {
					if (img.imageId) {
						backendImages[img.imageId] = img.uri;
					}
				});
			});

			return { supports, backendImages };
		} catch (error) {
			return rejectWithValue(error.message);
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
			const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const dateInstalled = action.payload.dateInstalled;

			const processedImages = (action.payload.images || []).map((img) => ({
				...img,
				supportId: localId,
			}));

			const newSupport: Support = {
				...action.payload,
				dateInstalled,
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

				const serializedUpdates = { ...updates };
				if (updates.dateInstalled) {
					serializedUpdates.dateInstalled = updates.dateInstalled;
				}

				const status =
					support.status === SYNC_STATUS.SYNCED &&
					(isNewImage || Object.keys(serializedUpdates).length > 0)
						? SYNC_STATUS.NOT_SYNCED
						: support.status;

				state.supports[supportIndex] = {
					...support,
					...serializedUpdates,
					status,
				};

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
				(s) => s.localId === localId,
			);

			if (supportIndex !== -1) {
				const support = state.supports[supportIndex];

				support.id = serverId;
				delete support.localId;
				support.status = SYNC_STATUS.SYNCED;
				support.isNew = false;

				support.images.forEach((img, idx) => {
					const update = imageUpdates.find(
						(u) =>
							img.uri.includes(u.localImageId) ||
							img.localPath?.includes(u.localImageId),
					);
					if (update) {
						img.imageId = update.serverImageId;
						img.status = SYNC_STATUS.SYNCED;
						img.isNew = false;

						if (img.uri.startsWith("http")) {
							state.backendImages[update.serverImageId] = img.uri;
						}
					}
				});

				saveSupportsToStorage(state);
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchSupports.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchSupports.fulfilled, (state, action) => {
				state.supports = action.payload.supports;
				state.backendImages = action.payload.backendImages;
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
