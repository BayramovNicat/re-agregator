import type { MultiSelectElement } from "@/ui/multi-select";

export interface SearchUI {
	locationSelect: MultiSelectElement;
	discountRange: HTMLInputElement;
	discountValueDisplay: HTMLElement;
	searchTrigger: HTMLButtonElement;
	advancedToggle: HTMLButtonElement;
	advancedPanel: HTMLElement;
	advancedCount: HTMLElement;
	activeChipsContainer: HTMLElement;
	clearAllBtn: HTMLButtonElement;
	categorySelect: HTMLSelectElement;
	mortgageSelect: HTMLSelectElement;
	descriptionInput: HTMLInputElement;
	tierSelect: HTMLSelectElement;
	priceMapActionBtn: HTMLButtonElement;
	numericInputs: Record<string, HTMLInputElement>;
	booleanInputs: Record<string, HTMLInputElement>;
}

export interface SearchCallbacks {
	onFilterChange: () => void;
	onSearch: () => void;
	onPriceMap: () => void;
	onTierChange: () => void;
	onClear: () => void;
}
