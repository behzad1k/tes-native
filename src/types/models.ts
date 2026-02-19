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
	signId?: string;
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
	supportId?: string;
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

export interface CollisionImage extends BaseImage {
	collisionId: string;
}

// ─── Collision Field Configuration ─────────────────────────────────

export interface CollisionFieldValue {
	id: string;
	name: string;
}

export enum CollisionFieldType {
	TEXT = 1,
	NUMBER = 2,
	SWITCH = 3,
	DATE = 4,
	TIME = 5,
	DATETIME = 6,
	SELECT = 7,
	AUTO_GENERATE = 8,
	TEXTAREA = 9,
	INTEGRATION = 10,
}

export interface CollisionField {
	name: string;
	labelText: string;
	fieldType: CollisionFieldType;
	isRequired: boolean;
	validationRule?: string;
	description?: string;
	isUpperCase?: boolean;
	fieldValues?: CollisionFieldValue[];
	integrationAddress?: string;
}

export interface CollisionFields {
	generalFields: CollisionField[];
	roadFields: CollisionField[];
	vehicleFields: CollisionField[];
	driverFields: CollisionField[];
	passengerFields: CollisionField[];
	pedestrianFields: CollisionField[];
	personFields: CollisionField[];
	remarkFields: CollisionField[];
}

// ─── Division ──────────────────────────────────────────────────────

export interface CollisionDivision {
	id: string;
	name: string;
}

// ─── Map Location ──────────────────────────────────────────────────

export interface CollisionMapLocation {
	latitude: number;
	longitude: number;
	latitudeDelta?: number;
	longitudeDelta?: number;
}

// ─── Road ──────────────────────────────────────────────────────────

export interface CollisionRoad {
	id: string;
	index: string;
	[key: string]: any;
}

// ─── Vehicle ───────────────────────────────────────────────────────

export interface CollisionVehicle {
	id: string;
	index: string;
	[key: string]: any;
}

// ─── Person Involved ───────────────────────────────────────────────

export enum InvolvedAsType {
	OTHER_PEOPLE = 1,
	PEDESTRIAN = 2,
	DRIVER = 3,
	PASSENGER = 4,
}

export interface CollisionPerson {
	id: string;
	involvedAs: InvolvedAsType;
	vehicleId?: string;
	[key: string]: any;
}

// ─── General Data ──────────────────────────────────────────────────

export interface CollisionGeneral {
	[key: string]: any;
}

// ─── Remark ────────────────────────────────────────────────────────

export interface CollisionRemark {
	[key: string]: any;
}

// ─── Main Collision Model ──────────────────────────────────────────

export interface Collision {
	id: string;
	localId?: string;
	serverId?: string;

	customerId: string;
	userId: string;
	divisionId: string;

	status: number;
	syncStatus: SyncStatus;
	isNew: boolean;
	isSynced: boolean;

	submissionDT: string;
	editedSubmissionDT?: string;

	mapLocation: CollisionMapLocation;
	submissionMapLocation?: CollisionMapLocation;
	editedSubmissionMapLocation?: CollisionMapLocation;

	general: CollisionGeneral;
	roads: CollisionRoad[];
	vehicles: CollisionVehicle[];
	persons: CollisionPerson[];
	remark: CollisionRemark;
	images: CollisionImage[];
}

// ─── Draft ─────────────────────────────────────────────────────────

export interface CollisionDraft extends Collision {
	isDraft: boolean;
}

// ─── Form Data Types ───────────────────────────────────────────────

export interface CollisionFormData {
	id: string;
	customerId: string;
	userId: string;
	divisionId: string;

	latitude: number;
	longitude: number;

	general: CollisionGeneral;
	roads: CollisionRoad[];
	vehicles: CollisionVehicle[];
	persons: CollisionPerson[];
	remark: CollisionRemark;
	images: CollisionImage[];
}

// ─── Filter Types ──────────────────────────────────────────────────

export interface CollisionFilter {
	divisionId?: string;
	syncStatus?: SyncStatus;
	dateFrom?: string;
	dateTo?: string;
}

// ─── Sort Types ────────────────────────────────────────────────────

export interface CollisionSort {
	key: "submissionDT" | "divisionId" | "syncStatus";
	dir: "ASC" | "DESC";
}
