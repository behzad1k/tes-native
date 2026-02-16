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
	BSyncDataRequest,
	BChangeLog,
	BSign,
	BSupport,
	BAttachment,
} from "../types/api";
import {
	MaintenanceJob,
	MaintenanceImage,
	JobStatus,
	JobType,
	Support,
	Sign,
	SignImage,
	SupportImage,
	ChangeLog,
	ChangeLogType,
} from "../types/models";
import { SYNC_STATUS } from "../constants/global";
import { TokenStorage, ImageStorage } from "./persistence";
import { File, Directory, Paths } from "expo-file-system/next";
import { RootState } from ".";

// ─── Helper Functions ──────────────────────────────────────────────

const generateUUID = (): string => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

// Transform backend sign to local sign model
const transformBackendSign = (sign: BSign, supportId?: string): Sign => ({
	id: sign.id,
	serverId: sign.id,
	customerId: sign.customerId,
	signId: sign.signId,
	supportId: supportId || sign.supportId,
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
	images: (sign.images || []).map((img) => ({
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
});

// Transform backend support to local support model
const transformBackendSupport = (support: BSupport): Support => ({
	id: support.id,
	serverId: support.id,
	customerId: support.customerId,
	supportId: support.supportId,
	supportCodeId: support.supportCodeId,
	supportLocationTypeId: support.supportLocationTypeId,
	locationId: support.locationId,
	supportPositionId: support.supportPositionId,
	latitude: support.latitude,
	longitude: support.longitude,
	address: support.address,
	distanceFromShoulder: support.distanceFromShoulder,
	dateInstalled: support.dateInstalled,
	supportConditionId: support.supportConditionId,
	note: support.note,
	signs: (support.signs || []).map((sign) =>
		transformBackendSign(sign, support.id),
	),
	images: (support.images || []).map((img) => ({
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
	supportMaterialId: "",
	supportTypeId: "",
});

// ─── Sign/Support Setup Thunks ─────────────────────────────────────

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

// ─── Sign/Support Data Thunks ──────────────────────────────────────

export const fetchSignSupportData = createAsyncThunk<
	{
		supports: Support[];
		signsWithoutSupport: Sign[];
		setting: { signImagesURL: string };
	},
	void,
	{ state: RootState; rejectValue: string }
>("sign_support/appData", async (_, { getState, rejectWithValue }) => {
	try {
		const response: BSignSupportData = await apiClient.get(
			ENDPOINTS.SYNC.APP_DATA,
		);

		// Transform supports
		const supports: Support[] = response.supports.map(transformBackendSupport);

		// Transform signs without support
		const signsWithoutSupport: Sign[] = response.signsWithoutSupport.map(
			(sign) => transformBackendSign(sign),
		);

		return {
			supports,
			signsWithoutSupport,
			setting: response.setting,
		};
	} catch (error: any) {
		return rejectWithValue(error.message || "Failed to fetch app data");
	}
});

// ─── Maintenance Thunks ────────────────────────────────────────────

export const fetchJobs = createAsyncThunk<
	{
		jobs: MaintenanceJob[];
		supports: Support[];
		signsWithoutSupport: Sign[];
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
			const supports: Support[] = response.supports.map(
				transformBackendSupport,
			);

			// Transform signs without support
			const signsWithoutSupport: Sign[] = response.signsWithoutSupport.map(
				(sign) => transformBackendSign(sign),
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
				signsWithoutSupport,
				jobStatuses,
				jobTypes,
			};
		} catch (error: any) {
			console.error("Error fetching jobs:", error);
			return rejectWithValue(error.message || "Failed to fetch jobs");
		}
	},
);

// ─── Sync Thunks ───────────────────────────────────────────────────

/**
 * Sync all local changes to backend
 * Based on old app's postAppData flow
 */
export const syncSignSupportData = createAsyncThunk<
	{
		synced: boolean;
		syncedSignIds: string[];
		syncedSupportIds: string[];
		syncedImageIds: string[];
		timestamp: number;
	},
	void,
	{ state: RootState; rejectValue: string }
>("sync/signSupport", async (_, { getState, rejectWithValue }) => {
	try {
		const state = getState();
		const { signs } = state.signs;
		const { supports } = state.supports;
		const { changeLogs } = state.sync;
		const user = state.auth.user;

		if (!user) {
			return rejectWithValue("User not authenticated");
		}

		// Get unsynced supports
		const unsyncedSupports = supports.filter((s) => s.isNew && !s.isSynced);

		// Get unsynced signs (both standalone and within supports)
		const unsyncedSigns = signs.filter((s) => s.isNew && !s.isSynced);
		console.log(unsyncedSigns);
		console.log(unsyncedSupports);
		// Prepare sync request
		const syncRequest: BSyncDataRequest = {
			changeLogs: changeLogs as BChangeLog[],
			signs: unsyncedSigns.map((sign) => ({
				// id: sign.id,
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
					id: img.imageId || "",
					signId: sign.id,
					uri: img.uri,
				})),
				isNew: sign.isNew,
				isSynced: sign.isSynced,
			})),
			supports: unsyncedSupports.map((support) => ({
				// id: support.id,
				// supportId: support.supportId,
				customerId: support.customerId,
				supportCodeId: support.supportCodeId,
				supportLocationTypeId: support.supportLocationTypeId,
				locationId: support.locationId,
				supportPositionId: support.supportPositionId,
				latitude: support.latitude,
				longitude: support.longitude,
				address: support.address,
				distanceFromShoulder: support.distanceFromShoulder,
				dateInstalled: support.dateInstalled,
				supportConditionId: support.supportConditionId,
				note: support.note,
				signs: support.signs.map((sign) => ({
					id: sign.id,
					signId: sign.signId,
					// supportId: support.id,
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
					images: sign.images?.map((img) => ({
						id: img.imageId || "",
						signId: sign.id,
						uri: img.uri,
					})),
					isNew: sign.isNew,
					isSynced: sign.isSynced,
				})),
				images: support.images?.map((img) => ({
					id: img.imageId || "",
					supportId: support.id,
					uri: img.uri,
				})),
				isNew: support.isNew,
				isSynced: support.isSynced,
			})),
		};

		// Send sync request
		const response = await apiClient.post(
			ENDPOINTS.SYNC.GET_DATA_FROM_APP,
			syncRequest,
		);

		const syncedSignIds: string[] = [];
		const syncedSupportIds: string[] = [];
		const syncedImageIds: string[] = [];

		// Upload support images
		for (const support of unsyncedSupports) {
			const newImages = support.images.filter(
				(img) => img.isNew && !img.isSynced,
			);
			for (const image of newImages) {
				if (image.localPath || image.uri) {
					try {
						const imageUri = image.localPath || image.uri;
						const formData = new FormData();
						formData.append("file", {
							uri: imageUri,
							name: imageUri.split("/").pop() || `support_${Date.now()}.jpg`,
							type: "image/jpg",
						} as any);
						formData.append(support.id, support.id);

						console.log(formData);
						await apiClient.put(
							ENDPOINTS.SUPPORTS.ADD_IMAGES(support.isNew),
							formData,
						);

						syncedImageIds.push(image.imageId || image.uri);
					} catch (imageError) {
						console.error("Error uploading support image:", imageError);
					}
				}
			}
			syncedSupportIds.push(support.id);
		}

		// Upload sign images
		for (const sign of unsyncedSigns) {
			const newImages = sign.images.filter((img) => img.isNew && !img.isSynced);
			for (const image of newImages) {
				if (image.localPath || image.uri) {
					try {
						const imageUri = image.localPath || image.uri;
						const formData = new FormData();
						formData.append("file", {
							uri: imageUri,
							name: imageUri.split("/").pop() || `sign_${Date.now()}.jpg`,
							type: "image/jpg",
						} as any);
						formData.append(sign.id, sign.id);
						console.log(formData);
						await apiClient.put(
							ENDPOINTS.SIGNS.ADD_IMAGES(sign.isNew),
							formData,
						);

						syncedImageIds.push(image.imageId || image.uri);
					} catch (imageError) {
						console.error("Error uploading sign image:", imageError);
					}
				}
			}
			syncedSignIds.push(sign.id);
		}

		return {
			synced: true,
			syncedSignIds,
			syncedSupportIds,
			syncedImageIds,
			timestamp: Date.now(),
		};
	} catch (error: any) {
		console.error("Error syncing sign/support data:", error);
		return rejectWithValue(error.message || "Sync failed");
	}
});

/**
 * Download attachments for a support
 */
export const downloadSupportAttachments = createAsyncThunk<
	{ supportId: string; images: SupportImage[] },
	string,
	{ state: RootState; rejectValue: string }
>(
	"supports/downloadAttachments",
	async (supportId, { getState, rejectWithValue }) => {
		try {
			const state = getState();
			const customerName = state.auth.user?.defaultCustomerName || "default";

			// Fetch attachments metadata from server
			const attachments: BAttachment[] = await apiClient.get(
				ENDPOINTS.SUPPORTS.DOWNLOAD_ATTACHMENTS(supportId),
			);

			const images: SupportImage[] = [];

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
						supportId,
						isNew: false,
						isSynced: true,
					});
				} catch (downloadError) {
					console.error("Error downloading attachment:", downloadError);
				}
			}

			return { supportId, images };
		} catch (error: any) {
			console.error("Error fetching attachments:", error);
			return rejectWithValue(error.message || "Failed to download attachments");
		}
	},
);

/**
 * Download attachments for a sign
 */
export const downloadSignAttachments = createAsyncThunk<
	{ signId: string; images: SignImage[] },
	string,
	{ state: RootState; rejectValue: string }
>(
	"signs/downloadAttachments",
	async (signId, { getState, rejectWithValue }) => {
		try {
			const state = getState();
			const customerName = state.auth.user?.defaultCustomerName || "default";

			// Fetch attachments metadata from server
			const attachments: BAttachment[] = await apiClient.get(
				ENDPOINTS.SIGNS.DOWNLOAD_ATTACHMENTS(signId),
			);

			const images: SignImage[] = [];

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
						signId,
						isNew: false,
						isSynced: true,
					});
				} catch (downloadError) {
					console.error("Error downloading attachment:", downloadError);
				}
			}

			return { signId, images };
		} catch (error: any) {
			console.error("Error fetching attachments:", error);
			return rejectWithValue(error.message || "Failed to download attachments");
		}
	},
);

// ─── Maintenance Sync Thunks ───────────────────────────────────────

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

			// if (response) {
			editedJobs.forEach((job) => syncedJobIds.push(job.id));
			// }
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
						formData.append(image.jobId, image.jobId);

						const response = await apiClient.put(
							ENDPOINTS.MAINTENANCE.UPLOAD_JOB_IMAGE,
							formData,
						);

						if (response) {
							syncedImageIds.push(image.imageId || "");
						}
					}
				} catch (imageError) {
					console.error("Error uploading image:", imageError);
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
					});
				} catch (downloadError) {
					console.error("Error downloading attachment:", downloadError);
				}
			}

			return { jobId, images };
		} catch (error: any) {
			console.error("Error fetching attachments:", error);
			return rejectWithValue(error.message || "Failed to download attachments");
		}
	},
);
