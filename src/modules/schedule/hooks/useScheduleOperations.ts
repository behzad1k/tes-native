import { useState, useCallback, useMemo } from "react";
import {
	Task,
	InspectionTask,
	TaskStatus,
	ScheduleFilter,
	ScheduleSort,
	TimePeriod,
	ScheduleAttachment,
	StudyType,
} from "../types";
import { SYNC_STATUS } from "@/src/constants/global";
import mockSchedules from "@/src/data/mockSchedule.json";
import { SyncStatus } from "@/src/types/models";

export const useScheduleOperations = () => {
	const [tasks, setTasks] = useState<Task[]>(
		mockSchedules.schedules.map((e) => ({
			...e,
			studyType: e.studyType as StudyType,
			status: e.status as TaskStatus,
			syncStatus: e.syncStatus as SyncStatus,
			inspectionTasks: e.inspectionTasks.map((j) => ({
				...j,
				status: j.status as TaskStatus,
				syncStatus: j.syncStatus as SyncStatus,
			})),
		})),
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Get a single task by ID
	const getTaskById = useCallback(
		(id: string): Task | undefined => tasks.find((t) => t.id === id),
		[tasks],
	);

	// Get inspection task by ID
	const getInspectionTaskById = useCallback(
		(taskId: string, inspectionId: string): InspectionTask | undefined => {
			const task = tasks.find((t) => t.id === taskId);
			return task?.inspectionTasks.find((i) => i.id === inspectionId);
		},
		[tasks],
	);

	// Update a task
	const updateTask = useCallback(
		async (
			taskId: string,
			updates: Partial<Task>,
		): Promise<{ success: boolean; error?: string }> => {
			try {
				setTasks((prev) =>
					prev.map((task) =>
						task.id === taskId
							? { ...task, ...updates, isEdited: true, isSynced: false }
							: task,
					),
				);
				return { success: true };
			} catch (err: any) {
				return { success: false, error: err.message };
			}
		},
		[],
	);

	// Update an inspection task
	const updateInspectionTask = useCallback(
		async (
			taskId: string,
			inspectionId: string,
			updates: Partial<InspectionTask>,
		): Promise<{ success: boolean; error?: string }> => {
			try {
				setTasks((prev) =>
					prev.map((task) =>
						task.id === taskId
							? {
									...task,
									isEdited: true,
									isSynced: false,
									inspectionTasks: task.inspectionTasks.map((inspection) =>
										inspection.id === inspectionId
											? {
													...inspection,
													...updates,
													isEdited: true,
													isSynced: false,
												}
											: inspection,
									),
								}
							: task,
					),
				);
				return { success: true };
			} catch (err: any) {
				return { success: false, error: err.message };
			}
		},
		[],
	);

	// Claim a task
	const claimTask = useCallback(
		async (
			inspectionTask: InspectionTask,
		): Promise<{ success: boolean; error?: string }> => {
			try {
				// In real implementation, this would make an API call
				console.log("Claiming task:", inspectionTask.inspectionTaskNumber);
				return { success: true };
			} catch (err: any) {
				return { success: false, error: err.message };
			}
		},
		[],
	);

	// Sync all unsynced tasks
	const syncTasks = useCallback(async (): Promise<{
		success: boolean;
		syncedCount?: number;
		error?: string;
	}> => {
		setIsSyncing(true);
		try {
			// In real implementation, this would sync with the server
			const unsyncedTasks = tasks.filter((t) => !t.isSynced && t.isEdited);

			// Simulate sync
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setTasks((prev) =>
				prev.map((task) =>
					task.isEdited && !task.isSynced
						? { ...task, isSynced: true, syncStatus: SYNC_STATUS.SYNCED }
						: task,
				),
			);

			return { success: true, syncedCount: unsyncedTasks.length };
		} catch (err: any) {
			return { success: false, error: err.message };
		} finally {
			setIsSyncing(false);
		}
	}, [tasks]);

	// Filter and sort tasks
	const getFilteredTasks = useCallback(
		(filter?: ScheduleFilter, sort?: ScheduleSort): Task[] => {
			let result = [...tasks];

			// Apply filters
			if (filter) {
				if (filter.status && filter.status.length > 0) {
					result = result.filter((t) => filter.status!.includes(t.status));
				}
				if (filter.studyType && filter.studyType.length > 0) {
					result = result.filter((t) =>
						filter.studyType!.includes(t.studyType),
					);
				}
				if (filter.syncStatus && filter.syncStatus.length > 0) {
					result = result.filter((t) =>
						filter.syncStatus!.includes(t.syncStatus),
					);
				}
			}

			// Apply sorting
			if (sort) {
				result.sort((a, b) => {
					const aVal = a[sort.key];
					const bVal = b[sort.key];

					if (typeof aVal === "string" && typeof bVal === "string") {
						return sort.direction === "ASC"
							? aVal.localeCompare(bVal)
							: bVal.localeCompare(aVal);
					}
					return 0;
				});
			}

			return result;
		},
		[tasks],
	);

	// Get tasks for a specific date
	const getTasksForDate = useCallback(
		(date: Date): Task[] => {
			return tasks.filter((task) => {
				// Parse task date and compare
				const taskDate = parseTaskDate(task.startDate);
				return taskDate && taskDate.toDateString() === date.toDateString();
			});
		},
		[tasks],
	);

	// Get count of unsynced tasks
	const getUnsyncedCount = useMemo(() => {
		return tasks.filter((t) => !t.isSynced && t.isEdited).length;
	}, [tasks]);

	return {
		// State
		tasks,
		isLoading,
		isSyncing,
		error,

		// Getters
		getTaskById,
		getInspectionTaskById,
		getFilteredTasks,
		getTasksForDate,
		getUnsyncedCount,

		// Actions
		updateTask,
		updateInspectionTask,
		claimTask,
		syncTasks,
	};
};

// Helper function to parse date string "DD MMM YYYY"
function parseTaskDate(dateStr: string): Date | null {
	try {
		const parts = dateStr.split(" ");
		if (parts.length !== 3) return null;

		const day = parseInt(parts[0], 10);
		const monthStr = parts[1];
		const year = parseInt(parts[2], 10);

		const months = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];

		const monthIndex = months.findIndex(
			(m) => m.toLowerCase() === monthStr.toLowerCase(),
		);

		if (monthIndex === -1) return null;

		return new Date(year, monthIndex, day);
	} catch {
		return null;
	}
}
