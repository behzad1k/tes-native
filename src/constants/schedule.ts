import { StudyType, TaskStatus } from "../modules/schedule/types";

export const TASK_STATUS: Record<TaskStatus, { label: string; color: string }> =
	{
		TO_DO: { label: "To Do", color: "#6B7280" },
		IN_PROGRESS: { label: "In Progress", color: "#F59E0B" },
		DONE: { label: "Done", color: "#9BC631" },
	};

export const STUDY_TYPES: StudyType[] = [
	"Speed",
	"TMC",
	"Volume",
	"Classification",
];

export const SCHEDULE_TABS = {
	LIST: { id: "LIST", value: "List" },
	MAP: { id: "MAP", value: "Map" },
	CALENDAR: { id: "CALENDAR", value: "Calendar" },
} as const;

export const DEFAULT_TIME_PERIODS = [
	{ id: "1", from: "06:00", to: "06:00" },
	{ id: "2", from: "06:00", to: "06:00" },
];

export const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
