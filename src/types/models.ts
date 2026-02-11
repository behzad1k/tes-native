export interface User {
	id: string;
	name: string;
	phoneNumber: string;
	role: string;
}

export interface BackendImage {
	id: string;
	url: string;
	signId: string;
	thumbnailUrl?: string;
}

export interface BaseImage {
	imageId: string;
	uri: string;
	localPath?: string;
	isNew: boolean;
	status: SyncStatus;
}

export interface SignImage extends BaseImage {
	signId: string;
}

export interface SupportImage extends BaseImage {
	supportId: string;
}

export interface MaintenanceImage extends BaseImage {
	jobId: string;
	isSynced: boolean;
}

export interface JobAsset {
	id: string;
	assetId: string;
	type: number;
	statusId: string;
	note?: string;
	isEdited?: boolean;
}

export interface MaintenanceJob {
	id: string;
	name: string;
	typeId: string;
	typeName: string;
	statusId: string;
	statusName: string;
	assignDate: string;
	duration: number;
	note?: string;
	assets: JobAsset[];
	isEdited?: boolean;
	isSynced: boolean;
}

export interface MaintenanceJobUpdate {
	statusId?: string;
	duration?: number;
	note?: string;
	assets?: JobAsset[];
}

export interface JobAssetUpdate {
	id: string;
	statusId?: string;
	note?: string;
}

export interface JobType {
	id: string;
	name: string;
}

export interface JobStatus {
	id: string;
	name: string;
}

export enum FilterMaintenanceOperator {
	EQUAL = "equal",
	MORE = "more",
	LESS = "less",
}

export type FilterMaintenance = {
	key: string;
	value: string;
	operator?: FilterMaintenanceOperator;
};

export type SortMaintenance = { key: string; dir: "ASC" | "DESC" };

// ─── Map ───────────────────────────────────────────────────────────
export interface MapCoordinate {
	latitude: number;
	longitude: number;
}

export interface MapRegion extends MapCoordinate {
	latitudeDelta?: number;
	longitudeDelta?: number;
	zoom?: number;
}

export interface MapMarkerData {
	id: string;
	type: 1 | 2;
	coordinate: MapCoordinate;
	title: string;
	statusId: string;
	statusName: string;
	jobId: string;
}

export interface MaintenanceJobFormData {
	jobId: string;
	description: string;
	status: string;
	assignedTo: string;
	dueDate: string;
	notes: string;
}

export interface Sign {
	id: string;
	localId?: string;
	serverId?: string;

	customerId: string;
	locationTypeId: string;
	latitude?: number;
	longitude?: number;
	address?: string;

	signId: string;
	supportId: string;
	codeId: string;

	height: string;
	facingDirectionId: string;
	faceMaterialId: string;
	reflectiveCoatingId: string;
	reflectiveRatingId: string;
	dimensionId: string;

	dateInstalled: string;
	conditionId: string;
	note: string;

	images: SignImage[];
	isNew: boolean;
	status: SyncStatus;
}

export interface Support {
	id: string;
	localId?: string;
	serverId?: string;

	customerId: string;
	supportLocationTypeId: string;
	locationId: string;
	latitude?: number;
	longitude?: number;
	address?: string;

	supportId: string;
	codeId: string;
	positionId: string;

	dateInstalled: string;
	conditionId: string;
	note: string;

	signs: Array<{
		id: string;
		supportId?: string;
		signId: string;
		[key: string]: any;
	}>;

	images: Array<SupportImage>;
	isNew: boolean;
	isSynced: boolean;
	status: SyncStatus;
}

export type SyncStatus = "SYNCED" | "NOT_SYNCED";
