import { t } from "../../core/i18n";
import { frag, hide, html } from "../../core/utils";
import { Button, RawButton } from "../../ui/button";
import { Chip } from "../../ui/chip";
import { Icons } from "../../ui/icons";
import { Field, Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { MultiSelect } from "../../ui/multi-select";
import { Range } from "../../ui/range";
import { Select } from "../../ui/select";
import { getBooleanFilters, getNumericFilters } from "./constants";
import type { SearchCallbacks, SearchUI } from "./types";

/**
 * Renders the search filter UI and populates the UI references.
 */
export function renderSearchFilters(
	ui: SearchUI,
	callbacks: SearchCallbacks,
): HTMLElement {
	const { onFilterChange, onSearch, onPriceMap, onTierChange, onClear } =
		callbacks;

	ui.locationSelect = MultiSelect({
		id: "loc-trigger",
		placeholder: t("chooseLocs"),
		className: "w-full",
		exclusiveValue: "__all__",
		options: [],
		onChange: onFilterChange,
	});

	ui.priceMapActionBtn = Button({
		id: "price-map-btn",
		title: t("priceMapTitle"),
		color: "indigo",
		variant: "base",
		ariaLabel: t("priceMap"),
		content: frag`${Icons.globe(14)} ${t("priceMap")}`,
		onclick: onPriceMap,
	}) as HTMLButtonElement;

	ui.discountValueDisplay = html`<span
		class="text-xs font-bold text-(--accent) bg-(--accent-dim) px-2 py-0.5 rounded-full tracking-[0.02em]"
		>10%</span
	>`;

	const rangeWrapper = Range({
		id: "discount-threshold",
		min: 0,
		max: 50,
		value: 10,
		ariaLabel: t("discountThreshold"),
		oninput: (e) => {
			const value = (e.target as HTMLInputElement).value;
			ui.discountValueDisplay.textContent =
				value === "0" ? t("all") : `${value}%`;
			onFilterChange();
		},
	});
	ui.discountRange = rangeWrapper.inputElement;

	ui.searchTrigger = Button({
		id: "search-trigger",
		variant: "base",
		color: "accent",
		content: frag`${Icons.search(14)} ${t("search")}`,
		onclick: onSearch,
	}) as HTMLButtonElement;

	ui.advancedCount = html`<span
		class="bg-(--accent-solid) text-white rounded-full px-1.5 py-px text-xs font-semibold"
	></span>`;
	hide(ui.advancedCount);

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

	ui.advancedToggle.onclick = () => {
		const isOpen = ui.advancedPanel.classList.toggle("open");
		ui.advancedToggle.setAttribute("aria-expanded", String(isOpen));
	};

	ui.categorySelect = Select({
		id: "category",
		className: "w-full",
		options: [
			{ value: "", label: t("any") },
			{ value: "Yeni tikili", label: t("newBuild") },
			{ value: "Köhnə tikili", label: t("secondary") },
		],
		onchange: onFilterChange,
	});

	ui.mortgageSelect = Select({
		id: "hasActiveMortgage",
		className: "w-full",
		options: [
			{ value: "", label: t("any") },
			{ value: "false", label: t("no") },
			{ value: "true", label: t("yes") },
		],
		onchange: onFilterChange,
	});

	ui.descriptionInput = Input({
		id: "descriptionSearch",
		type: "text",
		placeholder: t("descriptionSearchPlaceholder"),
		className: "w-full",
		oninput: onFilterChange,
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
		onchange: onTierChange,
	});

	ui.clearAllBtn = RawButton({
		className:
			"inline-flex items-center gap-1 text-xs text-(--muted) hover:text-(--text) transition-colors border border-(--border) hover:border-(--border-h) rounded-(--r-sm) px-2.5 py-1.25",
		content: t("clearFilters"),
		onclick: onClear,
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
						oninput: onFilterChange,
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
					const chipWrapper = Chip({
						id: config.id,
						label: config.label,
						onchange: onFilterChange,
					});
					ui.booleanInputs[config.id] = chipWrapper.inputElement;
					return chipWrapper;
				})}
			</div>
			<div class="flex justify-end pt-2.5">${ui.clearAllBtn}</div>
		</div>
	`;

	ui.activeChipsContainer = html`<div
		class="flex flex-wrap gap-1.5 mb-3.5"
	></div>`;
	hide(ui.activeChipsContainer);

	return html`
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
					${ui.priceMapActionBtn}
				</div>
				<div class="flex flex-col gap-1.5">
					<div class="flex items-center justify-between">
						${Label({
							text: t("discountThreshold"),
							htmlFor: "discount-threshold",
						})}
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
}
