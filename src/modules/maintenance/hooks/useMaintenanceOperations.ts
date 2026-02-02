import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
	fetchJobs,
	updateJob,
	updateJobAsset,
	addJobImagesLocally,
	removeJobImage,
	downloadJobAttachments,
	updateJobLocally,
	markJobSynced,
} from "@/src/store/slices/maintenanceSlice";
import { MaintenanceJob, JobAsset, MaintenanceImage } from "@/src/types/models";
import * as ImagePicker from "expo-image-picker";
import { Toast } from "toastify-react-native";

export const useMaintenanceOperations = () => {
	const dispatch = useAppDispatch();
	const jobs = useAppSelector((state) => state.maintenances.jobs);
	const jobStatuses = useAppSelector((state) => state.maintenances.jobStatuses);
	const jobTypes = useAppSelector((state) => state.maintenances.jobTypes);
	const jobImages = useAppSelector((state) => state.maintenances.jobImages);
	const isLoading = useAppSelector((state) => state.maintenances.isLoading);
	const lastFetched = useAppSelector((state) => state.maintenances.lastFetched);

	const refreshJobs = useCallback(async () => {
		try {
			await dispatch(fetchJobs()).unwrap();
			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	}, [dispatch]);

	const updateJobData = useCallback(
		async (job: MaintenanceJob) => {
			try {
				await dispatch(updateJob(job)).unwrap();
				return { success: true };
			} catch (error: any) {
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	const updateJobLocalData = useCallback(
		(job: MaintenanceJob) => {
			dispatch(updateJobLocally(job));
		},
		[dispatch],
	);

	const updateAsset = useCallback(
		async (jobId: string, asset: JobAsset) => {
			try {
				await dispatch(updateJobAsset({ jobId, asset })).unwrap();
				return { success: true };
			} catch (error: any) {
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	const getJobImages = useCallback(
		(jobId: string) => {
			return jobImages.filter((img) => img.jobId === jobId);
		},
		[jobImages],
	);

	const addImagesFromGallery = useCallback(
		async (jobId: string) => {
			try {
				const { status } =
					await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (status !== "granted") {
					Toast.error("Camera roll permission required");
					return { success: false, error: "Permission denied" };
				}

				const result = await ImagePicker.launchImageLibraryAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					allowsMultipleSelection: true,
					quality: 1,
				});

				if (!result.canceled && result.assets) {
					const images: MaintenanceImage[] = result.assets.map((asset) => ({
						uri: asset.uri,
						isSynced: false,
						jobId: jobId,
						isNew: true,
					}));

					dispatch(addJobImagesLocally(images));
					return { success: true, images };
				}

				return { success: false, error: "No images selected" };
			} catch (error: any) {
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	const addImageFromCamera = useCallback(
		async (jobId: string) => {
			try {
				const { status } = await ImagePicker.requestCameraPermissionsAsync();
				if (status !== "granted") {
					Toast.error("Camera permission required");
					return { success: false, error: "Permission denied" };
				}

				const result = await ImagePicker.launchCameraAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					quality: 1,
				});

				if (!result.canceled && result.assets?.[0]) {
					const image: MaintenanceImage = {
						uri: result.assets[0].uri,
						isSynced: false,
						jobId: jobId,
						isNew: true,
					};

					dispatch(addJobImagesLocally([image]));
					return { success: true, image };
				}

				return { success: false, error: "No image captured" };
			} catch (error: any) {
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	const deleteImage = useCallback(
		(imageUri: string) => {
			dispatch(removeJobImage(imageUri));
			return { success: true };
		},
		[dispatch],
	);

	const downloadAttachments = useCallback(
		async (jobId: string) => {
			try {
				await dispatch(downloadJobAttachments(jobId)).unwrap();
				return { success: true };
			} catch (error: any) {
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	const getJobById = useCallback(
		(jobId: string) => {
			return jobs.find((job) => job.id === jobId);
		},
		[jobs],
	);

	const getJobsByStatus = useCallback(
		(statusId: string) => {
			return jobs.filter((job) => job.statusId === statusId);
		},
		[jobs],
	);

	const getJobsByType = useCallback(
		(typeId: string) => {
			return jobs.filter((job) => job.typeId === typeId);
		},
		[jobs],
	);

	const getUnsyncedJobs = useCallback(() => {
		return jobs.filter((job) => !job.isSynced || job.isEdited);
	}, [jobs]);

	const markAsSynced = useCallback(
		(jobId: string) => {
			dispatch(markJobSynced(jobId));
		},
		[dispatch],
	);

	const formatDuration = useCallback((duration: number) => {
		const hours = Math.floor(duration / 60);
		const minutes = duration % 60;
		return { hours, minutes, formatted: `${hours}h ${minutes}m` };
	}, []);

	const parseDuration = useCallback((hours: string, minutes: string) => {
		const h = parseInt(hours || "0");
		const m = parseInt(minutes || "0");
		return h * 60 + m;
	}, []);

	const getStatusName = useCallback(
		(statusId: string) => {
			return jobStatuses.find((s) => s.id === statusId)?.name || statusId;
		},
		[jobStatuses],
	);

	const getTypeName = useCallback(
		(typeId: string) => {
			return jobTypes.find((t) => t.id === typeId)?.name || typeId;
		},
		[jobTypes],
	);

	const filterAndSortJobs = useCallback(
		(
			filterByStatus: string[] = [],
			filterByType: string[] = [],
			sortBy: "assignDate" | "duration" | "name" = "assignDate",
			sortDir: "ASC" | "DESC" = "DESC",
		) => {
			let filtered = [...jobs];

			if (filterByStatus.length > 0) {
				filtered = filtered.filter((job) =>
					filterByStatus.includes(job.statusName),
				);
			}

			if (filterByType.length > 0) {
				filtered = filtered.filter((job) =>
					filterByType.includes(job.typeName),
				);
			}

			filtered.sort((a, b) => {
				let comparison = 0;

				switch (sortBy) {
					case "assignDate":
						comparison =
							new Date(a.assignDate).getTime() -
							new Date(b.assignDate).getTime();
						break;
					case "duration":
						comparison = a.duration - b.duration;
						break;
					case "name":
						comparison = a.name.localeCompare(b.name);
						break;
				}

				return sortDir === "ASC" ? comparison : -comparison;
			});

			return filtered;
		},
		[jobs],
	);

	const searchJobs = useCallback(
		(searchTerm: string) => {
			const term = searchTerm.toLowerCase();
			return jobs.filter(
				(job) =>
					job.name.toLowerCase().includes(term) ||
					job.typeName.toLowerCase().includes(term) ||
					job.statusName.toLowerCase().includes(term) ||
					job.assignDate.toLowerCase().includes(term) ||
					job.note?.toLowerCase().includes(term),
			);
		},
		[jobs],
	);

	const getStatistics = useCallback(() => {
		const total = jobs.length;
		const byStatus = jobStatuses.map((status) => ({
			statusId: status.id,
			statusName: status.name,
			count: jobs.filter((job) => job.statusId === status.id).length,
		}));
		const byType = jobTypes.map((type) => ({
			typeId: type.id,
			typeName: type.name,
			count: jobs.filter((job) => job.typeId === type.id).length,
		}));
		const unsynced = jobs.filter((job) => !job.isSynced || job.isEdited).length;

		return {
			total,
			byStatus,
			byType,
			unsynced,
		};
	}, [jobs, jobStatuses, jobTypes]);

	return {
		jobs,
		jobStatuses,
		jobTypes,
		jobImages,
		isLoading,
		lastFetched,

		refreshJobs,
		updateJobData,
		updateJobLocalData,
		updateAsset,
		getJobImages,
		addImagesFromGallery,
		addImageFromCamera,
		deleteImage,
		downloadAttachments,

		getJobById,
		getJobsByStatus,
		getJobsByType,
		getUnsyncedJobs,
		filterAndSortJobs,
		searchJobs,
		getStatistics,

		markAsSynced,
		formatDuration,
		parseDuration,
		getStatusName,
		getTypeName,
	};
};
