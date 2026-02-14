import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, ImageStorage } from "../persistence";
import {
	MaintenanceJob,
	MaintenanceImage,
	JobAsset,
	JobStatus,
	JobType,
} from "@/src/types/models";
import {
	fetchJobs,
	syncMaintenanceData,
	downloadJobAttachments,
} from "../thunks";
import * as FileSystem from "expo-file-system";

interface MaintenanceState {
	// Jobs from backend + locally edited jobs
	jobs: MaintenanceJob[];
	// Job statuses from backend
	jobStatuses: JobStatus[];
	// Job types from backend
	jobTypes: JobType[];
	// Images: both downloaded from backend and locally added
	jobImages: MaintenanceImage[];
	// Loading state
	isLoading: boolean;
	isSyncing: boolean;
	// Last fetch timestamp
	lastFetched: number | null;
	// Sync error
	syncError: string | null;
}

const initialState: MaintenanceState = {
	jobs: [],
	jobStatuses: [],
	jobTypes: [],
	jobImages: [],
	isLoading: false,
	isSyncing: false,
	lastFetched: null,
	syncError: null,
};

// Helper to save state to async storage
const saveToStorage = async (state: MaintenanceState) => {
	try {
		await ReduxStorage.saveState("maintenance_data", {
			jobs: state.jobs,
			jobStatuses: state.jobStatuses,
			jobTypes: state.jobTypes,
			jobImages: state.jobImages,
			lastFetched: state.lastFetched,
		});
	} catch (error) {
		console.error("Error saving maintenance state:", error);
	}
};

// Helper to merge backend jobs with local unsynced jobs
const mergeJobs = (
	backendJobs: MaintenanceJob[],
	localJobs: MaintenanceJob[],
): MaintenanceJob[] => {
	// Get all locally edited/unsynced jobs
	const unsyncedLocalJobs = localJobs.filter(
		(job) => !job.isSynced || job.isEdited,
	);

	// Create a map of unsynced jobs by ID
	const unsyncedJobsMap = new Map(
		unsyncedLocalJobs.map((job) => [job.id, job]),
	);

	// Merge: use local version if unsynced, otherwise use backend version
	const mergedJobs = backendJobs.map((backendJob) => {
		const localJob = unsyncedJobsMap.get(backendJob.id);
		if (localJob && (!localJob.isSynced || localJob.isEdited)) {
			// Keep local changes
			return localJob;
		}
		// Use backend version
		return {
			...backendJob,
			isEdited: false,
			isSynced: true,
		};
	});

	// Add any locally created jobs that aren't on backend yet
	const backendJobIds = new Set(backendJobs.map((j) => j.id));
	const newLocalJobs = unsyncedLocalJobs.filter(
		(job) => !backendJobIds.has(job.id) && job.id.startsWith("local_"),
	);

	return [...mergedJobs, ...newLocalJobs];
};

// Helper to merge images
const mergeImages = (
	existingImages: MaintenanceImage[],
	jobId: string,
	newImages: MaintenanceImage[],
): MaintenanceImage[] => {
	// Keep images from other jobs
	const otherJobImages = existingImages.filter((img) => img.jobId !== jobId);

	// Keep unsynced images for this job that aren't being replaced
	const existingUnsyncedImages = existingImages.filter(
		(img) =>
			img.jobId === jobId &&
			!img.isSynced &&
			!newImages.some((newImg) => newImg.imageId === img.imageId),
	);

	return [...otherJobImages, ...existingUnsyncedImages, ...newImages];
};

const maintenanceSlice = createSlice({
	name: "maintenance",
	initialState,
	reducers: {
		// Update a job locally (marks as edited/unsynced)
		updateJobLocally: (
			state,
			action: PayloadAction<Partial<MaintenanceJob> & { id: string }>,
		) => {
			const index = state.jobs.findIndex((j) => j.id === action.payload.id);
			if (index !== -1) {
				const existingJob = state.jobs[index];
				state.jobs[index] = {
					...existingJob,
					...action.payload,
					isEdited: true,
					isSynced: false,
				};
				saveToStorage(state);
			}
		},

		// Update a job asset locally
		updateJobAssetLocally: (
			state,
			action: PayloadAction<{ jobId: string; asset: JobAsset }>,
		) => {
			const { jobId, asset } = action.payload;
			const job = state.jobs.find((j) => j.id === jobId);
			if (job) {
				const assetIndex = job.assets.findIndex((a) => a.id === asset.id);
				if (assetIndex !== -1) {
					job.assets[assetIndex] = { ...asset, isEdited: true };
				}
				job.isEdited = true;
				job.isSynced = false;
				saveToStorage(state);
			}
		},

		// Update job images
		updateJobImages: (
			state,
			action: PayloadAction<{ jobId: string; images: MaintenanceImage[] }>,
		) => {
			const { jobId, images: newImages } = action.payload;

			// Clean up local files for removed images
			const existingJobImages = state.jobImages.filter(
				(img) => img.jobId === jobId,
			);
			const newImageIds = new Set(newImages.map((img) => img.imageId));

			existingJobImages.forEach((existing) => {
				if (!newImageIds.has(existing.imageId) && existing.localPath) {
					ImageStorage.deleteImage(existing.localPath).catch(console.error);
				}
			});

			// Merge images: keep unsynced images that aren't being replaced
			state.jobImages = mergeImages(state.jobImages, jobId, newImages);

			// Mark job as edited if there are new images
			const hasNewImages = newImages.some((img) => img.isNew && !img.isSynced);
			if (hasNewImages) {
				const job = state.jobs.find((j) => j.id === jobId);
				if (job) {
					job.isEdited = true;
					job.isSynced = false;
				}
			}

			saveToStorage(state);
		},

		// Add a single image to a job
		addJobImage: (state, action: PayloadAction<MaintenanceImage>) => {
			const image = action.payload;
			state.jobImages.push(image);

			// Mark job as edited
			const job = state.jobs.find((j) => j.id === image.jobId);
			if (job) {
				job.isEdited = true;
				job.isSynced = false;
			}

			saveToStorage(state);
		},

		// Remove a job image
		removeJobImage: (
			state,
			action: PayloadAction<{ jobId: string; imageId: string }>,
		) => {
			const { jobId, imageId } = action.payload;
			const imageIndex = state.jobImages.findIndex(
				(img) => img.jobId === jobId && img.imageId === imageId,
			);

			if (imageIndex !== -1) {
				const image = state.jobImages[imageIndex];
				if (image.localPath) {
					ImageStorage.deleteImage(image.localPath).catch(console.error);
				}
				state.jobImages.splice(imageIndex, 1);

				// Mark job as edited
				const job = state.jobs.find((j) => j.id === jobId);
				if (job) {
					job.isEdited = true;
					job.isSynced = false;
				}

				saveToStorage(state);
			}
		},

		// Mark a job as synced after successful sync
		markJobSynced: (state, action: PayloadAction<string>) => {
			const job = state.jobs.find((j) => j.id === action.payload);
			if (job) {
				job.isSynced = true;
				job.isEdited = false;
				saveToStorage(state);
			}
		},

		// Mark job images as synced
		markJobImagesSynced: (state, action: PayloadAction<string>) => {
			const jobId = action.payload;
			state.jobImages
				.filter((img) => img.jobId === jobId)
				.forEach((img) => {
					img.isSynced = true;
					img.isNew = false;
				});
			saveToStorage(state);
		},

		// Load saved data from storage (for initial load)
		loadSavedData: (
			state,
			action: PayloadAction<{
				jobs: MaintenanceJob[];
				jobStatuses: JobStatus[];
				jobTypes: JobType[];
				jobImages: MaintenanceImage[];
				lastFetched: number | null;
			}>,
		) => {
			state.jobs = action.payload.jobs;
			state.jobStatuses = action.payload.jobStatuses;
			state.jobTypes = action.payload.jobTypes;
			state.jobImages = action.payload.jobImages;
			state.lastFetched = action.payload.lastFetched;
		},

		// Clear sync error
		clearSyncError: (state) => {
			state.syncError = null;
		},

		// Reset maintenance state
		resetMaintenance: (state) => {
			Object.assign(state, initialState);
		},
	},
	extraReducers: (builder) => {
		builder
			// ─── Fetch Jobs ────────────────────────────────────────────
			.addCase(fetchJobs.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchJobs.fulfilled, (state, action) => {
				// Merge backend jobs with local unsynced jobs
				const backendJobs = action.payload.jobs.map((job) => ({
					...job,
					isEdited: false,
					isSynced: true,
				}));

				console.log(action.payload.jobs.length);

				state.jobs = mergeJobs(backendJobs, state.jobs);
				state.jobStatuses = action.payload.jobStatuses;
				state.jobTypes = action.payload.jobTypes;
				state.lastFetched = Date.now();
				state.isLoading = false;

				saveToStorage(state);
			})
			.addCase(fetchJobs.rejected, (state, action) => {
				state.isLoading = false;
				state.syncError = action.payload as string;
			})

			// ─── Sync Maintenance Data ─────────────────────────────────
			.addCase(syncMaintenanceData.pending, (state) => {
				state.isSyncing = true;
				state.syncError = null;
			})
			.addCase(syncMaintenanceData.fulfilled, (state, action) => {
				state.isSyncing = false;

				// Mark synced jobs
				action.payload.syncedJobIds.forEach((jobId) => {
					const job = state.jobs.find((j) => j.id === jobId);
					if (job) {
						job.isSynced = true;
						job.isEdited = false;
					}
				});

				// Mark synced images
				action.payload.syncedImageIds.forEach((imageId) => {
					const image = state.jobImages.find((img) => img.imageId === imageId);
					if (image) {
						image.isSynced = true;
						image.isNew = false;
					}
				});

				saveToStorage(state);
			})
			.addCase(syncMaintenanceData.rejected, (state, action) => {
				state.isSyncing = false;
				state.syncError = action.payload as string;
			})

			// ─── Download Job Attachments ──────────────────────────────
			.addCase(downloadJobAttachments.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(downloadJobAttachments.fulfilled, (state, action) => {
				const { jobId, images } = action.payload;

				// Add downloaded images (mark as synced)
				images.forEach((img) => {
					// Check if already exists
					const exists = state.jobImages.some(
						(existing) => existing.imageId === img.imageId,
					);
					if (!exists) {
						state.jobImages.push(img);
					}
				});

				state.isLoading = false;
				saveToStorage(state);
			})
			.addCase(downloadJobAttachments.rejected, (state) => {
				state.isLoading = false;
			});
	},
});

export const {
	updateJobLocally,
	updateJobAssetLocally,
	updateJobImages,
	addJobImage,
	removeJobImage,
	markJobSynced,
	markJobImagesSynced,
	loadSavedData,
	clearSyncError,
	resetMaintenance,
} = maintenanceSlice.actions;

export default maintenanceSlice.reducer;
