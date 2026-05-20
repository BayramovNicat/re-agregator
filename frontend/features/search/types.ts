import type { MultiSelectElement } from "@/ui/multi-select";

export interface SearchUI {
	locationSelect: MultiSelectElement;
	discountRange: HTMLInputElement;
	discountValueDisplay: HTMLElement;
	advancedToggle: HTMLButtonElement;
	advancedPanel: HTMLElement;
	advancedCount: HTMLElement;
	activeChipsContainer: HTMLElement;
	clearAllBtn: HTMLButtonElement;
	categorySelect: HTMLSelectElement;
	listingTypeSelect: HTMLSelectElement;
	mortgageSelect: HTMLSelectElement;
	descriptionInput: HTMLInputElement;
	tierSelect: HTMLSelectElement;
	priceMapActionBtn: HTMLButtonElement;
	numericInputs: Record<string, HTMLInputElement>;
	booleanInputs: Record<string, HTMLInputElement>;
}

export interface SearchCallbacks {
	onFilterChange: () => void;
	onPriceMap: () => void;
	onTierChange: () => void;
	onClear: () => void;
}
