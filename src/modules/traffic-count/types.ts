export interface TrafficCountWorkOrder {
	id: string;
	studyId: string;
	no: string;
	locationName: string;
	startDT: string;
	endDT: string;
	latitude: number;
	longitude: number;
	note: string;
	siteType: number;
	aggregationInterval: number;
	isCompleted: boolean;
	isSynced: boolean;
	isEdited?: boolean;
	status: WorkOrderStatus;
	syncStatus: SyncStatusType;
	daysLeft: number;
	counts: TrafficCount[];
}

export interface TrafficCount {
	id: string;
	siteId: string;
	isSynced: boolean;
	videoId: string;
	lat: number;
	long: number;
	userId: string;
	dateTime: string;
	slot: number;
	movements: Record<string, Record<string, number>>;
	/** The vehicle type ID from appData.vehicleTypes */
	classificationId: string;
	/** The vehicle type display name (e.g. "Car", "Truck") */
	classificationName: string;
}

export type WorkOrderStatus = "To Do" | "In Progress" | "Done";
export type SyncStatusType = "Synced" | "Not Synced" | "Partial";

export interface TrafficCountClassification {
	id: string;
	in: string;
	name: string;
	isPedestrian: boolean;
	applicationClassification: number;
}
