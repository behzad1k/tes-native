export const SYNC_STATUS = {
	SYNCED: "SYNCED",
	NOT_SYNCED: "NOT_SYNCED",
} as const;

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
