import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
	updateJobLocally,
	updateJobImages,
} from "@/src/store/slices/maintenanceSlice";
import {
	MaintenanceJob,
	MaintenanceImage,
	MaintenanceJobUpdate,
} from "@/src/types/models";

export const useMaintenanceOperations = () => {
	const dispatch = useAppDispatch();
	const jobs = useAppSelector((state) => state.maintenance.jobs);
	const jobImages = useAppSelector((state) => state.maintenance.jobImages);
	const jobStatuses = useAppSelector((state) => state.maintenance.jobStatuses);
	const jobTypes = useAppSelector((state) => state.maintenance.jobTypes);

	const getJobById = useCallback(
		(id: string) => jobs.find((j) => j.id === id),
		[jobs],
	);

	const getJobImages = useCallback(
		(jobId: string): MaintenanceImage[] => {
			return jobImages.filter((img) => img.jobId === jobId);
		},
		[jobImages],
	);

	const editJob = useCallback(
		async (jobId: string, updates: MaintenanceJobUpdate) => {
			try {
				const job = jobs.find((j) => j.id === jobId);
				if (!job) return { success: false, error: "Job not found" };

				dispatch(
					updateJobLocally({
						...job,
						...updates,
					}),
				);

				return { success: true };
			} catch (error) {
				console.error("Error updating job:", error);
				return { success: false, error };
			}
		},
		[dispatch, jobs],
	);

	const saveJobImages = useCallback(
		(jobId: string, images: MaintenanceImage[]) => {
			dispatch(updateJobImages({ jobId, images }));
		},
		[dispatch],
	);

	return {
		jobs,
		jobImages,
		jobStatuses,
		jobTypes,
		getJobById,
		getJobImages,
		editJob,
		saveJobImages,
	};
};
