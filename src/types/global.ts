import { SYNC_STATUS, JOB_STATUS } from "@/src/constants/global";

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];
