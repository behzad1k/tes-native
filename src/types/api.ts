import { AxiosRequestConfig } from "axios";

// ─── Common Types ──────────────────────────────────────────────────

export interface SystemOption {
	id: string;
	name: string;
}

// ─── Auth Types ────────────────────────────────────────────────────

type BPermissions =
	| "Maintenance_V_Report"
	| "Customer_D_Division"
	| "Sign_D"
	| "Infrastructure_D_Street"
	| "Customer_V_App"
	| "Sign_Sync"
	| "FMS_Upload"
	| "Customer_A_Division"
	| "Sign_V_Report"
	| "Maintenance_D_Equipment"
	| "Maintenance_D_Personnel"
	| "Infrastructure_R_Street"
	| "Sign_E"
	| "Customer_V_Web"
	| "Customer_D_User"
	| "Sign_D_Setup"
	| "FMS_E_File"
	| "Maintenance_CompleteJob"
	| "Maintenance_V_AllJob"
	| "Infrastructure_R_Site"
	| "Maintenance_D_Setups"
	| "Maintenance_E_Job"
	| "Sign_V"
	| "FMS_Download"
	| "Customer_E_User"
	| "Infrastructure_D_Site"
	| "Infrastructure_V_Site"
	| "Infrastructure_V_Street"
	| "Maintenance_R_Job"
	| "Customer_D_Report"
	| "Customer_R_User"
	| "FMS_R_File"
	| "Maintenance_D_Job"
	| "Sign_R"
	| "Customer_D_Group"
	| "Customer_A_Group";

export type BUser = {
	userId: string;
	firstName: string;
	lastName: string;
	userName: string;
	email: string;
	permissions: BPermissions[];
	defaultCustomerId: string;
	defaultCustomerName: string;
};

// ─── Sign/Support Types ────────────────────────────────────────────

export type BSignSupportCode = {
	id: string;
	name: string;
	code: string;
	dimensionId: string | null;
	materialCost: number;
	labourCost: number;
	installationCost: number;
};

export type BSetups = {
	signCode: BSignSupportCode[];
	signDescription: SystemOption[];
	signDimension: SystemOption[];
	signType: SystemOption[];
	signCondition: SystemOption[];
	signFaceMaterial: SystemOption[];
	signFacingDirection: SystemOption[];
	signLocationType: SystemOption[];
	signReflectiveCoating: SystemOption[];
	signReflectiveRating: SystemOption[];
	supportCode: BSignSupportCode[];
	support: SystemOption[];
	supportDescription: SystemOption[];
	supportMaterial: SystemOption[];
	supportType: SystemOption[];
	supportCondition: SystemOption[];
	supportLocationType: SystemOption[];
	supportPosition: SystemOption[];
	generalSetting: null;
};

export type BSetting = {
	signImagesURL: string;
};

export type BSignSupportData = {
	supports: BSupport[];
	signsWithoutSupport: BSign[];
	setups: BSetups;
	setting: BSetting;
};

// ─── Sign Types ────────────────────────────────────────────────────

export interface BSignImage {
	id: string;
	signId: string;
	url?: string;
	uri?: string;
	thumbnailUrl?: string;
}

export interface BSign {
	id: string;
	signId: string;
	supportId?: string;
	customerId: string;
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
	images: BSignImage[];
	isNew?: boolean;
	isSynced?: boolean;
}

// ─── Support Types ─────────────────────────────────────────────────

export interface BSupportImage {
	id: string;
	supportId: string;
	url?: string;
	uri?: string;
	thumbnailUrl?: string;
}

export interface BSupport {
	id: string;
	supportId: string;
	customerId: string;
	supportCodeId: string;
	supportLocationTypeId?: string;
	locationId?: string;
	latitude?: number;
	longitude?: number;
	address?: string;
	positionId?: string;
	dateInstalled?: string;
	conditionId?: string;
	note?: string;
	signs: BSign[];
	images: BSupportImage[];
	isNew?: boolean;
	isSynced?: boolean;
}

// ─── Maintenance/Job Types ─────────────────────────────────────────

export interface BJobStatus extends SystemOption {
	jobStatusType: number;
}

export interface BJobType extends SystemOption {
	index: number;
}

export interface BJobAsset {
	id: string;
	jobId: string;
	assetId: string;
	type: number; // 1 = Support, 2 = Sign
	statusId: string;
	note?: string;
	isEdited?: boolean;
}

export interface BJob {
	id: string;
	name: string;
	typeId: string;
	typeName: string;
	statusId: string;
	statusName: string;
	assignDate: string;
	duration: number;
	note?: string;
	assets: BJobAsset[];
	isEdited?: boolean;
	isSynced?: boolean;
}

export interface BJobImage {
	id: string;
	jobId: string;
	url?: string;
	uri?: string;
	downloadURL?: string;
}

// Response from POST /jobs/UserJobs
export type BUserJobs = {
	jobs: BJob[];
	supports: BSupport[];
	signsWithoutSupport: BSign[];
	setups: BSetups;
	setting: BSetting;
	jobStatuses: BJobStatus[];
	jobTypes: BJobType[];
};

// Request for POST /Jobs/UpdateUserJobs
export interface BUpdateUserJobsRequest {
	jobs: BJob[];
	assets: BJobAsset[];
}

// Response from GET /Attachments/DownloadAttachments/{jobId}
export interface BJobAttachment {
	id: string;
	downloadURL: string;
	fileName?: string;
}

// Request for POST /sync/getDataFromApp
export interface BSyncDataRequest {
	changeLogs: BChangeLog[];
	signs: BSign[];
	supports: BSupport[];
}

export interface BChangeLog {
	id?: string;
	type: number; // 1 = field change, 2 = image
	supportId?: string;
	signId?: string;
	fieldName?: string;
	fromValue?: string;
	toValue?: string;
}

// ─── Generic API Types ─────────────────────────────────────────────

export interface ApiResponse<T = any> {
	code: number;
	data: T;
}

export interface ApiError {
	code: number;
	message: string;
	data?: any;
}

export interface RequestConfig extends AxiosRequestConfig {
	skipAuth?: boolean;
}
