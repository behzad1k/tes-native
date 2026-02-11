import { FilterOperator, SortDirection } from "../constants/global";

export interface TabValueType {
	id: string;
	value: string;
	count?: number;
}
export interface TabsType {
	[key: string]: TabValueType;
}

export type Filter = {
	key: string;
	value: string;
	operator?: keyof typeof FilterOperator;
};
export type Sort = {
	key: string;
	dir: (typeof SortDirection)[keyof typeof SortDirection];
};
