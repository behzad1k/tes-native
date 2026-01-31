import { Sign, Support } from "@/src/types/models";

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

export interface SignFormData extends Sign {}
export interface SupportFormData extends Support {}
