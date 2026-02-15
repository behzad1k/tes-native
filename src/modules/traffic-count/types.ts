import { SYNC_STATUS } from "@/src/constants/global";
import {
	BVehicleClassification,
	BTrafficCountWorkOrder,
	BTrafficCount,
	BMovements,
} from "@/src/types/api";

// ─── Local Work Order Type ─────────────────────────────────────────

export interface TrafficCountWorkOrder {
	// Core identifiers
	id: string; // Local ID (can be same as studyId for synced items)
	studyId: string; // Backend study ID
	no: string; // Work order number

	// Location info
	locationName: string;
	latitude: number;
	longitude: number;
	geoId?: string;

	// Time range
	startDT: string;
	endDT: string;

	// Configuration
	siteType: number;
	aggregationInterval: number; // Slot duration in minutes

	// Status
	note: string;
	isCompleted: boolean;

	// Sync status
	isSynced: boolean;
	isEdited?: boolean;
	status: WorkOrderStatus;
	syncStatus: SyncStatusType;

	// Computed
	daysLeft: number;

	// Counts array
	counts: TrafficCount[];
}

// ─── Local Traffic Count Type ──────────────────────────────────────

export interface TrafficCount {
	id: string;
	siteId: string; // studyId reference
	isSynced: boolean;
	videoId: string;
	lat: number;
	long: number;
	userId: string;
	dateTime: string;
	slot: number;
	movements: Record<string, Record<string, number>>;

	// For UI display
	classificationId?: string;
	classificationName?: string;
}

// ─── Vehicle Classification (local) ────────────────────────────────

export interface VehicleClassification {
	id: string;
	in: string; // Internal ID used in movements
	name: string;
	isPedestrian: boolean;
	applicationClassification: number;
	sortOrder: number;
	icon?: string;
}

// ─── Status Types ──────────────────────────────────────────────────

export type WorkOrderStatus = "To Do" | "In Progress" | "Done";
export type SyncStatusType = "Synced" | "Not Synced" | "Partial";

// ─── Active Count (for current counting session) ───────────────────

export interface ActiveCount {
	id: string;
	siteId: string;
	isSynced: boolean;
	videoId: string;
	lat: number;
	long: number;
	userId: string;
	dateTime: string; // Slot start time
	slot: number;
	movements: Record<string, Record<string, number>>;
}

// ─── Transformation Helpers ────────────────────────────────────────

/**
 * Transform backend work order to local format
 */
export function transformWorkOrder(
	wo: BTrafficCountWorkOrder,
	existingLocal?: TrafficCountWorkOrder,
): TrafficCountWorkOrder {
	const now = new Date();
	const endDate = new Date(wo.endDT);
	const daysLeft = Math.max(
		0,
		Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
	);

	// Determine status based on counts and completion
	let status: WorkOrderStatus = "To Do";
	const counts = existingLocal?.counts || wo.counts || [];

	if (wo.isCompleted) {
		status = "Done";
	} else if (counts.length > 0) {
		status = "In Progress";
	}

	// Check sync status
	const hasUnsyncedCounts = counts.some((c) => !c.isSynced);
	let syncStatus: SyncStatusType = "Synced";

	if (existingLocal && !existingLocal.isSynced) {
		syncStatus = "Not Synced";
	} else if (hasUnsyncedCounts) {
		syncStatus = "Partial";
	}

	return {
		id: wo.studyId,
		studyId: wo.studyId,
		no: wo.no,
		locationName: wo.description,
		latitude: wo.latitude || 0,
		longitude: wo.longitude || 0,
		geoId: wo.geoId,
		startDT: wo.startDT,
		endDT: wo.endDT,
		siteType: wo.siteType || 1,
		aggregationInterval: wo.aggregationInterval || 15,
		note: wo.note || "",
		isCompleted: wo.isCompleted || false,
		isSynced: !hasUnsyncedCounts,
		isEdited: existingLocal?.isEdited || false,
		status,
		syncStatus,
		daysLeft,
		// Preserve local counts if they exist and have unsynced data
		counts: existingLocal?.counts?.length
			? mergeCountsPreservingLocal(
					existingLocal.counts,
					transformCounts(wo.counts || []),
				)
			: transformCounts(wo.counts || []),
	};
}

/**
 * Transform backend counts array to local format
 */
export function transformCounts(counts: BTrafficCount[]): TrafficCount[] {
	return counts.map((c) => ({
		id: c.id,
		siteId: c.siteId,
		isSynced: c.isSynced,
		videoId: c.videoId || "",
		lat: c.lat,
		long: c.long,
		userId: c.userId,
		dateTime: c.dateTime,
		slot: c.slot,
		movements: c.movements,
	}));
}

/**
 * Merge backend counts with local counts, preserving unsynced local data
 */
export function mergeCountsPreservingLocal(
	localCounts: TrafficCount[],
	backendCounts: TrafficCount[],
): TrafficCount[] {
	// Get unsynced local counts
	const unsyncedLocal = localCounts.filter((c) => !c.isSynced);

	// Get synced local counts that might have been updated on backend
	const backendIds = new Set(backendCounts.map((c) => c.id));

	// Keep unsynced local counts that are not in backend
	const localOnly = unsyncedLocal.filter((c) => !backendIds.has(c.id));

	// Merge: backend counts + local-only unsynced counts
	return [...backendCounts, ...localOnly];
}

/**
 * Transform backend vehicle classification to local format
 */
export function transformVehicleClassification(
	vc: BVehicleClassification,
	index: number,
): VehicleClassification {
	return {
		id: vc.id,
		in: vc.in,
		name: vc.name,
		isPedestrian: vc.isPedestrian,
		applicationClassification: vc.applicationClassification,
		sortOrder: vc.sortOrder ?? index,
		icon: getIconForClassification(vc.name, vc.applicationClassification),
	};
}

/**
 * Get icon name for classification
 */
function getIconForClassification(name: string, appClass: number): string {
	const nameLower = name.toLowerCase();

	if (nameLower.includes("pedestrian") || nameLower.includes("ped")) {
		return "Pedestrian";
	}
	if (
		nameLower.includes("bicycle") ||
		nameLower.includes("cyclist") ||
		nameLower.includes("bike")
	) {
		return "Bicycle";
	}
	if (
		nameLower.includes("scooter") ||
		nameLower.includes("motorcycle") ||
		nameLower.includes("motorbike")
	) {
		return "Scooter";
	}
	if (
		nameLower.includes("truck") ||
		nameLower.includes("lorry") ||
		nameLower.includes("hgv")
	) {
		return "Truck";
	}
	if (nameLower.includes("bus") || nameLower.includes("coach")) {
		return "Bus";
	}
	if (nameLower.includes("van")) {
		return "Van";
	}

	// Fallback based on applicationClassification
	switch (appClass) {
		case 1:
		case 3:
			return "Car";
		case 2:
			return "Truck";
		case 4:
			return "Bicycle";
		default:
			return "Car";
	}
}

// ─── Export Types ──────────────────────────────────────────────────

export interface TrafficCountClassification {
	id: string;
	in: string;
	name: string;
	isPedestrian: boolean;
	applicationClassification: number;
}
