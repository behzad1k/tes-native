export interface TabValueType {
	id: string;
	value: string;
	count?: number;
}
export interface TabsType {
	[key: string]: TabValueType;
}
