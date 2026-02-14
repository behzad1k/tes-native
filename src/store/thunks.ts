import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../services/api/apiClient";
import ENDPOINTS from "../services/api/endpoints";
import {
	BSignSupportData,
	BUserJobs,
	BUpdateUserJobsRequest,
	BJobAttachment,
	BJob,
	BJobAsset,
	BSetups,
} from "../types/api";
import {
	MaintenanceJob,
	MaintenanceImage,
	JobStatus,
	JobType,
	Support,
	Sign,
} from "../types/models";
import { SYNC_STATUS } from "../constants/global";
import { TokenStorage, ImageStorage } from "./persistence";
import { File, Directory, Paths } from "expo-file-system/next";
import { RootState } from ".";

// ─── Sign/Support Thunks ───────────────────────────────────────────

export const fetchSignSupportData = createAsyncThunk(
	"sign_support/appData",
	async (_, { rejectWithValue }) => {
		try {
			const response: BSignSupportData = await apiClient.get(
				ENDPOINTS.SYNC.APP_DATA,
			);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.message || "Failed to fetch app data");
		}
	},
);

export const fetchSignSupportSetups = createAsyncThunk(
	"sign_support/setups",
	async (customerId: string, { rejectWithValue }) => {
		try {
			const response: BSetups = await apiClient.get(
				ENDPOINTS.SIGNS.SETUPS(customerId),
			);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.message || "Failed to fetch setups");
		}
	},
);

// ─── Maintenance Thunks ────────────────────────────────────────────

/**
 * Fetch jobs from backend
 * POST /jobs/UserJobs with { CustomerId, ShowDataByLocation }
 */
export const fetchJobs = createAsyncThunk<
	{
		jobs: MaintenanceJob[];
		supports: Support[];
		signWithouSupport: Sign[];
		jobStatuses: JobStatus[];
		jobTypes: JobType[];
	},
	string,
	{ state: RootState; rejectValue: string }
>(
	"maintenance/fetchJobs",
	async (customerId: string, { getState, rejectWithValue }) => {
		try {
			if (!customerId) {
				return rejectWithValue("No customer ID available");
			}
			const response: BUserJobs = await apiClient.post(
				ENDPOINTS.MAINTENANCE.USER_JOBS,
				{
					CustomerId: customerId,
					ShowDataByLocation: true,
				},
			);

			// Transform backend jobs to our model
			const jobs: MaintenanceJob[] = response.jobs.map((job: BJob) => ({
				id: job.id,
				name: job.name,
				typeId: job.typeId,
				typeName: job.typeName,
				statusId: job.statusId,
				statusName: job.statusName,
				assignDate: job.assignDate,
				duration: job.duration,
				note: job.note,
				assets: job.assets.map((asset: BJobAsset) => ({
					id: asset.id,
					jobId: asset.jobId,
					assetId: asset.assetId,
					type: asset.type,
					statusId: asset.statusId,
					note: asset.note,
					isEdited: false,
				})),
				isEdited: false,
				isSynced: true,
			}));

			// Transform supports
			const supports: Support[] = response.supports.map((support) => ({
				id: support.id,
				supportId: support.supportId,
				customerId: support.customerId,
				supportCodeId: support.supportCodeId,
				supportLocationTypeId: support.supportLocationTypeId,
				locationId: support.locationId,
				latitude: support.latitude,
				longitude: support.longitude,
				address: support.address,
				positionId: support.positionId,
				dateInstalled: support.dateInstalled,
				conditionId: support.conditionId,
				note: support.note,
				signs: support.signs.map((sign) => ({
					id: sign.id,
					signId: sign.signId,
					supportId: sign.supportId,
					customerId: sign.customerId,
					signCodeId: sign.signCodeId,
					locationTypeId: sign.locationTypeId,
					latitude: sign.latitude,
					longitude: sign.longitude,
					address: sign.address,
					height: sign.height,
					facingDirectionId: sign.facingDirectionId,
					faceMaterialId: sign.faceMaterialId,
					reflectiveCoatingId: sign.reflectiveCoatingId,
					reflectiveRatingId: sign.reflectiveRatingId,
					dimensionId: sign.dimensionId,
					dateInstalled: sign.dateInstalled,
					conditionId: sign.conditionId,
					note: sign.note,
					images: sign.images.map((img) => ({
						imageId: img.id,
						uri: img.url || img.uri || "",
						signId: sign.id,
						isNew: false,
						isSynced: true,
						status: SYNC_STATUS.SYNCED,
					})),
					isNew: false,
					isSynced: true,
					status: SYNC_STATUS.SYNCED,
				})),
				images: support.images.map((img) => ({
					imageId: img.id,
					uri: img.url || img.uri || "",
					supportId: support.id,
					isNew: false,
					isSynced: true,
					status: SYNC_STATUS.SYNCED,
				})),
				isNew: false,
				isSynced: true,
				status: SYNC_STATUS.SYNCED,
			}));

			// Transform signs without support
			const signWithouSupport: Sign[] = response.signsWithoutSupport.map(
				(sign) => ({
					id: sign.id,
					signId: sign.signId,
					supportId: sign.supportId,
					customerId: sign.customerId,
					signCodeId: sign.signCodeId,
					locationTypeId: sign.locationTypeId,
					latitude: sign.latitude,
					longitude: sign.longitude,
					address: sign.address,
					height: sign.height,
					facingDirectionId: sign.facingDirectionId,
					faceMaterialId: sign.faceMaterialId,
					reflectiveCoatingId: sign.reflectiveCoatingId,
					reflectiveRatingId: sign.reflectiveRatingId,
					dimensionId: sign.dimensionId,
					dateInstalled: sign.dateInstalled,
					conditionId: sign.conditionId,
					note: sign.note,
					images: sign.images.map((img) => ({
						imageId: img.id,
						uri: img.url || img.uri || "",
						signId: sign.id,
						isNew: false,
						isSynced: true,
						status: SYNC_STATUS.SYNCED,
					})),
					isNew: false,
					isSynced: true,
					status: SYNC_STATUS.SYNCED,
				}),
			);

			// Transform job statuses
			const jobStatuses: JobStatus[] = response.jobStatuses.map((status) => ({
				id: status.id,
				name: status.name,
				jobStatusType: status.jobStatusType,
			}));

			// Transform job types
			const jobTypes: JobType[] = response.jobTypes.map((type) => ({
				id: type.id,
				name: type.name,
				index: type.index,
			}));

			return {
				jobs,
				supports,
				signWithouSupport,
				jobStatuses,
				jobTypes,
			};
		} catch (error: any) {
			console.error("Error fetching jobs:", error);
			return rejectWithValue(error.message || "Failed to fetch jobs");
		}
	},
);

/**
 * Sync edited jobs and images to backend
 * POST /Jobs/UpdateUserJobs
 * PUT /Attachments/job for images
 */
export const syncMaintenanceData = createAsyncThunk<
	{
		synced: boolean;
		syncedJobIds: string[];
		syncedImageIds: string[];
		timestamp: number;
	},
	void,
	{ state: RootState; rejectValue: string }
>("maintenance/sync", async (_, { getState, rejectWithValue }) => {
	try {
		const state = getState();
		const { jobs, jobImages } = state.maintenance;

		// Get edited jobs
		const editedJobs = jobs.filter((job) => job.isEdited && !job.isSynced);

		// Get edited assets from edited jobs
		const editedAssets = editedJobs.flatMap((job) =>
			job.assets.filter((asset) => asset.isEdited),
		);

		// Get unsynced images
		const unsyncedImages = jobImages.filter(
			(img) => !img.isSynced && img.isNew,
		);

		const syncedJobIds: string[] = [];
		const syncedImageIds: string[] = [];

		// Sync jobs and assets if there are any
		if (editedJobs.length > 0 || editedAssets.length > 0) {
			const updateRequest: BUpdateUserJobsRequest = {
				jobs: editedJobs.map((job) => ({
					id: job.id,
					name: job.name,
					typeId: job.typeId,
					typeName: job.typeName,
					statusId: job.statusId,
					statusName: job.statusName,
					assignDate: job.assignDate,
					duration: job.duration,
					note: job.note,
					assets: job.assets,
					isEdited: job.isEdited,
					isSynced: false,
				})),
				assets: editedAssets,
			};

			const response = await apiClient.post(
				ENDPOINTS.MAINTENANCE.UPDATE_USER_JOBS,
				updateRequest,
			);

			if (response) {
				editedJobs.forEach((job) => syncedJobIds.push(job.id));
			}
		}

		// Upload images
		for (const image of unsyncedImages) {
			if (image.localPath || image.uri) {
				try {
					const imageUri = image.localPath || image.uri;
					const file = new File(imageUri);

					if (file.exists) {
						const formData = new FormData();
						const filename =
							imageUri.split("/").pop() || `job_${Date.now()}.jpg`;
						const match = /\.(\w+)$/.exec(filename);
						const type = match ? `image/${match[1]}` : "image/jpeg";

						formData.append("file", {
							uri: imageUri,
							name: filename,
							type,
						} as any);
						formData.append("jobId", image.jobId);

						const response = await apiClient.put(
							ENDPOINTS.MAINTENANCE.UPLOAD_JOB_IMAGE,
							formData,
							{
								headers: {
									"Content-Type": "multipart/form-data",
								},
							},
						);

						if (response) {
							syncedImageIds.push(image.imageId || "");
						}
					}
				} catch (imageError) {
					console.error("Error uploading image:", imageError);
					// Continue with other images
				}
			}
		}

		return {
			synced: true,
			syncedJobIds,
			syncedImageIds,
			timestamp: Date.now(),
		};
	} catch (error: any) {
		console.error("Error syncing maintenance data:", error);
		return rejectWithValue(error.message || "Sync failed");
	}
});

/**
 * Download attachments for a job
 * GET /Attachments/DownloadAttachments/{jobId}
 */
export const downloadJobAttachments = createAsyncThunk<
	{ jobId: string; images: MaintenanceImage[] },
	string,
	{ state: RootState; rejectValue: string }
>(
	"maintenance/downloadAttachments",
	async (jobId, { getState, rejectWithValue }) => {
		try {
			const state = getState();
			const customerName = state.auth.user?.defaultCustomerName || "default";

			// Fetch attachments metadata from server
			const attachments: BJobAttachment[] = await apiClient.get(
				ENDPOINTS.MAINTENANCE.DOWNLOAD_ATTACHMENTS(jobId),
			);

			const images: MaintenanceImage[] = [];

			// Ensure directory exists
			const dir = new Directory(Paths.document, customerName);
			if (!dir.exists) {
				dir.create();
			}

			// Download each attachment
			for (const attachment of attachments) {
				try {
					const filename = `${attachment.id}.jpg`;
					const destFile = new File(dir, filename);

					// Check if already downloaded
					if (!destFile.exists) {
						// Fetch and save the image
						const response = await fetch(attachment.downloadURL);
						const blob = await response.blob();
						const base64 = await new Promise<string>((resolve, reject) => {
							const reader = new FileReader();
							reader.onloadend = () => {
								const result = reader.result as string;
								resolve(result.split(",")[1]);
							};
							reader.onerror = reject;
							reader.readAsDataURL(blob);
						});

						destFile.write(base64, { encoding: "base64" });
					}

					images.push({
						imageId: attachment.id,
						uri: destFile.uri,
						localPath: destFile.uri,
						jobId,
						isNew: false,
						isSynced: true,
						status: SYNC_STATUS.SYNCED,
					});
				} catch (downloadError) {
					console.error("Error downloading attachment:", downloadError);
					// Continue with other attachments
				}
			}

			return { jobId, images };
		} catch (error: any) {
			console.error("Error fetching attachments:", error);
			return rejectWithValue(error.message || "Failed to download attachments");
		}
	},
);
