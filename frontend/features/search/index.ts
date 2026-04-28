import { bus, EVENTS } from "../../core/events";
import { t } from "../../core/i18n";
import { state } from "../../core/state";
import type { Property } from "../../core/types";
import { hide, makeEventManager, show, toast } from "../../core/utils";
import type { MultiSelectElement } from "../../ui/multi-select";
import { SkeletonList } from "../../ui/skeleton";
import { openHeatmap } from "../heatmap";
import { refreshFilterChips } from "./chips";
import { getBooleanFilters, getNumericFilters } from "./constants";
import { renderSearchFilters } from "./filters";
import type { SearchUI } from "./types";
import { restoreStateFromUrl, syncStateToUrl } from "./url";

export function initSearch(container: HTMLElement): () => void {
	// --- 1. References ---

	const globalElements = {
		resultsContainer: state.refs.cards as HTMLElement,
		loadingIndicator: state.refs.loading as HTMLElement,
		emptyState: state.refs.empty as HTMLElement,
		welcomeState: state.refs.welcome as HTMLElement,
		resultsBar: state.refs.resultsBar as HTMLElement,
		loadMoreButton: state.refs.loadMore as HTMLElement,
		trendPanel: state.refs.trendPanel as HTMLElement,
		savedToggleBtn: state.refs.savedBtn as HTMLElement,
	};

	const ui: SearchUI = {
		locationSelect: null as unknown as MultiSelectElement,
		discountRange: null as unknown as HTMLInputElement,
		discountValueDisplay: null as unknown as HTMLElement,
		searchTrigger: null as unknown as HTMLButtonElement,
		advancedToggle: null as unknown as HTMLButtonElement,
		advancedPanel: null as unknown as HTMLElement,
		advancedCount: null as unknown as HTMLElement,
		activeChipsContainer: null as unknown as HTMLElement,
		clearAllBtn: null as unknown as HTMLButtonElement,
		categorySelect: null as unknown as HTMLSelectElement,
		mortgageSelect: null as unknown as HTMLSelectElement,
		descriptionInput: null as unknown as HTMLInputElement,
		tierSelect: null as unknown as HTMLSelectElement,
		priceMapActionBtn: null as unknown as HTMLButtonElement,
		numericInputs: {},
		booleanInputs: {},
	};

	// --- 2. State & Core Logic ---

	// Assign filter bridge immediately to avoid TDZ for other modules
	state.getFilters = (): import("../../core/types").AlertFilters => {
		const locations = ui.locationSelect?.getValue() || [];
		const filters: import("../../core/types").AlertFilters = {
			location: locations.join(",") || "__all__",
			threshold: ui.discountRange ? Number(ui.discountRange.value) : 10,
		};

		for (const config of getNumericFilters()) {
			const val = ui.numericInputs[config.id]?.value.trim();
			if (val) filters[config.id] = Number(val);
		}

		for (const config of getBooleanFilters()) {
			if (ui.booleanInputs[config.id]?.checked) filters[config.id] = true;
		}

		if (ui.categorySelect?.value) filters.category = ui.categorySelect.value;
		if (ui.mortgageSelect?.value) {
			filters.hasActiveMortgage = ui.mortgageSelect.value === "true";
		}

		return filters;
	};

	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	function debouncedSearch() {
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => void executeSearch(false), 500);
	}

	function resetUIForSearch() {
		state.allResults = [];
		state.savedOnlyResults = [];
		state.currentOffset = 0;
		state.currentTotal = 0;
		state.showingSaved = false;
		state.renderedSet.clear();
		state.hasSearched = true;
		globalElements.savedToggleBtn?.classList.remove("on");

		hide(globalElements.welcomeState);
		hide(globalElements.emptyState);
		hide(globalElements.loadMoreButton);
		hide(globalElements.trendPanel);

		globalElements.resultsContainer.replaceChildren();
		show(globalElements.resultsBar);

		if (state.currentView === "map") {
			show(globalElements.loadingIndicator);
		} else {
			globalElements.resultsContainer.appendChild(
				SkeletonList(6, state.currentView as "grid" | "row"),
			);
		}
	}

	function buildSearchParams(
		currentFilters: import("../../core/types").AlertFilters,
	) {
		const searchParams = new URLSearchParams({
			location: currentFilters.location,
			threshold: String(currentFilters.threshold),
			limit: String(state.PAGE),
			offset: String(state.currentOffset),
		});

		Object.entries(currentFilters).forEach(([key, val]) => {
			if (key !== "location" && key !== "threshold" && val !== undefined) {
				searchParams.set(key, String(val));
			}
		});

		const descriptionQuery = ui.descriptionInput.value.trim();
		if (descriptionQuery)
			searchParams.set("descriptionSearch", descriptionQuery);

		return searchParams;
	}

	async function executeSearch(isPagination = false): Promise<void> {
		if (state.loading) return;

		const locations = ui.locationSelect.getValue();
		if (locations.length === 0) {
			ui.locationSelect.focus({ preventScroll: true });
			return;
		}

		state.loading = true;
		if (!isPagination) resetUIForSearch();
		ui.searchTrigger.disabled = true;

		try {
			const searchParams = buildSearchParams(state.getFilters());
			const response = await fetch(`/api/deals/undervalued?${searchParams}`);
			const searchResults = (await response.json()) as {
				error?: string;
				data: Property[];
				total: number;
			};

			hide(globalElements.loadingIndicator);

			if (searchResults.error) {
				toast(searchResults.error, true);
				return;
			}

			state.allResults = [...state.allResults, ...searchResults.data];
			state.currentTotal = searchResults.total;
			state.currentOffset += searchResults.data.length;

			if (!isPagination) {
				refreshFilterChips(ui, debouncedSearch);
				syncStateToUrl(searchParams);

				// Location broadcast
				if (locations.length === 1 && locations[0] !== "__all__") {
					bus.emit(EVENTS.LOCATION_CHANGED, locations[0]);
				}
			}

			// UI Update
			if (state.allResults.length === 0) {
				globalElements.resultsContainer.replaceChildren();
				show(globalElements.emptyState);
				hide(globalElements.resultsBar);
			} else {
				bus.emit(EVENTS.DEALS_UPDATED);
			}
		} catch (error) {
			hide(globalElements.loadingIndicator);
			globalElements.resultsContainer.replaceChildren();
			toast((error as Error).message, true);
		} finally {
			ui.searchTrigger.disabled = false;
			state.loading = false;
		}
	}

	function onFilterChange() {
		refreshFilterChips(ui, debouncedSearch);
		debouncedSearch();
	}

	function onTierChange() {
		bus.emit(EVENTS.DEALS_UPDATED);
	}

	const onClear = () => {
		for (const config of getNumericFilters())
			ui.numericInputs[config.id].value = "";
		for (const config of getBooleanFilters())
			ui.booleanInputs[config.id].checked = false;
		ui.categorySelect.value = "";
		ui.mortgageSelect.value = "";
		ui.descriptionInput.value = "";
		refreshFilterChips(ui, debouncedSearch);
		void executeSearch(false);
	};

	const onPriceMap = () => {
		const activeLocations = ui.locationSelect.getValue();
		openHeatmap(activeLocations, (locName, isToggle) => {
			if (isToggle) {
				const current = ui.locationSelect.getValue();
				const idx = current.indexOf(locName);
				if (idx > -1)
					ui.locationSelect.setValue(current.filter((v) => v !== locName));
				else ui.locationSelect.setValue([...current, locName]);
			} else {
				ui.locationSelect.setValue([locName]);
			}
			bus.emit(EVENTS.SEARCH_STARTED, { more: false });
		});
	};

	// --- 3. UI Assembly ---

	const searchLayout = renderSearchFilters(ui, {
		onFilterChange,
		onSearch: () => void executeSearch(false),
		onPriceMap,
		onTierChange,
		onClear,
	});
	state.refs.tierFilter = ui.tierSelect;
	container.append(searchLayout, ui.activeChipsContainer);

	// --- 4. Event Handlers ---

	const { add, cleanup: cleanupHandlers } = makeEventManager();

	add(document, "keydown", (e: KeyboardEvent) => {
		if (
			e.key === "Enter" &&
			!e.defaultPrevented &&
			!["BUTTON", "A", "SELECT"].includes((e.target as Element).tagName)
		) {
			void executeSearch(false);
		}
	});

	const offSearchBus = bus.on(
		EVENTS.SEARCH_STARTED,
		(data: { more?: boolean } | undefined) => {
			void executeSearch(data?.more ?? false);
		},
	);

	// --- 5. Initialization & Data Loading ---

	restoreStateFromUrl(ui);
	refreshFilterChips(ui, debouncedSearch);

	async function loadInitialData() {
		try {
			const response = await fetch("/api/deals/locations");
			const locationData = (await response.json()) as { data: string[] };
			const locationOptions = [
				{ value: "__all__", label: t("allLocations") },
				...locationData.data.map((loc) => ({ value: loc, label: loc })),
			];

			// Load options and re-restore state to ensure labels are correct
			ui.locationSelect.setOptions(locationOptions);
			restoreStateFromUrl(ui);
			refreshFilterChips(ui, debouncedSearch);

			void executeSearch(false);
		} catch {
			ui.locationSelect.setOptions([{ value: "", label: t("failedLocs") }]);
		}
	}

	void loadInitialData();

	return () => {
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		cleanupHandlers();
		offSearchBus();
	};
}
