import type { DistrictStatsState, LocationRow, SortKey } from "./types";

/**
 * Returns a numerical order for trends to enable sorting.
 */
export function getTrendOrder(t: "up" | "down" | "flat"): number {
	const orders = { up: 2, flat: 1, down: 0 };
	return orders[t];
}

/**
 * Filters and sorts the location data based on the current state.
 */
export function getProcessedData(state: DistrictStatsState): LocationRow[] {
	if (!state.cachedData) return [];

	let data = [...state.cachedData];

	// 1. Filter
	if (state.filterQuery) {
		const q = state.filterQuery.toLowerCase();
		data = data.filter((r) => r.location_name.toLowerCase().includes(q));
	}

	// 2. Sort strategies
	const sorters: Record<SortKey, (a: LocationRow, b: LocationRow) => number> = {
		district: (a, b) => a.location_name.localeCompare(b.location_name),
		avg_ppsm: (a, b) => a.avg_price_per_sqm - b.avg_price_per_sqm,
		listing_count: (a, b) => a.count - b.count,
		trend: (a, b) => getTrendOrder(a.trend) - getTrendOrder(b.trend),
	};

	data.sort((a, b) => {
		const cmp = sorters[state.sortKey](a, b);
		return state.sortDir === "asc" ? cmp : -cmp;
	});

	return data;
}
