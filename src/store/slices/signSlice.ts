import { apiClient } from "@/src/services/api/apiClient";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, ImageStorage, TokenStorage } from "../persistence";
import { Sign, SignImage } from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";

interface SignState {
	signs: Sign[];
	backendImages: Record<string, string>;
	isLoading: boolean;
	lastFetched: number | null;
}

const initialState: SignState = {
	signs: [],
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

const saveSignsToStorage = async (state: SignState) => {
	const serializedSigns = state.signs.map((sign) => ({
		...sign,
	}));

	await ReduxStorage.saveState("signs_data", {
		signs: serializedSigns,
		backendImages: state.backendImages,
		lastFetched: state.lastFetched,
	});
};

export const fetchSigns = createAsyncThunk(
	"signs/fetch",
	async (_, { rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No token");

			const response = await apiClient.get("api/Sign/GetSigns", {
				headers: { Authorization: `Bearer ${token}` },
			});

			const signs: Sign[] = (response.data || response).map((sign: any) => ({
				...sign,
				id: sign.id,
				serverId: sign.id,
				dateInstalled: sign.dateInstalled,
				isNew: false,
				status: SYNC_STATUS.SYNCED,
				images: (sign.images || []).map((img: any) => ({
					uri: img.url || img.uri,
					imageId: img.id,
					signId: sign.id,
					isNew: false,
					status: SYNC_STATUS.SYNCED,
				})),
			}));

			const backendImages: Record<string, string> = {};
			signs.forEach((sign) => {
				sign.images.forEach((img) => {
					if (img.imageId) {
						backendImages[img.imageId] = img.uri;
					}
				});
			});

			return { signs, backendImages };
		} catch (error: any) {
			return rejectWithValue(error.message || "Failed to fetch signs");
		}
	},
);
const signsSlice = createSlice({
	name: "signs",
	initialState,
	reducers: {
		// In the signSlice reducers section, update these:

		addSign: (
			state,
			action: PayloadAction<Omit<Sign, "id" | "status" | "isNew">>,
		) => {
			const localId = `local_sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const processedImages = (action.payload.images || []).map((img) => ({
				...img,
				signId: localId,
				isNew: true, // Ensure images are marked as new
				status: SYNC_STATUS.NOT_SYNCED,
			}));

			const newSign: Sign = {
				...action.payload,
				id: localId,
				localId,
				isNew: true,
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
				isNewImage?: boolean;
			}>,
		) => {
			const { id, updates, isNewImage } = action.payload;
			const signIndex = state.signs.findIndex((s) => s.id === id);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];

				// Only update status to NOT_SYNCED if:
				// 1. The sign was previously SYNCED, AND
				// 2. There are actual changes (new image or data updates)
				const shouldMarkUnsynced =
					sign.status === SYNC_STATUS.SYNCED &&
					(isNewImage || Object.keys(updates).length > 0);

				state.signs[signIndex] = {
					...sign,
					...updates,
					status: shouldMarkUnsynced ? SYNC_STATUS.NOT_SYNCED : sign.status,
				};

				saveSignsToStorage(state);
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
			const signIndex = state.signs.findIndex(
				(s) => s.id === localId || s.localId === localId,
			);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];

				// Update sign with server ID
				sign.id = serverId;
				sign.serverId = serverId;
				delete sign.localId;
				sign.status = SYNC_STATUS.SYNCED;
				sign.isNew = false;

				// Update images with server IDs
				sign.images.forEach((img) => {
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

				saveSignsToStorage(state);
			}
		},
		addImageToSign: (
			state,
			action: PayloadAction<{
				signId: string;
				imageUri: string;
				isNew: boolean;
			}>,
		) => {
			const { signId, imageUri, isNew } = action.payload;
			const signIndex = state.signs.findIndex((s) => s.id === signId);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];
				const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

				const newImage: SignImage = {
					uri: imageUri,
					signId,
					isNew,
					status: SYNC_STATUS.NOT_SYNCED,
					imageId: isNew ? undefined : imageId,
				};

				if (isNew) {
					ImageStorage.saveImage(imageUri, signId, imageId).then(
						(localPath) => {
							newImage.localPath = localPath;
						},
					);
				}

				sign.images.push(newImage);

				sign.status = SYNC_STATUS.NOT_SYNCED;

				saveSignsToStorage(state);
			}
		},

		removeImage: (
			state,
			action: PayloadAction<{ signId: string; imageId: string }>,
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
					sign.status = SYNC_STATUS.NOT_SYNCED;
					saveSignsToStorage(state);
				}
			}
		},

		markSignForDeletion: (state, action: PayloadAction<string>) => {
			const signIndex = state.signs.findIndex((s) => s.id === action.payload);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];

				if (sign.status === SYNC_STATUS.SYNCED) {
					sign.status = SYNC_STATUS.NOT_SYNCED;
					sign.isNew = false;
				} else {
					state.signs.splice(signIndex, 1);
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
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchSigns.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchSigns.fulfilled, (state, action) => {
				state.signs = action.payload.signs;
				state.backendImages = action.payload.backendImages;
				state.lastFetched = Date.now();
				state.isLoading = false;
				saveSignsToStorage(state);
			})
			.addCase(fetchSigns.rejected, (state) => {
				state.isLoading = false;
			});
	},
});

export const {
	addSign,
	updateSign,
	addImageToSign,
	removeImage,
	markSignForDeletion,
	loadSavedSigns,
	updateAfterSync,
} = signsSlice.actions;

export default signsSlice.reducer;
