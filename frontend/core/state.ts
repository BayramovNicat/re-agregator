import type { Property } from "./types";

export const state = {
	allResults: [] as Property[],
	savedOnlyResults: [] as Property[],
	currentTotal: 0,
	currentOffset: 0,
	currentView: "grid",
	showingSaved: false,
	scrollObserver: null as IntersectionObserver | null,
	renderedSet: new Set<string>(),
	bookmarks: new Set<string>(
		JSON.parse(localStorage.getItem("re-bm") || "[]") as string[],
	),
	hidden: new Set<string>(
		JSON.parse(localStorage.getItem("re-hidden") || "[]") as string[],
	),
	PAGE: 50,
};
