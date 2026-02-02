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

			const response = await apiClient.get("/signs", {
				headers: { Authorization: `Bearer ${token}` },
			});

			const signs: Sign[] = response.data.map((sign: any) => ({
				...sign,
				dateInstalled: sign.dateInstalled,
				isNew: false,
				status: SYNC_STATUS.SYNCED,
				images: sign.images.map((img: any) => ({
					...img,
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
		} catch (error) {
			return rejectWithValue(error.message);
		}
	},
);

const signsSlice = createSlice({
	name: "signs",
	initialState,
	reducers: {
		addSign: (
			state,
			action: PayloadAction<Omit<Sign, "id" | "status" | "isNew">>,
		) => {
			const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const dateInstalled = action.payload.dateInstalled;

			const processedImages = (action.payload.images || []).map((img) => ({
				...img,
				signId: localId,
			}));

			const newSign: Sign = {
				...action.payload,
				dateInstalled,
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

				const serializedUpdates = { ...updates };
				if (updates.dateInstalled) {
					serializedUpdates.dateInstalled = updates.dateInstalled;
				}

				const status =
					sign.status === SYNC_STATUS.SYNCED &&
					(isNewImage || Object.keys(serializedUpdates).length > 0)
						? SYNC_STATUS.NOT_SYNCED
						: sign.status;

				state.signs[signIndex] = {
					...sign,
					...serializedUpdates,
					status,
				};

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

		updateAfterSync: (
			state,
			action: PayloadAction<{
				localId: string;
				serverId: string;
				imageUpdates: Array<{ localImageId: string; serverImageId: string }>;
			}>,
		) => {
			const { localId, serverId, imageUpdates } = action.payload;
			const signIndex = state.signs.findIndex((s) => s.localId === localId);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];

				sign.id = serverId;
				sign.serverId = serverId;
				delete sign.localId;
				sign.status = SYNC_STATUS.SYNCED;
				sign.isNew = false;

				sign.images.forEach((img, idx) => {
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

				saveSignsToStorage(state);
			}
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
