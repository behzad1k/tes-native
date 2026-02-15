import { Sign, SignImage, Support, SupportImage } from "@/src/types/models";

export type SignStatus = "pending" | "synced" | "failed";

export enum FilterSingOperator {
	EQUAL = "equal",
	MORE = "more",
	LESS = "less",
}

export type FilterSign = {
	key: string;
	value: string;
	operator?: FilterSingOperator;
};
export type SortSign = { key: string; dir: "ASC" | "DESC" };

// Sign Form Data for create/edit screens
export interface SignFormData {
	// Customer & Location
	customerId: string;
	locationTypeId: string;
	latitude?: number;
	longitude?: number;
	address?: string;

	// Sign Identification
	signId: string;
	supportId?: string;
	signCodeId: string;

	// Physical Properties
	height: string;
	facingDirectionId: string;
	faceMaterialId: string;
	reflectiveCoatingId: string;
	reflectiveRatingId: string;
	dimensionId: string;

	// Installation & Condition
	dateInstalled: string;
	conditionId: string;
	note: string;
}

// Support Form Data for create/edit screens
export interface SupportFormData {
	// Customer & Location
	customerId: string;
	materialId: string;
	typeId: string;
	locationTypeId: string;
	locationId: string;
	latitude?: number;
	longitude?: number;
	address?: string;

	// Support Identification
	id: string;
	codeId: string;
	positionId: string;

	// Physical Properties
	distanceFromShoulder?: number;

	// Installation & Condition
	dateInstalled: string;
	conditionId: string;
	note: string;
}

// Convert Sign model to form data
export const signToFormData = (sign: Sign): SignFormData => ({
	customerId: sign.customerId || "",
	locationTypeId: sign.locationTypeId || "",
	latitude: sign.latitude,
	longitude: sign.longitude,
	address: sign.address || "",
	signId: sign.signId || "",
	supportId: sign.supportId,
	signCodeId: sign.signCodeId || "",
	height: sign.height || "",
	facingDirectionId: sign.facingDirectionId || "",
	faceMaterialId: sign.faceMaterialId || "",
	reflectiveCoatingId: sign.reflectiveCoatingId || "",
	reflectiveRatingId: sign.reflectiveRatingId || "",
	dimensionId: sign.dimensionId || "",
	dateInstalled: sign.dateInstalled || new Date().toISOString(),
	conditionId: sign.conditionId || "",
	note: sign.note || "",
});

// Convert Support model to form data
export const supportToFormData = (support: Support): SupportFormData => ({
	customerId: support.customerId || "",
	locationTypeId: support.supportLocationTypeId || "",
	locationId: support.locationId || "",
	latitude: support.latitude,
	longitude: support.longitude,
	address: support.address || "",
	id: support.supportId || "",
	codeId: support.supportCodeId || "",
	positionId: support.supportPositionId || "",
	distanceFromShoulder: support.distanceFromShoulder,
	dateInstalled: support.dateInstalled || new Date().toISOString(),
	conditionId: support.supportConditionId || "",
	materialId: support.supportMaterialId || "",
	typeId: support.supportTypeId || "",
	note: support.note || "",
});

// Get default sign form data
export const getDefaultSignFormData = (customerId?: string): SignFormData => ({
	customerId: customerId || "",
	locationTypeId: "",
	latitude: undefined,
	longitude: undefined,
	address: "",
	signId: "",
	supportId: undefined,
	signCodeId: "",
	height: "",
	facingDirectionId: "",
	faceMaterialId: "",
	reflectiveCoatingId: "",
	reflectiveRatingId: "",
	dimensionId: "",
	dateInstalled: new Date().toISOString(),
	conditionId: "",
	note: "",
});

// Get default support form data
export const getDefaultSupportFormData = (
	customerId?: string,
): SupportFormData => ({
	customerId: customerId || "",
	locationTypeId: "",
	locationId: "",
	latitude: undefined,
	longitude: undefined,
	materialId: "",
	typeId: "",
	address: "",
	id: "",
	codeId: "",
	positionId: "",
	distanceFromShoulder: undefined,
	dateInstalled: new Date().toISOString(),
	conditionId: "",
	note: "",
});
