import { t } from "../../core/i18n";
import { frag, html } from "../../core/utils";
import { Button } from "../../ui/button";
import { Dialog } from "../../ui/dialog";
import { Gallery } from "../../ui/gallery";
import { Icons } from "../../ui/icons";
import type { PropertyDetailUI } from "./types";

/**
 * Renders the property detail layout and populates UI references.
 */
export function renderPropertyDetailLayout(
	ui: PropertyDetailUI,
	callbacks: {
		onExpand: () => void;
		onShare: () => void;
		onBookmark: () => void;
		onHide: () => void;
	},
): HTMLElement {
	const { onExpand, onShare, onBookmark, onHide } = callbacks;

	ui.gallery = Gallery({ onExpand });

	// Header elements
	ui.locationEl = html`<div class="text-xs text-(--muted) truncate"></div>`;
	ui.postedEl = html`<div class="text-xs text-(--muted) shrink-0"></div>`;
	ui.priceEl = html`<span class="text-2xl font-bold tracking-tight"></span>`;
	ui.tierEl = html`<span
		class="inline-flex items-center text-[10px] font-semibold tracking-wider px-2 py-0.75 rounded-full border border-current whitespace-nowrap"
	></span>`;

	// Stats & Tags
	ui.statsEl = html`<div class="grid grid-cols-4 gap-2 mb-3"></div>`;
	ui.mktAvgEl = html`<span class="text-(--text-2) font-medium"></span>`;
	ui.discPctEl = html`<span class="text-sm font-bold"></span>`;
	ui.discBarEl = html`<div
		class="h-full rounded-full transition-[width] duration-500 ease-out"
		style="width:0%"
	></div>`;
	ui.tagsEl = html`<div
		class="flex flex-wrap gap-1.25 mt-3 empty:hidden"
	></div>`;

	// Content Sections
	ui.historyChartEl = html`<div></div>`;
	ui.historySecEl = html`
		<div class="px-5 py-4 border-b border-(--border) hidden">
			<div
				class="text-xs font-semibold text-(--muted) uppercase tracking-wider mb-2.5"
			>
				${t("priceHistory")}
			</div>
			${ui.historyChartEl}
		</div>
	`;

	ui.descBodyEl = html`<p
		class="text-sm text-(--text-2) leading-[1.75] whitespace-pre-wrap"
	></p>`;
	ui.descSecEl = html`
		<div class="px-5 py-4 border-b border-(--border) hidden">
			<div
				class="text-xs font-semibold text-(--muted) uppercase tracking-wider mb-2"
			>
				${t("btnDescription")}
			</div>
			${ui.descBodyEl}
		</div>
	`;

	ui.mapCtEl = html`<div class="w-full h-65"></div>`;
	ui.mapSecEl = html`<div class="border-b border-(--border) hidden">
		${ui.mapCtEl}
	</div>`;

	// Footer Actions
	ui.linkEl = html`<a
		href="#"
		target="_blank"
		rel="noopener"
		class="inline-flex items-center gap-1.25 text-xs text-(--muted) transition-colors hover:text-(--text)"
	>
		${t("viewListing")} ${Icons.external(10)}
	</a>` as HTMLAnchorElement;

	ui.shareTextEl = html`<span>${t("btnShare")}</span>`;
	ui.shareBtn = Button({
		content: frag`${Icons.external(10)} ${ui.shareTextEl}`,
		variant: "padded",
		color: "indigo",
		onclick: onShare,
	}) as HTMLButtonElement;

	ui.bmarkBtn = Button({
		content: html`${Icons.bookmark({ size: 12, fill: false })}
			<span>${t("btnSave")}</span>`,
		variant: "padded",
		color: "indigo",
		onclick: onBookmark,
	}) as HTMLButtonElement;

	ui.hideBtn = Button({
		content: html`${Icons.hide(12)} <span>${t("btnHide")}</span>`,
		variant: "padded",
		color: "red",
		onclick: onHide,
	}) as HTMLButtonElement;

	const bodyEl = html`
		<div class="overflow-y-auto flex-1 min-h-0">
			${ui.gallery}
			<div class="px-5 pt-4 pb-3 border-b border-(--border)">
				<div class="flex items-center justify-between gap-3 mb-1">
					${ui.locationEl} ${ui.postedEl}
				</div>
				<div class="flex items-center gap-2.5">${ui.priceEl} ${ui.tierEl}</div>
			</div>
			<div class="px-5 py-4 border-b border-(--border)">
				${ui.statsEl}
				<div class="flex items-center justify-between mb-1.5">
					<span class="text-xs text-(--muted)"
						>${t("propMarketAvg")} ${ui.mktAvgEl}</span
					>
					${ui.discPctEl}
				</div>
				<div class="h-1 bg-(--surface-3) rounded-full overflow-hidden">
					${ui.discBarEl}
				</div>
				${ui.tagsEl}
			</div>
			${ui.historySecEl} ${ui.descSecEl} ${ui.mapSecEl}
		</div>
	`;

	ui.modal = Dialog({
		id: "prop-detail-modal",
		maxWidth: "900px",
		showClose: true,
		className: "text-(--text)",
		content: html`
			<div class="flex flex-col h-full min-h-0">
				${bodyEl}
				<div
					class="px-5 py-3 flex items-center justify-between gap-3 border-t border-(--border) bg-(--surface) shrink-0"
				>
					${ui.linkEl}
					<div class="flex items-center gap-1.5">
						${ui.shareBtn} ${ui.bmarkBtn} ${ui.hideBtn}
					</div>
				</div>
			</div>
		`,
	}) as HTMLElement & { showModal: () => void; close: () => void };

	return ui.modal;
}
