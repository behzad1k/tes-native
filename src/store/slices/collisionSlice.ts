import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, ImageStorage } from "../persistence";
import { SYNC_STATUS } from "@/src/constants/global";
import {
	Collision,
	CollisionImage,
	CollisionDraft,
	CollisionFields,
	CollisionDivision,
	CollisionRoad,
	CollisionVehicle,
	CollisionPerson,
} from "@/src/types/models";
import {
	fetchCollisionSetups,
	fetchCollisions,
	syncCollisionData,
	downloadCollisionAttachments,
} from "../thunks";

// ─── State Interface ───────────────────────────────────────────────

interface CollisionState {
	collisions: Collision[];
	collisionDraft: CollisionDraft | null;
	backendImages: Record<string, string>;
	isLoading: boolean;
	isSyncing: boolean;
	lastFetched: number | null;
	syncError: string | null;

	// Setup options from backend
	collisionFields: CollisionFields | null;
	divisions: CollisionDivision[];
}

// ─── Initial State ─────────────────────────────────────────────────

const initialState: CollisionState = {
	collisions: [],
	collisionDraft: null,
	backendImages: {},
	isLoading: false,
	isSyncing: false,
	lastFetched: null,
	syncError: null,
	collisionFields: null,
	divisions: [],
};

// ─── Helpers ───────────────────────────────────────────────────────

const saveCollisionsToStorage = async (state: CollisionState) => {
	try {
		await ReduxStorage.saveState("collisions_data", {
			collisions: state.collisions,
			collisionDraft: state.collisionDraft,
			backendImages: state.backendImages,
			lastFetched: state.lastFetched,
		});
	} catch (error) {
		console.error("Error saving collisions state:", error);
	}
};

const generateLocalId = (): string => {
	return `local_collision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateUUID = (): string => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

// Merge backend collisions with local unsynced collisions
const mergeCollisions = (
	backendCollisions: Collision[],
	localCollisions: Collision[],
): Collision[] => {
	const unsyncedLocalCollisions = localCollisions.filter(
		(collision) =>
			!collision.isSynced || collision.syncStatus === SYNC_STATUS.NOT_SYNCED,
	);

	const unsyncedMap = new Map(unsyncedLocalCollisions.map((c) => [c.id, c]));

	const mergedCollisions = backendCollisions.map((backendCollision) => {
		const localCollision = unsyncedMap.get(backendCollision.id);
		if (
			localCollision &&
			localCollision.syncStatus === SYNC_STATUS.NOT_SYNCED
		) {
			return localCollision;
		}
		return backendCollision;
	});

	const backendIds = new Set(backendCollisions.map((c) => c.id));
	const newLocalCollisions = unsyncedLocalCollisions.filter(
		(collision) =>
			!backendIds.has(collision.id) &&
			(collision.id.startsWith("local_") || collision.isNew),
	);

	return [...mergedCollisions, ...newLocalCollisions];
};

// ─── Slice ─────────────────────────────────────────────────────────

const collisionSlice = createSlice({
	name: "collision",
	initialState,
	reducers: {
		// Add new collision
		addCollision: (
			state,
			action: PayloadAction<
				Omit<Collision, "id" | "isNew" | "isSynced" | "syncStatus">
			>,
		) => {
			const localId = generateLocalId();

			const processedImages = (action.payload.images || []).map((img) => ({
				...img,
				collisionId: localId,
				isNew: true,
				isSynced: false,
			}));

			const newCollision: Collision = {
				...action.payload,
				id: localId,
				localId,
				isNew: true,
				isSynced: false,
				syncStatus: SYNC_STATUS.NOT_SYNCED,
				images: processedImages,
			};

			state.collisions.push(newCollision);
			state.collisionDraft = null;
			saveCollisionsToStorage(state);
		},

		// Update existing collision
		updateCollision: (
			state,
			action: PayloadAction<{
				id: string;
				updates: Partial<Collision>;
			}>,
		) => {
			const { id, updates } = action.payload;
			const collisionIndex = state.collisions.findIndex((c) => c.id === id);

			if (collisionIndex !== -1) {
				const collision = state.collisions[collisionIndex];

				const hasImageChanges =
					updates.images !== undefined &&
					JSON.stringify(updates.images) !== JSON.stringify(collision.images);

				const { images: _, ...fieldUpdates } = updates;
				const hasFieldChanges = Object.keys(fieldUpdates).length > 0;

				const shouldMarkUnsynced =
					collision.syncStatus === SYNC_STATUS.SYNCED &&
					(hasImageChanges || hasFieldChanges);

				if (hasImageChanges && updates.images) {
					const newImageIds = new Set(updates.images.map((img) => img.imageId));
					collision.images.forEach((existingImg) => {
						if (
							!newImageIds.has(existingImg.imageId) &&
							existingImg.localPath
						) {
							ImageStorage.deleteImage(existingImg.localPath);
						}
					});
				}

				state.collisions[collisionIndex] = {
					...collision,
					...updates,
					editedSubmissionDT: new Date().toISOString(),
					isSynced: shouldMarkUnsynced ? false : collision.isSynced,
					syncStatus: shouldMarkUnsynced
						? SYNC_STATUS.NOT_SYNCED
						: collision.syncStatus,
				};

				saveCollisionsToStorage(state);
			}
		},

		// Remove collision
		removeCollision: (state, action: PayloadAction<string>) => {
			const collisionIndex = state.collisions.findIndex(
				(c) => c.id === action.payload,
			);

			if (collisionIndex !== -1) {
				const collision = state.collisions[collisionIndex];

				// Delete local images
				collision.images.forEach((img) => {
					if (img.localPath) {
						ImageStorage.deleteImage(img.localPath);
					}
				});

				state.collisions.splice(collisionIndex, 1);
				saveCollisionsToStorage(state);
			}
		},

		// Update collision after sync
		updateCollisionAfterSync: (
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
			const collisionIndex = state.collisions.findIndex(
				(c) => c.id === localId || c.localId === localId,
			);

			if (collisionIndex !== -1) {
				const collision = state.collisions[collisionIndex];

				collision.id = serverId;
				collision.serverId = serverId;
				delete collision.localId;
				collision.syncStatus = SYNC_STATUS.SYNCED;
				collision.isNew = false;
				collision.isSynced = true;

				collision.images.forEach((img) => {
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

				saveCollisionsToStorage(state);
			}
		},

		// Update sync status for all synced collisions
		updateSyncStatusCollision: (state) => {
			state.collisions.forEach((collision) => {
				if (collision.syncStatus === SYNC_STATUS.NOT_SYNCED) {
					collision.syncStatus = SYNC_STATUS.SYNCED;
					collision.isSynced = true;
				}
			});
			saveCollisionsToStorage(state);
		},

		// Add image to collision
		addImageToCollision: (
			state,
			action: PayloadAction<{
				collisionId: string;
				image: CollisionImage;
			}>,
		) => {
			const { collisionId, image } = action.payload;
			const collisionIndex = state.collisions.findIndex(
				(c) => c.id === collisionId,
			);

			if (collisionIndex !== -1) {
				const collision = state.collisions[collisionIndex];
				collision.images.push(image);

				if (collision.syncStatus === SYNC_STATUS.SYNCED) {
					collision.syncStatus = SYNC_STATUS.NOT_SYNCED;
					collision.isSynced = false;
				}

				saveCollisionsToStorage(state);
			}
		},

		// Remove image from collision
		removeImageFromCollision: (
			state,
			action: PayloadAction<{
				collisionId: string;
				imageId: string;
			}>,
		) => {
			const { collisionId, imageId } = action.payload;
			const collisionIndex = state.collisions.findIndex(
				(c) => c.id === collisionId,
			);

			if (collisionIndex !== -1) {
				const collision = state.collisions[collisionIndex];
				const imageIndex = collision.images.findIndex(
					(img) => img.imageId === imageId || img.uri.includes(imageId),
				);

				if (imageIndex !== -1) {
					const image = collision.images[imageIndex];
					if (image.localPath) {
						ImageStorage.deleteImage(image.localPath);
					}
					collision.images.splice(imageIndex, 1);

					if (collision.syncStatus === SYNC_STATUS.SYNCED) {
						collision.syncStatus = SYNC_STATUS.NOT_SYNCED;
						collision.isSynced = false;
					}

					saveCollisionsToStorage(state);
				}
			}
		},

		// Draft management
		updateCollisionDraft: (
			state,
			action: PayloadAction<CollisionDraft | null>,
		) => {
			state.collisionDraft = action.payload;
			saveCollisionsToStorage(state);
		},

		clearCollisionDraft: (state) => {
			state.collisionDraft = null;
			saveCollisionsToStorage(state);
		},

		// Load saved collisions
		loadSavedCollisions: (
			state,
			action: PayloadAction<{
				collisions: Collision[];
				collisionDraft: CollisionDraft | null;
				backendImages: Record<string, string>;
				lastFetched: number | null;
			}>,
		) => {
			state.collisions = action.payload.collisions;
			state.collisionDraft = action.payload.collisionDraft;
			state.backendImages = action.payload.backendImages;
			state.lastFetched = action.payload.lastFetched;
		},

		// Clear all collisions
		clearAllCollisions: (state) => {
			state.collisions.forEach((collision) => {
				collision.images.forEach((img) => {
					if (img.localPath) {
						ImageStorage.deleteImage(img.localPath);
					}
				});
			});
			state.collisions = [];
			state.collisionDraft = null;
			state.backendImages = {};
			saveCollisionsToStorage(state);
		},

		// Set sync error
		setSyncError: (state, action: PayloadAction<string | null>) => {
			state.syncError = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch setups
			.addCase(fetchCollisionSetups.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchCollisionSetups.fulfilled, (state, action) => {
				state.collisionFields = action.payload.collisionFields;
				state.divisions = action.payload.divisions;
				state.isLoading = false;
				state.lastFetched = Date.now();
			})
			.addCase(fetchCollisionSetups.rejected, (state) => {
				state.isLoading = false;
			})

			// Fetch collisions
			.addCase(fetchCollisions.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchCollisions.fulfilled, (state, action) => {
				state.collisions = mergeCollisions(
					action.payload.collisions,
					state.collisions,
				);
				state.isLoading = false;
				state.lastFetched = Date.now();
				saveCollisionsToStorage(state);
			})
			.addCase(fetchCollisions.rejected, (state) => {
				state.isLoading = false;
			})

			// Sync collision data
			.addCase(syncCollisionData.pending, (state) => {
				state.isSyncing = true;
				state.syncError = null;
			})
			.addCase(syncCollisionData.fulfilled, (state, action) => {
				action.payload.syncedCollisionIds.forEach((collisionId) => {
					const collision = state.collisions.find((c) => c.id === collisionId);
					if (collision) {
						collision.syncStatus = SYNC_STATUS.SYNCED;
						collision.isSynced = true;
						collision.isNew = false;
					}
				});

				action.payload.syncedImageIds.forEach((imageId) => {
					state.collisions.forEach((collision) => {
						const image = collision.images.find(
							(img) => img.imageId === imageId || img.uri.includes(imageId),
						);
						if (image) {
							image.isSynced = true;
							image.isNew = false;
						}
					});
				});

				state.isSyncing = false;
				saveCollisionsToStorage(state);
			})
			.addCase(syncCollisionData.rejected, (state, action) => {
				state.isSyncing = false;
				state.syncError = action.payload as string;
			})

			// Download attachments
			.addCase(downloadCollisionAttachments.fulfilled, (state, action) => {
				const { collisionId, images } = action.payload;
				const collision = state.collisions.find((c) => c.id === collisionId);

				if (collision) {
					images.forEach((downloadedImg) => {
						const exists = collision.images.some(
							(img) => img.imageId === downloadedImg.imageId,
						);
						if (!exists) {
							collision.images.push(downloadedImg);
						}
					});

					saveCollisionsToStorage(state);
				}
			});
	},
});

export const {
	addCollision,
	updateCollision,
	removeCollision,
	updateCollisionAfterSync,
	updateSyncStatusCollision,
	addImageToCollision,
	removeImageFromCollision,
	updateCollisionDraft,
	clearCollisionDraft,
	loadSavedCollisions,
	clearAllCollisions,
	setSyncError,
} = collisionSlice.actions;

export default collisionSlice.reducer;
