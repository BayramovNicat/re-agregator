import { t } from "@/core/i18n";
import { setRangeProgress } from "@/ui/range";
import { getBooleanFilters, getNumericFilters } from "./constants";
import type { SearchUI } from "./types";

/**
 * Persists the current filter state to the URL.
 */
export function syncStateToUrl(params: URLSearchParams): void {
	const persistParams = new URLSearchParams(params);
	persistParams.delete("limit");
	persistParams.delete("offset");

	const search = persistParams.toString();
	const url = search
		? `${window.location.pathname}?${search}`
		: window.location.pathname;

	window.history.replaceState(null, "", url);
}

/**
 * Restores the UI state from URL parameters.
 */
export function restoreStateFromUrl(ui: SearchUI): void {
	const urlParams = new URLSearchParams(window.location.search);

	// 1. Range / Threshold
	const threshold = urlParams.get("threshold");
	if (threshold !== null) {
		ui.discountRange.value = threshold;
		ui.discountValueDisplay.textContent =
			threshold === "0" ? t("all") : `${threshold}%`;
		setRangeProgress(ui.discountRange);
	}

	// 2. Numeric Inputs
	for (const config of getNumericFilters()) {
		const val = urlParams.get(config.id);
		if (val && val !== "undefined" && val !== "null") {
			ui.numericInputs[config.id].value = val;
		}
	}

	// 3. Boolean Inputs
	for (const config of getBooleanFilters()) {
		if (urlParams.get(config.id) === "true") {
			ui.booleanInputs[config.id].checked = true;
		}
	}

	// 4. Dropdowns & Custom
	const category = urlParams.get("category");
	if (category) ui.categorySelect.value = category;

	const mortgage = urlParams.get("hasActiveMortgage");
	if (mortgage) ui.mortgageSelect.value = mortgage;

	const desc = urlParams.get("descriptionSearch");
	if (desc && desc !== "undefined" && desc !== "null") {
		ui.descriptionInput.value = desc;
	}

	// 5. Locations
	const location = urlParams.get("location");
	if (location) {
		ui.locationSelect.setValue(location.split(",").filter(Boolean));
	} else {
		ui.locationSelect.setValue(["__all__"]);
	}
}
