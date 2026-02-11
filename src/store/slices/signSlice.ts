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

// ─── Async Thunks ──────────────────────────────────────────────────

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

// ─── Slice ─────────────────────────────────────────────────────────

const signsSlice = createSlice({
	name: "signs",
	initialState,
	reducers: {
		addSign: (
			state,
			action: PayloadAction<Omit<Sign, "id" | "status" | "isNew">>,
		) => {
			const localId = `local_sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const processedImages = (action.payload.images || []).map((img) => ({
				...img,
				signId: localId,
				isNew: true,
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

				// Check if non-image fields changed
				const { images: _, ...fieldUpdates } = updates;
				const hasFieldChanges = Object.keys(fieldUpdates).length > 0;

				const shouldMarkUnsynced =
					sign.status === SYNC_STATUS.SYNCED &&
					(hasImageChanges || hasFieldChanges);

				// Clean up local files for removed images
				if (hasImageChanges && updates.images) {
					const newImageIds = new Set(updates.images.map((img) => img.imageId));
					sign.images.forEach((existingImg) => {
						if (
							!newImageIds.has(existingImg.imageId) &&
							existingImg.localPath
						) {
							ImageStorage.deleteImage(existingImg.localPath);
						}
					});
				}

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
				imageUpdates: Array<{
					localImageId: string;
					serverImageId: string;
				}>;
			}>,
		) => {
			const { localId, serverId, imageUpdates } = action.payload;
			const signIndex = state.signs.findIndex(
				(s) => s.id === localId || s.localId === localId,
			);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];

				sign.id = serverId;
				sign.serverId = serverId;
				delete sign.localId;
				sign.status = SYNC_STATUS.SYNCED;
				sign.isNew = false;

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

		markSignForDeletion: (state, action: PayloadAction<string>) => {
			const signIndex = state.signs.findIndex((s) => s.id === action.payload);

			if (signIndex !== -1) {
				const sign = state.signs[signIndex];

				if (sign.status === SYNC_STATUS.SYNCED) {
					sign.status = SYNC_STATUS.NOT_SYNCED;
					sign.isNew = false;
				} else {
					sign.images.forEach((img) => {
						if (img.localPath) {
							ImageStorage.deleteImage(img.localPath);
						}
					});
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
	updateAfterSync,
	markSignForDeletion,
	loadSavedSigns,
} = signsSlice.actions;

export default signsSlice.reducer;
