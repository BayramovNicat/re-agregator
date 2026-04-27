import { bus, EVENTS } from "../core/events";
import { t } from "../core/i18n";
import { state } from "../core/state";
import type { Property } from "../core/types";
import { frag, ge, html, makeEventManager, toast } from "../core/utils";
import { openHeatmap } from "../dialogs/heatmap";
import { Button, RawButton } from "../ui/button";
import { Chip, CloseableChip } from "../ui/chip";
import { Icons } from "../ui/icons";
import { Field, Input } from "../ui/input";
import { Label } from "../ui/label";
import { MultiSelect, type MultiSelectElement } from "../ui/multi-select";
import { Range, setRangeProgress } from "../ui/range";
import { Select } from "../ui/select";
import { SkeletonList } from "../ui/skeleton";

const getNumericFilters = () => [
	{
		id: "minPrice",
		label: t("minPrice"),
		placeholder: "30 000",
		chipLabel: t("chipMinPrice"),
	},
	{
		id: "maxPrice",
		label: t("maxPrice"),
		placeholder: "150 000",
		chipLabel: t("chipMaxPrice"),
	},
	{
		id: "minPriceSqm",
		label: t("minPriceSqm"),
		placeholder: "500",
		chipLabel: t("chipMinPriceSqm"),
	},
	{
		id: "maxPriceSqm",
		label: t("maxPriceSqm"),
		placeholder: "2000",
		chipLabel: t("chipMaxPriceSqm"),
	},
	{
		id: "minArea",
		label: t("minArea"),
		placeholder: "40",
		chipLabel: t("chipMinArea"),
	},
	{
		id: "maxArea",
		label: t("maxArea"),
		placeholder: "120",
		chipLabel: t("chipMaxArea"),
	},
	{
		id: "minRooms",
		label: t("minRooms"),
		placeholder: "2",
		chipLabel: t("chipMinRooms"),
	},
	{
		id: "maxRooms",
		label: t("maxRooms"),
		placeholder: "4",
		chipLabel: t("chipMaxRooms"),
	},
	{
		id: "minFloor",
		label: t("minFloor"),
		placeholder: "2",
		chipLabel: t("chipMinFloor"),
	},
	{
		id: "maxFloor",
		label: t("maxFloor"),
		placeholder: "15",
		chipLabel: t("chipMaxFloor"),
	},
	{
		id: "minTotalFloors",
		label: t("minTotalFloors"),
		placeholder: "2",
		chipLabel: t("chipMinTotalFloors"),
	},
	{
		id: "maxTotalFloors",
		label: t("maxTotalFloors"),
		placeholder: "5",
		chipLabel: t("chipMaxTotalFloors"),
	},
];

const getBooleanFilters = () => [
	{ id: "hasRepair", label: t("hasRepair") },
	{ id: "hasDocument", label: t("hasDocument") },
	{ id: "hasMortgage", label: t("hasMortgage") },
	{ id: "isUrgent", label: t("isUrgent") },
	{ id: "notLastFloor", label: t("notLastFloor") },
];

export function initSearch(container: HTMLElement): () => void {
	// --- 1. References ---

	const globalElements = {
		resultsContainer: ge("cards"),
		loadingIndicator: ge("s-loading"),
		emptyState: ge("s-empty"),
		welcomeState: ge("s-welcome"),
		resultsBar: ge("results-bar"),
		loadMoreButton: ge("load-more"),
		trendPanel: ge("trend-panel"),
		savedToggleBtn: ge("saved-btn"),
	};

	const ui = {
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
		numericInputs: {} as Record<string, HTMLInputElement>,
		booleanInputs: {} as Record<string, HTMLInputElement>,
	};

	// --- 2. State Accessors ---

	const getNumericValue = (id: string) =>
		ui.numericInputs[id]?.value.trim() || "";
	const isFilterChecked = (id: string) =>
		ui.booleanInputs[id]?.checked || false;

	// --- 3. Core Logic ---

	function refreshFilterChips(): void {
		const activeChips: HTMLElement[] = [];

		// Boolean Filters
		for (const config of getBooleanFilters()) {
			if (isFilterChecked(config.id)) {
				activeChips.push(
					CloseableChip({
						label: config.label,
						onClose: () => {
							ui.booleanInputs[config.id].checked = false;
							refreshFilterChips();
							debouncedSearch();
						},
					}),
				);
			}
		}

		// Numeric Filters
		for (const config of getNumericFilters()) {
			const value = getNumericValue(config.id);
			if (value) {
				activeChips.push(
					CloseableChip({
						label: `${config.chipLabel}: ${value}`,
						onClose: () => {
							ui.numericInputs[config.id].value = "";
							refreshFilterChips();
							debouncedSearch();
						},
					}),
				);
			}
		}

		// Dropdowns & Search
		const currentCategory = ui.categorySelect.value;
		if (currentCategory) {
			activeChips.push(
				CloseableChip({
					label: `${t("chipCategory")}: ${currentCategory}`,
					onClose: () => {
						ui.categorySelect.value = "";
						refreshFilterChips();
						debouncedSearch();
					},
				}),
			);
		}

		const mortgageStatus = ui.mortgageSelect.value;
		if (mortgageStatus) {
			activeChips.push(
				CloseableChip({
					label: `${t("chipActiveMortgage")}: ${mortgageStatus === "true" ? t("yes") : t("no")}`,
					onClose: () => {
						ui.mortgageSelect.value = "";
						refreshFilterChips();
						debouncedSearch();
					},
				}),
			);
		}

		const descriptionQuery = ui.descriptionInput.value.trim();
		if (descriptionQuery) {
			activeChips.push(
				CloseableChip({
					label: `${t("chipDescSearch")}: ${descriptionQuery}`,
					onClose: () => {
						ui.descriptionInput.value = "";
						refreshFilterChips();
						debouncedSearch();
					},
				}),
			);
		}

		const selectedLocations = ui.locationSelect.getValue();
		if (
			selectedLocations.length > 0 &&
			!selectedLocations.includes("__all__")
		) {
			for (const location of selectedLocations) {
				activeChips.push(
					CloseableChip({
						label: location,
						onClose: () => {
							ui.locationSelect.setValue(
								ui.locationSelect.getValue().filter((v) => v !== location),
							);
							refreshFilterChips();
							void executeSearch(false);
						},
					}),
				);
			}
		}

		ui.activeChipsContainer.replaceChildren(...activeChips);
		ui.activeChipsContainer.style.display = activeChips.length
			? "flex"
			: "none";

		if (activeChips.length) {
			ui.advancedCount.textContent = String(activeChips.length);
			ui.advancedCount.style.display = "inline-block";
		} else {
			ui.advancedCount.style.display = "none";
		}
	}

	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	const debouncedSearch = () => {
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => void executeSearch(false), 500);
	};

	async function executeSearch(isPagination = false): Promise<void> {
		const locations = ui.locationSelect.getValue();
		if (locations.length === 0) {
			ui.locationSelect.querySelector("button")?.focus();
			return;
		}

		if (!isPagination) {
			state.allResults = [];
			state.savedOnlyResults = [];
			state.currentOffset = 0;
			state.currentTotal = 0;
			state.showingSaved = false;
			state.renderedSet.clear();
			globalElements.savedToggleBtn?.classList.remove("on");

			if (globalElements.welcomeState)
				globalElements.welcomeState.style.display = "none";
			if (globalElements.emptyState)
				globalElements.emptyState.style.display = "none";
			if (globalElements.resultsBar)
				globalElements.resultsBar.style.display = "none";
			if (globalElements.loadMoreButton)
				globalElements.loadMoreButton.style.display = "none";
			if (globalElements.trendPanel)
				globalElements.trendPanel.style.display = "none";

			globalElements.resultsContainer.replaceChildren();

			if (state.currentView === "map") {
				if (globalElements.loadingIndicator)
					globalElements.loadingIndicator.style.display = "block";
			} else {
				globalElements.resultsContainer.appendChild(
					SkeletonList(6, state.currentView as "grid" | "row"),
				);
			}
		}

		ui.searchTrigger.disabled = true;

		try {
			const searchParams = new URLSearchParams({
				location: locations.join(","),
				threshold: ui.discountRange.value,
				limit: String(state.PAGE),
				offset: String(state.currentOffset),
			});

			// Numeric filters
			for (const config of getNumericFilters()) {
				const val = getNumericValue(config.id);
				if (val) searchParams.set(config.id, val);
			}

			// Boolean filters
			for (const config of getBooleanFilters()) {
				if (isFilterChecked(config.id)) searchParams.set(config.id, "true");
			}

			// Dropdowns & Custom
			if (ui.categorySelect.value)
				searchParams.set("category", ui.categorySelect.value);
			if (ui.mortgageSelect.value)
				searchParams.set("hasActiveMortgage", ui.mortgageSelect.value);

			const descriptionQuery = ui.descriptionInput.value.trim();
			if (descriptionQuery)
				searchParams.set("descriptionSearch", descriptionQuery);

			const response = await fetch(`/api/deals/undervalued?${searchParams}`);
			const searchResults = (await response.json()) as {
				error?: string;
				data: Property[];
				total: number;
			};

			if (globalElements.loadingIndicator)
				globalElements.loadingIndicator.style.display = "none";

			if (searchResults.error) {
				toast(searchResults.error, true);
				return;
			}

			state.allResults = [...state.allResults, ...searchResults.data];
			state.currentTotal = searchResults.total;
			state.currentOffset += searchResults.data.length;

			if (!isPagination) refreshFilterChips();

			// Sync URL
			const persistParams = new URLSearchParams(searchParams);
			persistParams.delete("limit");
			persistParams.delete("offset");
			window.history.replaceState(
				null,
				"",
				`${window.location.pathname}?${persistParams.toString()}`,
			);

			// Location broadcast
			if (
				!isPagination &&
				locations.length === 1 &&
				locations[0] !== "__all__"
			) {
				bus.emit(EVENTS.LOCATION_CHANGED, locations[0]);
			}

			// UI Update
			if (state.allResults.length === 0) {
				globalElements.resultsContainer.replaceChildren();
				if (globalElements.emptyState)
					globalElements.emptyState.style.display = "block";
				if (globalElements.resultsBar)
					globalElements.resultsBar.style.display = "none";
			} else {
				bus.emit(EVENTS.DEALS_UPDATED);
			}
		} catch (error) {
			if (globalElements.loadingIndicator)
				globalElements.loadingIndicator.style.display = "none";
			globalElements.resultsContainer.replaceChildren();
			toast((error as Error).message, true);
		} finally {
			ui.searchTrigger.disabled = false;
		}
	}

	// --- 4. UI Definition ---

	ui.locationSelect = MultiSelect({
		placeholder: t("chooseLocs"),
		className: "w-full",
		exclusiveValue: "__all__",
		options: [],
		onChange: () => {
			refreshFilterChips();
			void executeSearch(false);
		},
	});

	const priceMapActionBtn = Button({
		title: t("priceMapTitle"),
		color: "indigo",
		variant: "base",
		ariaLabel: t("priceMap"),
		content: frag`${Icons.globe(14)} ${t("priceMap")}`,
	});

	ui.discountValueDisplay = html`<span
		class="text-xs font-bold text-(--accent) bg-(--accent-dim) px-2 py-0.5 rounded-full tracking-[0.02em]"
		>10%</span
	>`;
	const rangeWrapper = Range({
		min: 0,
		max: 50,
		value: 10,
		ariaLabel: t("discountThreshold"),
	});
	ui.discountRange = rangeWrapper.querySelector("input") as HTMLInputElement;

	ui.searchTrigger = html`
		<button
			type="button"
			class="inline-flex items-center justify-center gap-1.5 bg-(--accent-solid) text-white border-none rounded-(--r) px-4 py-2.25 font-semibold text-sm h-10 transition-all hover:bg-(--accent-h) hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed"
		>
			${Icons.search(14)} ${t("search")}
		</button>
	` as HTMLButtonElement;

	ui.advancedCount = html`<span
		class="bg-(--accent-solid) text-white rounded-full px-1.5 py-px text-xs font-semibold"
		style="display:none"
	></span>`;
	ui.advancedToggle = html`
		<button
			type="button"
			aria-expanded="false"
			class="group inline-flex items-center gap-1.25 bg-transparent border border-(--border) rounded-(--r-sm) px-3 py-1.5 text-(--text-2) text-xs font-medium mt-3.5 transition-all hover:border-(--border-h) hover:text-(--text) hover:bg-(--surface-2) aria-expanded:text-(--accent) aria-expanded:border-[rgba(99,102,241,0.4)] aria-expanded:bg-(--accent-dim)"
		>
			${Icons.chevron(
				12,
				"transition-transform duration-200 group-aria-expanded:rotate-180",
			)}
			${t("advancedFilters")} ${ui.advancedCount}
		</button>
	` as HTMLButtonElement;

	ui.categorySelect = Select({
		id: "category",
		className: "w-full",
		options: [
			{ value: "", label: t("any") },
			{ value: "Yeni tikili", label: t("newBuild") },
			{ value: "Köhnə tikili", label: t("secondary") },
		],
	});

	ui.mortgageSelect = Select({
		id: "hasActiveMortgage",
		className: "w-full",
		options: [
			{ value: "", label: t("any") },
			{ value: "false", label: t("no") },
			{ value: "true", label: t("yes") },
		],
	});

	ui.descriptionInput = Input({
		id: "descriptionSearch",
		type: "text",
		placeholder: t("descriptionSearchPlaceholder"),
		className: "w-full",
	});

	ui.tierSelect = Select({
		id: "tier-filter",
		className: "w-full",
		options: [
			{ value: "", label: t("tierFilterAll") },
			{ value: "High Value Deal", label: t("tierHigh") },
			{ value: "Good Deal", label: t("tierGood") },
			{ value: "Fair Price", label: t("tierFair") },
			{ value: "Overpriced", label: t("tierOverpriced") },
		],
	});

	ui.clearAllBtn = RawButton({
		className:
			"inline-flex items-center gap-1 text-xs text-(--muted) hover:text-(--text) transition-colors border border-(--border) hover:border-(--border-h) rounded-(--r-sm) px-2.5 py-1.25",
		content: t("clearFilters"),
	});

	ui.advancedPanel = html`
		<div
			class="overflow-hidden max-h-0 opacity-0 transition-all ease-in-out duration-300 [&.open]:max-h-150 [&.open]:opacity-100"
		>
			<div
				class="grid grid-cols-4 gap-2.5 pt-4 border-t border-(--border) mt-3.5 max-[680px]:grid-cols-2"
			>
				${getNumericFilters().map((config) => {
					ui.numericInputs[config.id] = Input({
						id: config.id,
						type: "number",
						placeholder: config.placeholder,
						className: "w-full",
					});
					return Field({
						label: config.label,
						htmlFor: config.id,
						input: ui.numericInputs[config.id],
					});
				})}
				${Field({
					label: t("category"),
					htmlFor: "category",
					input: ui.categorySelect,
				})}
				${Field({
					label: t("activeMortgage"),
					htmlFor: "hasActiveMortgage",
					input: ui.mortgageSelect,
				})}
				${Field({
					label: t("descriptionSearch"),
					htmlFor: "descriptionSearch",
					input: ui.descriptionInput,
				})}
				${Field({
					label: t("tierFilter"),
					htmlFor: "tier-filter",
					input: ui.tierSelect,
				})}
			</div>
			<div class="flex flex-wrap gap-1.75 pt-3.5">
				${getBooleanFilters().map((config) => {
					const chipWrapper = Chip({ id: config.id, label: config.label });
					ui.booleanInputs[config.id] = chipWrapper.querySelector(
						"input",
					) as HTMLInputElement;
					return chipWrapper;
				})}
			</div>
			<div class="flex justify-end pt-2.5">${ui.clearAllBtn}</div>
		</div>
	`;

	ui.activeChipsContainer = html`<div
		class="flex flex-wrap gap-1.5 mb-3.5"
		style="display:none"
	></div>`;

	// --- 5. Assembly ---

	const searchLayout = html`
		<div
			class="bg-(--surface) border border-(--border) rounded-(--r-lg) p-5 mb-3.5"
		>
			<div
				class="grid grid-cols-[1fr_auto_260px_120px] gap-3 items-end max-[680px]:grid-cols-1"
			>
				${Field({
					label: t("location"),
					htmlFor: "loc-trigger",
					input: ui.locationSelect,
				})}
				<div class="flex flex-col gap-1.5">
					<span
						class="text-xs font-medium text-(--muted) tracking-[0.06em] uppercase invisible"
						aria-hidden="true"
						>Map</span
					>
					${priceMapActionBtn}
				</div>
				<div class="flex flex-col gap-1.5">
					<div class="flex items-center justify-between">
						${Label({ text: t("discountThreshold"), htmlFor: "" })}
						${ui.discountValueDisplay}
					</div>
					${rangeWrapper}
				</div>
				<div class="flex flex-col gap-1.5">
					<span
						class="text-xs font-medium text-(--muted) tracking-[0.06em] uppercase invisible"
						aria-hidden="true"
						>Go</span
					>
					${ui.searchTrigger}
				</div>
			</div>
			${ui.advancedToggle} ${ui.advancedPanel}
		</div>
	`;
	container.append(searchLayout, ui.activeChipsContainer);

	// --- 6. Event Handlers ---

	const { add, cleanup: cleanupHandlers } = makeEventManager();

	add(ui.searchTrigger, "click", () => void executeSearch(false));

	add(priceMapActionBtn, "click", () => {
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
	});

	let rangeChangeDebounce: ReturnType<typeof setTimeout> | null = null;
	add(ui.discountRange, "input", (e) => {
		const value = (e.target as HTMLInputElement).value;
		ui.discountValueDisplay.textContent =
			value === "0" ? t("all") : `${value}%`;
		if (rangeChangeDebounce) clearTimeout(rangeChangeDebounce);
		rangeChangeDebounce = setTimeout(() => void executeSearch(false), 500);
	});

	add(ui.advancedToggle, "click", () => {
		const isOpen = ui.advancedPanel.classList.toggle("open");
		ui.advancedToggle.setAttribute("aria-expanded", String(isOpen));
	});

	// Dynamic updates
	const onFilterChange = () => {
		refreshFilterChips();
		debouncedSearch();
	};

	add(ui.mortgageSelect, "change", onFilterChange);
	add(ui.descriptionInput, "input", onFilterChange);
	add(ui.categorySelect, "change", onFilterChange);
	add(ui.tierSelect, "change", () => bus.emit(EVENTS.DEALS_UPDATED));

	for (const config of getBooleanFilters()) {
		add(ui.booleanInputs[config.id], "change", onFilterChange);
	}

	for (const config of getNumericFilters()) {
		add(ui.numericInputs[config.id], "input", onFilterChange);
	}

	add(ui.clearAllBtn, "click", () => {
		for (const config of getNumericFilters())
			ui.numericInputs[config.id].value = "";
		for (const config of getBooleanFilters())
			ui.booleanInputs[config.id].checked = false;
		ui.categorySelect.value = "";
		ui.mortgageSelect.value = "";
		ui.descriptionInput.value = "";
		refreshFilterChips();
		void executeSearch(false);
	});

	add(document, "keydown", (e: KeyboardEvent) => {
		if (
			e.key === "Enter" &&
			!["BUTTON", "A", "SELECT"].includes((e.target as Element).tagName)
		) {
			void executeSearch(false);
		}
	});

	const offSearchBus = bus.on(EVENTS.SEARCH_STARTED, (data) => {
		void executeSearch(data?.more ?? false);
	});

	// --- 7. Initialization & Sync ---

	const urlParams = new URLSearchParams(window.location.search);

	// Range sync
	const initialThreshold = urlParams.get("threshold");
	if (initialThreshold !== null) {
		ui.discountRange.value = initialThreshold;
		ui.discountValueDisplay.textContent =
			initialThreshold === "0" ? t("all") : `${initialThreshold}%`;
		setRangeProgress(ui.discountRange);
	}

	// Filter sync
	for (const config of getNumericFilters()) {
		const value = urlParams.get(config.id);
		if (value && value !== "undefined" && value !== "null")
			ui.numericInputs[config.id].value = value;
	}

	const categoryParam = urlParams.get("category");
	if (categoryParam) ui.categorySelect.value = categoryParam;

	const mortgageParam = urlParams.get("hasActiveMortgage");
	if (mortgageParam) ui.mortgageSelect.value = mortgageParam;

	const descriptionParam = urlParams.get("descriptionSearch");
	if (
		descriptionParam &&
		descriptionParam !== "undefined" &&
		descriptionParam !== "null"
	) {
		ui.descriptionInput.value = descriptionParam;
	}

	for (const config of getBooleanFilters()) {
		if (urlParams.get(config.id) === "true")
			ui.booleanInputs[config.id].checked = true;
	}

	refreshFilterChips();

	// Initial Data Loading
	(async () => {
		try {
			const response = await fetch("/api/deals/locations");
			const locationData = (await response.json()) as { data: string[] };
			const locationOptions = [
				{ value: "__all__", label: t("allLocations") },
				...locationData.data.map((loc) => ({ value: loc, label: loc })),
			];
			ui.locationSelect.setOptions(locationOptions);

			const initialLocation = urlParams.get("location");
			if (initialLocation) {
				ui.locationSelect.setValue(initialLocation.split(",").filter(Boolean));
			} else {
				ui.locationSelect.setValue(["__all__"]);
			}
			void executeSearch(false);
		} catch {
			ui.locationSelect.setOptions([{ value: "", label: t("failedLocs") }]);
		}
	})();

	return () => {
		cleanupHandlers();
		offSearchBus();
	};
}
