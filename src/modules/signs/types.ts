import { Sign, Support, SupportImage } from "@/src/types/models";

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

export interface SignFormData {
	// Customer & Location
	customerId: string;
	locationTypeId: string;
	latitude?: number;
	longitude?: number;
	address?: string;

	// Sign Identification
	signId: string;
	supportId: string;
	codeId: string;

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

export interface SupportFormData {
	// Customer & Location
	id: string;
	customerId: string;
	supportLocationTypeId: string;
	locationId: string;
	latitude?: number;
	longitude?: number;
	address?: string;

	// Support Identification
	supportId: string;
	codeId: string;
	positionId: string;

	// Installation & Condition
	dateInstalled: string;
	conditionId: string;
	note: string;
	images: SupportImage[];
	signs: Sign[];
}
