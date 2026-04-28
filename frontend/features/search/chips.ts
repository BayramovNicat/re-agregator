import { t } from "@/core/i18n";
import { hide, show } from "@/core/utils";
import { CloseableChip } from "@/ui/chip";
import { getBooleanFilters, getNumericFilters } from "./constants";
import type { SearchUI } from "./types";

/**
 * Updates the filter chips display based on current UI state.
 */
export function refreshFilterChips(ui: SearchUI, onSearch: () => void): void {
	const activeChips: HTMLElement[] = [];

	const isFilterChecked = (id: string) =>
		ui.booleanInputs[id]?.checked || false;
	const getNumericValue = (id: string) =>
		ui.numericInputs[id]?.value.trim() || "";

	// Helper to create a removable chip
	const createChip = (label: string, clear: () => void) => {
		return CloseableChip({
			label,
			onClose: () => {
				clear();
				refreshFilterChips(ui, onSearch);
				onSearch();
			},
		});
	};

	for (const config of getBooleanFilters()) {
		if (isFilterChecked(config.id)) {
			activeChips.push(
				createChip(config.label, () => {
					ui.booleanInputs[config.id].checked = false;
				}),
			);
		}
	}

	for (const config of getNumericFilters()) {
		const value = getNumericValue(config.id);
		if (value) {
			activeChips.push(
				createChip(`${config.chipLabel}: ${value}`, () => {
					ui.numericInputs[config.id].value = "";
				}),
			);
		}
	}

	if (ui.categorySelect.value) {
		activeChips.push(
			createChip(`${t("chipCategory")}: ${ui.categorySelect.value}`, () => {
				ui.categorySelect.value = "";
			}),
		);
	}

	if (ui.mortgageSelect.value) {
		const label = ui.mortgageSelect.value === "true" ? t("yes") : t("no");
		activeChips.push(
			createChip(`${t("chipActiveMortgage")}: ${label}`, () => {
				ui.mortgageSelect.value = "";
			}),
		);
	}

	const desc = ui.descriptionInput.value.trim();
	if (desc) {
		activeChips.push(
			createChip(`${t("chipDescSearch")}: ${desc}`, () => {
				ui.descriptionInput.value = "";
			}),
		);
	}

	const selectedLocations = ui.locationSelect.getValue();
	if (selectedLocations.length > 0 && !selectedLocations.includes("__all__")) {
		for (const location of selectedLocations) {
			activeChips.push(
				createChip(location, () => {
					ui.locationSelect.setValue(
						ui.locationSelect.getValue().filter((v) => v !== location),
					);
				}),
			);
		}
	}

	ui.activeChipsContainer.replaceChildren(...activeChips);
	if (activeChips.length) show(ui.activeChipsContainer, "flex");
	else hide(ui.activeChipsContainer);

	if (activeChips.length) {
		ui.advancedCount.textContent = String(activeChips.length);
		show(ui.advancedCount, "inline-block");
	} else {
		hide(ui.advancedCount);
	}
}
