import { apiClient } from "@/src/services/api/apiClient";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, ImageStorage, TokenStorage } from "../persistence";
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
} from "../thunks";

interface SignState {
	signs: Sign[];
	backendImages: Record<string, string>;
	isLoading: boolean;
	lastFetched: number | null;
	codes: SignSupportCode[];
	descriptions: SystemOption[];
	dimensions: SystemOption[];
	types: SystemOption[];
	conditions: SystemOption[];
	faceMaterials: SystemOption[];
	facingDirections: SystemOption[];
	locationTypes: SystemOption[];
	reflectiveCoatings: SystemOption[];
	reflectiveRating: SystemOption[];
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
	reflectiveRating: [],
};

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

// Helper to merge backend signs with local unsynced signs
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

// ─── Async Thunks ──────────────────────────────────────────────────

export const fetchSigns = createAsyncThunk(
	"signs/fetch",
	async (_, { rejectWithValue }) => {
		try {
			const response = await apiClient.get("api/Sign/GetSigns", {});

			const signs: Sign[] = (response.data || response).map((sign: any) => ({
				...sign,
				id: sign.id,
				serverId: sign.id,
				dateInstalled: sign.dateInstalled,
				isNew: false,
				isSynced: true,
				status: SYNC_STATUS.SYNCED,
				images: (sign.images || []).map((img: any) => ({
					uri: img.url || img.uri,
					imageId: img.id,
					signId: sign.id,
					isNew: false,
					isSynced: true,
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
			action: PayloadAction<Omit<Sign, "id" | "status" | "isNew" | "isSynced">>,
		) => {
			const localId = `local_sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

				const hasImageChanges =
					updates.images !== undefined &&
					JSON.stringify(updates.images) !== JSON.stringify(sign.images);

				const { images: _, ...fieldUpdates } = updates;
				const hasFieldChanges = Object.keys(fieldUpdates).length > 0;

				const shouldMarkUnsynced =
					sign.status === SYNC_STATUS.SYNCED &&
					(hasImageChanges || hasFieldChanges);

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
					isSynced: shouldMarkUnsynced ? false : sign.isSynced,
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
				sign.isSynced = true;

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
					sign.status = SYNC_STATUS.NOT_SYNCED;
					sign.isSynced = false;
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
				state.reflectiveRating = action.payload.signReflectiveRating;
				state.isLoading = false;
				state.lastFetched = Date.now();
			})
			.addCase(fetchSigns.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchJobs.fulfilled, (state, action) => {
				// Merge backend signs with local unsynced signs
				state.signs = mergeSigns(action.payload.signWithouSupport, state.signs);
				state.isLoading = false;
				state.lastFetched = Date.now();
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
