import { SYNC_STATUS } from "@/src/constants/global";

// ─── User ──────────────────────────────────────────────────────────

export interface User {
	userId: string;
	firstName: string;
	lastName: string;
	userName: string;
	email: string;
	permissions: string[];
	defaultCustomerId: string;
	defaultCustomerName: string;
}

// ─── Sync Status ───────────────────────────────────────────────────

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

// ─── Base Image ────────────────────────────────────────────────────

export interface BaseImage {
	imageId?: string;
	uri: string;
	localPath?: string;
	isNew: boolean;
	isSynced: boolean;
}

// ─── Sign Types ────────────────────────────────────────────────────

export interface SignImage extends BaseImage {
	signId: string;
}

export interface Sign {
	id: string;
	localId?: string;
	serverId?: string;

	customerId: string;
	signId: string;
	supportId?: string;
	signCodeId: string;
	locationTypeId?: string;
	latitude?: number;
	longitude?: number;
	address?: string;

	height?: string;
	facingDirectionId?: string;
	faceMaterialId?: string;
	reflectiveCoatingId?: string;
	reflectiveRatingId?: string;
	dimensionId?: string;

	dateInstalled?: string;
	conditionId?: string;
	note?: string;

	images: SignImage[];
	isNew: boolean;
	isSynced: boolean;
	status: SyncStatus;
}

export interface SignSupportCode {
	id: string;
	name: string;
	code: string;
	dimensionId: string | null;
	materialCost: number;
	labourCost: number;
	installationCost: number;
}

export interface SystemOption {
	id: string;
	name: string;
}

// ─── Support Types ─────────────────────────────────────────────────

export interface SupportImage extends BaseImage {
	supportId: string;
}

export interface Support {
	id: string;
	localId?: string;
	serverId?: string;

	customerId: string;
	supportId: string;
	supportCodeId: string;
	supportLocationTypeId?: string;
	locationId?: string;
	supportPositionId?: string;
	latitude?: number;
	longitude?: number;
	address?: string;
	distanceFromShoulder?: number;

	dateInstalled?: string;
	supportConditionId?: string;
	note?: string;
	supportMaterialId: string;
	supportTypeId: string;

	signs: Sign[];
	images: SupportImage[];
	isNew: boolean;
	isSynced: boolean;
	status: SyncStatus;
}

// ─── Change Log Types (for sync) ───────────────────────────────────

export interface ChangeLog {
	id: string;
	changeDate: string;
	customerId: string;
	userId: string;
	username: string;
	type: ChangeLogType;
	field: string;
	fromValue: string;
	toValue: string;
	supportId: string;
	signId: string;
}

export enum ChangeLogType {
	CHANGE_FIELD = 1,
	ADD_PIC = 2,
	REMOVE_PIC = 3,
	ADD_SIGN_TO_SUPPORT = 4,
	REMOVE_SIGN_FROM_SUPPORT = 5,
	REMOVE_SIGN = 6,
	REMOVE_SUPPORT = 7,
}

// ─── Maintenance/Job Types ─────────────────────────────────────────

export interface JobAsset {
	id: string;
	jobId: string;
	assetId: string;
	type: number; // 1 = Support, 2 = Sign
	statusId: string;
	note?: string;
	isEdited?: boolean;
}

export interface JobStatus {
	id: string;
	name: string;
	jobStatusType?: number;
}

export interface JobType {
	id: string;
	name: string;
	index?: number;
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
	isEdited: boolean;
	isSynced: boolean;
}

export interface MaintenanceImage extends BaseImage {
	jobId: string;
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

// ─── Map Types ─────────────────────────────────────────────────────

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
	type: "sign" | "support";
	coordinate: MapCoordinate;
	title: string;
	description?: string;
	item: Sign | Support;
}

// ─── Backend Image Types ───────────────────────────────────────────

export interface BackendImage {
	id: string;
	url: string;
	signId?: string;
	supportId?: string;
	jobId?: string;
	thumbnailUrl?: string;
}

// ─── Filter/Sort Types ─────────────────────────────────────────────

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
