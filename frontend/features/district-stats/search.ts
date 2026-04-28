import { t } from "../../core/i18n";
import { html } from "../../core/utils";
import { RawButton } from "../../ui/button";
import { Icons } from "../../ui/icons";
import { RawInput } from "../../ui/input";
import type { DistrictStatsUI } from "./types";

/**
 * Renders the search bar for the stats modal and populates UI refs.
 */
export function renderSearchBar(
	ui: DistrictStatsUI,
	onInput: (val: string) => void,
	onClear: () => void,
): HTMLElement {
	ui.search = RawInput({
		id: "dst-search",
		type: "text",
		placeholder: t("searchDistrict"),
		className:
			"w-full h-9 pl-9 pr-9 bg-(--surface-2) border border-(--border) rounded-(--r-sm) text-sm focus:outline-none focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 transition-all",
		oninput: (e) => {
			const val = (e.target as HTMLInputElement).value;
			onInput(val);
		},
	});

	ui.clear = RawButton({
		className:
			"w-6 h-6 flex items-center justify-center rounded-(--r-sm) text-(--muted) hover:text-(--text) hover:bg-(--surface-3) transition-all opacity-0 pointer-events-none [&.visible]:opacity-100 [&.visible]:pointer-events-auto",
		content: Icons.close(12),
		ariaLabel: "Clear search",
		onclick: () => {
			ui.search.value = "";
			ui.clear.classList.remove("visible");
			onClear();
		},
	});

	return html`
		<div class="relative group">
			<div
				class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-(--muted) group-focus-within:text-(--text) transition-colors"
			>
				${Icons.search(14)}
			</div>
			${ui.search}
			<div class="absolute inset-y-0 right-1.5 flex items-center">
				${ui.clear}
			</div>
		</div>
	`;
}
