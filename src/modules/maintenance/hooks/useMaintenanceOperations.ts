import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
	updateJobLocally,
	updateJobAssetLocally,
	updateJobImages,
	addJobImage,
	removeJobImage,
	markJobSynced,
	markJobImagesSynced,
} from "@/src/store/slices/maintenanceSlice";
import {
	syncMaintenanceData,
	downloadJobAttachments,
} from "@/src/store/thunks";
import {
	MaintenanceJob,
	MaintenanceImage,
	MaintenanceJobUpdate,
	JobAsset,
} from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";

export const useMaintenanceOperations = () => {
	const dispatch = useAppDispatch();

	// Selectors
	const jobs = useAppSelector((state) => state.maintenance.jobs);
	const jobImages = useAppSelector((state) => state.maintenance.jobImages);
	const jobStatuses = useAppSelector((state) => state.maintenance.jobStatuses);
	const jobTypes = useAppSelector((state) => state.maintenance.jobTypes);
	const isLoading = useAppSelector((state) => state.maintenance.isLoading);
	const isSyncing = useAppSelector((state) => state.maintenance.isSyncing);
	const syncError = useAppSelector((state) => state.maintenance.syncError);

	// Get a single job by ID
	const getJobById = useCallback(
		(id: string): MaintenanceJob | undefined => jobs.find((j) => j.id === id),
		[jobs],
	);

	// Get images for a specific job
	const getJobImages = useCallback(
		(jobId: string): MaintenanceImage[] => {
			return jobImages.filter((img) => img.jobId === jobId);
		},
		[jobImages],
	);

	// Get unsynced images for a job
	const getUnsyncedJobImages = useCallback(
		(jobId: string): MaintenanceImage[] => {
			return jobImages.filter(
				(img) => img.jobId === jobId && !img.isSynced && img.isNew,
			);
		},
		[jobImages],
	);

	// Edit a job (marks it as edited/unsynced)
	const editJob = useCallback(
		async (
			jobId: string,
			updates: MaintenanceJobUpdate,
		): Promise<{ success: boolean; error?: string }> => {
			try {
				const job = jobs.find((j) => j.id === jobId);
				if (!job) {
					return { success: false, error: "Job not found" };
				}

				// Update status name if statusId changed
				let statusName = job.statusName;
				if (updates.statusId && updates.statusId !== job.statusId) {
					const newStatus = jobStatuses.find((s) => s.id === updates.statusId);
					if (newStatus) {
						statusName = newStatus.name;
					}
				}

				dispatch(
					updateJobLocally({
						id: jobId,
						...updates,
						statusName,
					}),
				);

				return { success: true };
			} catch (error: any) {
				console.error("Error updating job:", error);
				return { success: false, error: error.message };
			}
		},
		[dispatch, jobs, jobStatuses],
	);

	// Update a job asset
	const editJobAsset = useCallback(
		async (
			jobId: string,
			asset: JobAsset,
		): Promise<{ success: boolean; error?: string }> => {
			try {
				dispatch(updateJobAssetLocally({ jobId, asset }));
				return { success: true };
			} catch (error: any) {
				console.error("Error updating job asset:", error);
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	// Save images for a job
	const saveJobImages = useCallback(
		(jobId: string, images: MaintenanceImage[]) => {
			dispatch(updateJobImages({ jobId, images }));
		},
		[dispatch],
	);

	// Add a single image to a job
	const addImage = useCallback(
		(image: MaintenanceImage) => {
			dispatch(addJobImage(image));
		},
		[dispatch],
	);

	// Remove an image from a job
	const deleteImage = useCallback(
		(jobId: string, imageId: string) => {
			dispatch(removeJobImage({ jobId, imageId }));
		},
		[dispatch],
	);

	// Sync all unsynced maintenance data
	const syncData = useCallback(async (): Promise<{
		success: boolean;
		syncedCount?: number;
		error?: string;
	}> => {
		try {
			const result = await dispatch(syncMaintenanceData()).unwrap();
			return {
				success: result.synced,
				syncedCount: result.syncedJobIds.length + result.syncedImageIds.length,
			};
		} catch (error: any) {
			console.error("Error syncing maintenance data:", error);
			return { success: false, error: error.message };
		}
	}, [dispatch]);

	// Download attachments for a job
	const fetchJobAttachments = useCallback(
		async (
			jobId: string,
		): Promise<{
			success: boolean;
			images?: MaintenanceImage[];
			error?: string;
		}> => {
			try {
				const result = await dispatch(downloadJobAttachments(jobId)).unwrap();
				return { success: true, images: result.images };
			} catch (error: any) {
				console.error("Error downloading attachments:", error);
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	// Get count of unsynced jobs
	const getUnsyncedJobsCount = useCallback((): number => {
		return jobs.filter((job) => job.isEdited && !job.isSynced).length;
	}, [jobs]);

	// Get count of unsynced images
	const getUnsyncedImagesCount = useCallback((): number => {
		return jobImages.filter((img) => !img.isSynced && img.isNew).length;
	}, [jobImages]);

	// Check if there are any pending changes
	const hasPendingChanges = useCallback((): boolean => {
		return getUnsyncedJobsCount() > 0 || getUnsyncedImagesCount() > 0;
	}, [getUnsyncedJobsCount, getUnsyncedImagesCount]);

	return {
		// State
		jobs,
		jobImages,
		jobStatuses,
		jobTypes,
		isLoading,
		isSyncing,
		syncError,

		// Getters
		getJobById,
		getJobImages,
		getUnsyncedJobImages,
		getUnsyncedJobsCount,
		getUnsyncedImagesCount,
		hasPendingChanges,

		// Actions
		editJob,
		editJobAsset,
		saveJobImages,
		addImage,
		deleteImage,
		syncData,
		fetchJobAttachments,
	};
};
