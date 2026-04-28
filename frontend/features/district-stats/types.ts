export type LocationRow = {
	location_name: string;
	avg_price_per_sqm: number;
	count: number;
	recent_avg: number | null;
	prior_avg: number | null;
	trend: "up" | "down" | "flat";
};

export type SortKey = "district" | "avg_ppsm" | "listing_count" | "trend";
export type SortDir = "asc" | "desc";

export interface DistrictStatsUI {
	subtitle: HTMLElement;
	loading: HTMLElement;
	table: HTMLTableElement;
	tbody: HTMLElement;
	error: HTMLElement;
	empty: HTMLElement;
	search: HTMLInputElement;
	clear: HTMLButtonElement;
	dialogEl: HTMLDialogElement | null;
	sortIndicators: Record<SortKey, HTMLElement>;
	sortHeaders: Record<SortKey, HTMLElement>;
}

export interface DistrictStatsState {
	cachedData: LocationRow[] | null;
	cachedAt: number;
	sortKey: SortKey;
	sortDir: SortDir;
	filterQuery: string;
	isInitialized: boolean;
}
