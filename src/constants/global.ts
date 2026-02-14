export const JOB_STATUS = {
	DONE: "DONE",
	IN_PROGRESS: "IN_PROGRESS",
	NOT_DONE: "NOT_DONE",
} as const;

export const FilterOperator = {
	EQUAL: "EQUAL",
	MORE: "MORE",
	LESS: "LESS",
} as const;

export const SortDirection = {
	ASC: "ASC",
	DESC: "DESC",
} as const;
// Sync status constants
export const SYNC_STATUS = {
	SYNCED: "SYNCED",
	NOT_SYNCED: "NOT_SYNCED",
	SYNCING: "SYNCING",
	ERROR: "ERROR",
} as const;

export type SyncStatusType = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

// Asset types for job assets
export const ASSET_TYPE = {
	SUPPORT: 1,
	SIGN: 2,
} as const;

export type AssetType = (typeof ASSET_TYPE)[keyof typeof ASSET_TYPE];

// Job status types
export const JOB_STATUS_TYPE = {
	PENDING: 0,
	IN_PROGRESS: 1,
	COMPLETED: 2,
	CANCELLED: 3,
} as const;

export type JobStatusType =
	(typeof JOB_STATUS_TYPE)[keyof typeof JOB_STATUS_TYPE];
