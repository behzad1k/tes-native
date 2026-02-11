export enum FilterMaintenanceJobOperator {
	EQUAL = "equal",
	MORE = "more",
	LESS = "less",
}

export type FilterMaintenanceJob = {
	key: string;
	value: string;
	operator?: FilterMaintenanceJobOperator;
};
export type SortMaintenanceJob = { key: string; dir: "ASC" | "DESC" };
