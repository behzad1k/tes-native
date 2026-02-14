import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "@/src/services/api/apiClient";
import { ReduxStorage, ImageStorage, TokenStorage } from "../persistence";
import {
	MaintenanceJob,
	MaintenanceImage,
	JobAsset,
	JobStatus,
	JobType,
} from "@/src/types/models";
import mockData from "@/src/data/mockJobsData.json";
import axios from "axios";
import ENDPOINTS from "@/src/services/api/endpoints";
import { BUserJobs } from "@/src/types/api";
import { fetchJobs } from "../thunks";

interface MaintenanceState {
	jobs: MaintenanceJob[];
	jobStatuses: JobStatus[];
	jobTypes: JobType[];
	jobImages: MaintenanceImage[];
	isLoading: boolean;
	lastFetched: number | null;
}

const initialState: MaintenanceState = {
	jobs: [],
	jobStatuses: [],
	jobTypes: [],
	jobImages: [],
	isLoading: false,
	lastFetched: null,
};

const saveToStorage = async (state: MaintenanceState) => {
	await ReduxStorage.saveState("maintenance_data", {
		jobs: state.jobs,
		jobStatuses: state.jobStatuses,
		jobTypes: state.jobTypes,
		jobImages: state.jobImages,
		lastFetched: state.lastFetched,
	});
};

export const updateJob = createAsyncThunk(
	"maintenance/updateJob",
	async (job: MaintenanceJob, { rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) {
				return { job, offline: true };
			}

			const response = await apiClient.put(`/maintenance/jobs/${job.id}`, job, {
				headers: { Authorization: `Bearer ${token}` },
			});

			return { job: response.data, offline: false };
		} catch (error: any) {
			return { job, offline: true };
		}
	},
);

export const updateJobAsset = createAsyncThunk(
	"maintenance/updateJobAsset",
	async (
		{ jobId, asset }: { jobId: string; asset: JobAsset },
		{ getState, rejectWithValue },
	) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) {
				return { jobId, asset, offline: true };
			}

			const response = await apiClient.put(
				`/maintenance/jobs/${jobId}/assets/${asset.id}`,
				asset,
				{ headers: { Authorization: `Bearer ${token}` } },
			);

			return { jobId, asset: response.data, offline: false };
		} catch (error: any) {
			return { jobId, asset, offline: true };
		}
	},
);

export const downloadJobAttachments = createAsyncThunk(
	"maintenance/downloadAttachments",
	async (jobId: string, { rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No token");

			const response = await apiClient.get(
				`/Attachments/DownloadAttachments/${jobId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			const files = response.data;
			// TODO: add backend jobImages
			const images: MaintenanceImage[] = [];

			return { jobId, images };
		} catch (error: any) {
			return rejectWithValue(error.message);
		}
	},
);

const maintenanceSlice = createSlice({
	name: "maintenance",
	initialState,
	reducers: {
		updateJobImages: (
			state,
			action: PayloadAction<{ jobId: string; images: MaintenanceImage[] }>,
		) => {
			const { jobId, images: nextImages } = action.payload;
			const nextImageIds = new Set(nextImages.map((img) => img.imageId));

			// Clean up local files for removed images
			state.jobImages.forEach((existing) => {
				if (
					existing.jobId === jobId &&
					!nextImageIds.has(existing.imageId) &&
					existing.localPath
				) {
					ImageStorage.deleteImage(existing.localPath);
				}
			});

			// Replace: keep images from other jobs, set new ones for this job
			state.jobImages = [
				...state.jobImages.filter((img) => img.jobId !== jobId),
				...nextImages,
			];

			saveToStorage(state);
		},

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

		updateJobLocally: (state, action: PayloadAction<MaintenanceJob>) => {
			const index = state.jobs.findIndex((j) => j.id === action.payload.id);
			if (index !== -1) {
				state.jobs[index] = { ...action.payload, isEdited: true };
				saveToStorage(state);
			}
		},

		markJobSynced: (state, action: PayloadAction<string>) => {
			const job = state.jobs.find((j) => j.id === action.payload);
			if (job) {
				job.isSynced = true;
				job.isEdited = false;
				saveToStorage(state);
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchJobs.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchJobs.fulfilled, (state, action) => {
				state.jobs = action.payload.jobs;
				state.jobStatuses = action.payload.jobStatuses;
				state.jobTypes = action.payload.jobTypes;
				state.lastFetched = Date.now();
				state.isLoading = false;
				// saveToStorage(state);
			})
			.addCase(fetchJobs.rejected, (state) => {
				state.isLoading = false;
			})

			.addCase(updateJob.fulfilled, (state, action) => {
				const { job, offline } = action.payload;
				const index = state.jobs.findIndex((j) => j.id === job.id);

				if (index !== -1) {
					state.jobs[index] = {
						...job,
						isSynced: !offline,
						isEdited: offline,
					};
					saveToStorage(state);
				}
			})

			.addCase(updateJobAsset.fulfilled, (state, action) => {
				const { jobId, asset, offline } = action.payload;
				const job = state.jobs.find((j) => j.id === jobId);

				if (job) {
					const assetIndex = job.assets.findIndex((a) => a.id === asset.id);
					if (assetIndex !== -1) {
						job.assets[assetIndex] = { ...asset, isEdited: offline };
						job.isEdited = offline;
						job.isSynced = !offline;
					}
					saveToStorage(state);
				}
			})

			.addCase(downloadJobAttachments.fulfilled, (state, action) => {
				const { images } = action.payload;

				images.forEach((img) => {
					if (
						!state.jobImages.some(
							(existing) => existing.imageId === img.imageId,
						)
					) {
						state.jobImages.push(img);
					}
				});

				saveToStorage(state);
			});
	},
});

export const {
	updateJobImages,
	loadSavedData,
	updateJobLocally,
	markJobSynced,
} = maintenanceSlice.actions;

export default maintenanceSlice.reducer;
