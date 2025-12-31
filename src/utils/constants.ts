export const SIGN_TYPES = {
	STOP: "stop",
	YIELD: "yield",
	SPEED_LIMIT: "speed_limit",
	NO_PARKING: "no_parking",
	ONE_WAY: "one_way",
	OTHER: "other",
} as const;

export const SIGN_CONDITIONS = {
	GOOD: "good",
	FAIR: "fair",
	POOR: "poor",
	DAMAGED: "damaged",
} as const;

export const SYNC_STATUS = {
	PENDING: "pending",
	SYNCED: "synced",
	FAILED: "failed",
} as const;
