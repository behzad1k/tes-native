import { Sign } from "@/src/types/models";

export type SignType =
	| "stop"
	| "yield"
	| "speed_limit"
	| "no_parking"
	| "one_way"
	| "other";
export type SignCondition = "good" | "fair" | "poor" | "damaged";
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

export interface CreateSignRequest {
	signType: SignType;
	location: {
		lat: number;
		lng: number;
	};
	address?: string;
	condition: SignCondition;
	notes?: string;
	imagePath?: string;
}

export interface CreateSignResponse {
	id: string;
	signType: string;
	location: {
		lat: number;
		lng: number;
	};
	condition: string;
	createdAt: string;
}

export interface SignFormData extends Sign {}
