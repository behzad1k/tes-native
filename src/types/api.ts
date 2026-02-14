import { AxiosRequestConfig } from "axios";
import { SystemOption } from "./models";

export interface BJobStatus extends SystemOption {
	jobStatusType: number;
}
export interface BJobType extends SystemOption {
	index: number;
}

export type BUserJobs = {
	jobs: [];
	supports: [];
	signWithouSupport: [];
	setups: BSetups;
	setting: BSetting;
	jobStatuses: BJobStatus[];
	jobTypes: BJobType[];
};

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
	supports: [];
	signsWithoutSupport: [];
	setups: BSetups;
	setting: BSetting;
};

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
