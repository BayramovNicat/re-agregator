import { t } from "@/core/i18n";
import { state } from "@/core/state";
import { frag, html } from "@/core/utils";
import { Button } from "@/ui/button";
import { Icons } from "@/ui/icons";
import { Select } from "@/ui/select";
import type { ProductsCallbacks, ProductsUI } from "./types";

/**
 * Renders the products results bar and populates UI references.
 */
export function renderProductsBar(
	ui: ProductsUI,
	callbacks: ProductsCallbacks,
): HTMLElement {
	const { onExport, onAlertsOpen, onSavedClick, onSortChange, onViewChange } =
		callbacks;

	ui.resultsMeta = html`<div
		class="text-sm text-(--text-2) [&_strong]:text-(--text) [&_strong]:font-semibold"
		aria-live="polite"
		role="status"
	></div>`;

	ui.savedBadge = html`<span></span>`;
	ui.savedBtn = Button({
		className: "hidden",
		content: frag`${Icons.bookmark({ size: 12, fill: false })} ${t("saved")} ${ui.savedBadge}`,
		onclick: onSavedClick,
	}) as HTMLButtonElement;

	ui.sortSelect = Select({
		name: "sort-by",
		variant: "xs",
		ariaLabel: t("sortBy"),
		title: t("sortBy"),
		options: [
			{ value: "disc", label: t("sortDisc") },
			{ value: "drops", label: t("sortDrops") },
			{ value: "new", label: t("sortNew") },
			{ value: "price-asc", label: t("sortPriceAsc") },
			{ value: "price-desc", label: t("sortPriceDesc") },
			{ value: "area", label: t("sortArea") },
			{ value: "ppsm", label: t("sortPpsm") },
		],
		onchange: (e) => onSortChange((e.target as HTMLSelectElement).value),
	});

	ui.viewGridBtn = Button({
		variant: "square",
		color: "indigo",
		active: state.currentView === "grid",
		title: t("gridView"),
		content: Icons.grid(13),
		onclick: () => onViewChange("grid"),
	}) as HTMLButtonElement;

	ui.viewListBtn = Button({
		variant: "square",
		color: "indigo",
		active: state.currentView === "list",
		title: t("listView"),
		content: Icons.list(13),
		onclick: () => onViewChange("list"),
	}) as HTMLButtonElement;

	ui.viewMapBtn = Button({
		variant: "square",
		color: "indigo",
		active: state.currentView === "map",
		title: t("mapView"),
		content: Icons.mapPins(13),
		onclick: () => onViewChange("map"),
	}) as HTMLButtonElement;

	ui.resultsBarInner = html`
		<div
			class="flex items-center justify-between mb-2 p-2 gap-2.5 flex-wrap"
			style="display: none"
		>
			${ui.resultsMeta}
			<div class="flex items-center gap-1.75">
				${Button({
					title: t("exportBtn"),
					content: frag`${Icons.download(12)} ${t("exportBtn")}`,
					color: "blue",
					onclick: onExport,
				})}
				${Button({
					title: t("telegramAlerts"),
					content: frag`${Icons.bell(12)} ${t("alertMe")}`,
					color: "yellow",
					onclick: onAlertsOpen,
				})}
				${ui.savedBtn} ${ui.sortSelect} ${ui.viewGridBtn} ${ui.viewListBtn}
				${ui.viewMapBtn}
			</div>
		</div>
	`;

	ui.resultsBarContainer = html`
		<div class="sticky top-0 z-10" style="background:var(--bg)">
			${ui.resultsBarInner}
		</div>
	`;

	return ui.resultsBarContainer;
}
