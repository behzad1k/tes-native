import { defaultLanguage, LOCALES } from "@/src/configs/translations";

export const omit = (keys: any, obj: any): any => {
	if (!keys.length) return obj;
	const { [keys.pop()]: omitted, ...rest } = obj;
	return omit(keys, rest);
};

export const isEmpty = (obj: any) => {
	return Object.keys(obj)?.length == 0;
};
