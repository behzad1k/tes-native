import { Sign } from "@/src/types/models";
import { FilterSign, FilterSingOperator, SortSign } from "../types";
import { useMemo, useState } from "react";

export function useSigns() {
	const [query, setQuery] = useState("");
	const [filters, setFilters] = useState<FilterSign[]>([]);
	const [sort, setSort] = useState<SortSign>({ key: "id", dir: "DESC" });
	const signs = useMemo(() => {
		const applyFilter = (e: Sign, f: FilterSign) => {
			switch (f.operator) {
				case FilterSingOperator.LESS:
					return e[f.key] < f.value;
				case FilterSingOperator.MORE:
					return e[f.key] > f.value;
				default:
					return e[f.key] == f.value;
			}
		};
		return []
			.filter(
				(e) =>
					e.title.toLowerCase().includes(query) &&
					filters.map((f) => applyFilter(e, f)),
			)
			.sort((a, b) =>
				sort.dir == "ASC"
					? a[sort.key] - b[sort.key]
					: b[sort.key] - a[sort.key],
			);
	}, [filters, sort, query]);

	return {
		query,
		setQuery,
		filters,
		setFilters,
		sort,
		setSort,
		signs,
	};
}

export function usePendingSigns() {
	const pendingSigns = [];
	return pendingSigns;
}

export function useSignById(id: string | null) {
	// const database = useDatabase();
	const signsCollection: any = {};

	if (!id) {
		return null;
	}

	const sign = signsCollection.findAndObserve(id);
	return sign;
}
