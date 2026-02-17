import { SyncStatus } from "@/src/types/models";

// ─── Schedule Types ────────────────────────────────────────────────

export type ScheduleViewTab = "LIST" | "MAP" | "CALENDAR";

export type TaskStatus = "TO_DO" | "IN_PROGRESS" | "DONE";

export type StudyType = "Speed" | "TMC" | "Volume" | "Classification";

export interface TimePeriod {
  id: string;
  from: string; // Format: "HH:mm" (e.g., "06:00")
  to: string;   // Format: "HH:mm" (e.g., "18:00")
}

export interface DataCollector {
  id: string;
  name: string;
  region: string;
  avatar?: string;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

// ─── Task (Parent) ─────────────────────────────────────────────────

export interface Task {
  id: string;
  taskNumber: string;           // e.g., "1040-1"
  studyType: StudyType;
  status: TaskStatus;
  startDate: string;            // Format: "DD MMM YYYY"
  endDate: string;
  timePeriods: TimePeriod[];
  note?: string;
  location: string;             // e.g., "RAINBOW DR @ STAR AV"
  latitude?: number;
  longitude?: number;
  isSynced: boolean;
  syncStatus: SyncStatus;
  inspectionTasks: InspectionTask[];
  isEdited?: boolean;
}

// ─── Inspection Task (Child of Task) ───────────────────────────────

export interface InspectionTask {
  id: string;
  taskId: string;               // Parent task reference
  inspectionTaskNumber: string; // e.g., "1040-01-1-01"
  status: TaskStatus;
  startDate: string;
  endDate: string;
  startTime?: string;           // Format: "HH:mm"
  endTime?: string;
  timePeriods: TimePeriod[];
  note?: string;
  dataCollectors: DataCollector[];
  equipments: Equipment[];
  attachments: ScheduleAttachment[];
  isSynced: boolean;
  syncStatus: SyncStatus;
  isEdited?: boolean;
}

// ─── Attachments ───────────────────────────────────────────────────

export interface ScheduleAttachment {
  id: string;
  taskId?: string;
  inspectionTaskId?: string;
  uri: string;
  localPath?: string;
  isNew: boolean;
  isSynced: boolean;
}

// ─── Calendar Types ────────────────────────────────────────────────

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export interface CalendarMonth {
  month: number;
  year: number;
  name: string;
  days: CalendarDay[];
}

// ─── Filter/Sort Types ─────────────────────────────────────────────

export interface ScheduleFilter {
  status?: TaskStatus[];
  studyType?: StudyType[];
  syncStatus?: SyncStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ScheduleSort {
  key: "taskNumber" | "startDate" | "status" | "studyType";
  direction: "ASC" | "DESC";
}

// ─── API Response Types ────────────────────────────────────────────

export interface ScheduleApiResponse {
  tasks: Task[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── Form Data Types ───────────────────────────────────────────────

export interface TaskFormData {
  status: TaskStatus;
  timePeriods: TimePeriod[];
  note?: string;
}

export interface InspectionTaskFormData {
  status: TaskStatus;
  timePeriods: TimePeriod[];
  note?: string;
  attachments: ScheduleAttachment[];
}
