import { t } from "@/core/i18n";
import { html } from "@/core/utils";
import { Button } from "@/ui/button";
import { Dialog } from "@/ui/dialog";
import { Gallery } from "@/ui/gallery";
import { Icons } from "@/ui/icons";
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

	ui.gallery = Gallery({ onExpand, style: "height:460px" });

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
	ui.tagsEl = html`<div
		class="flex flex-wrap gap-1.25 mt-3 empty:hidden"
	></div>`;

	// Content Sections
	ui.historyChartEl = html`<div></div>`;
	ui.historySecEl = html`
		<div class="pt-6 border-t border-(--border)/60 hidden">
			<div
				class="text-[10px] font-bold text-(--muted) uppercase tracking-widest mb-3"
			>
				${t("priceHistory")}
			</div>
			${ui.historyChartEl}
		</div>
	`;

	ui.descBodyEl = html`<p
		class="text-sm text-(--text-2) leading-relaxed whitespace-pre-wrap"
	></p>`;
	ui.descSecEl = html`
		<div class="pt-6 border-t border-(--border)/60 hidden">
			${ui.descBodyEl}
		</div>
	`;

	ui.mapCtEl = html`<div class="w-full h-90 bg-(--surface-3)"></div>`;
	ui.mapSecEl = html`<div class="hidden border-t border-(--border)">
		${ui.mapCtEl}
	</div>`;

	// Footer Actions
	ui.linkEl = html`<a
		href="#"
		target="_blank"
		rel="noopener"
		class="w-full h-12.5 flex items-center justify-center gap-2.5 bg-(--accent-solid) text-white rounded-(--r) font-bold text-sm transition-all hover:bg-(--accent-h) hover:shadow-[0_8px_20px_rgba(79,70,229,0.25)] active:scale-[0.98]"
	>
		${t("viewListing")} ${Icons.external(14)}
	</a>` as HTMLAnchorElement;

	ui.shareTextEl = html`<span>${t("btnShare")}</span>`;
	ui.shareBtn = Button({
		content: Icons.external(16),
		variant: "padded",
		color: "indigo",
		className: "w-12.5 h-12.5 flex items-center justify-center shrink-0",
		onclick: onShare,
		title: t("btnShare"),
	}) as HTMLButtonElement;

	ui.bmarkBtn = Button({
		content: Icons.bookmark({ size: 18, fill: false }),
		variant: "padded",
		color: "indigo",
		className: "w-12.5 h-12.5 flex items-center justify-center shrink-0",
		onclick: onBookmark,
		title: t("btnSave"),
	}) as HTMLButtonElement;

	ui.hideBtn = Button({
		content: Icons.hide(16),
		variant: "padded",
		color: "red",
		className: "w-12.5 h-12.5 flex items-center justify-center shrink-0",
		onclick: onHide,
		title: t("btnHide"),
	}) as HTMLButtonElement;

	const leftCol = html`
		<div class="flex-1 min-w-0 overflow-y-auto bg-(--surface) flex flex-col">
			${ui.gallery} ${ui.mapSecEl}
		</div>
	`;

	const rightCol = html`
		<div
			class="w-full md:w-95 shrink-0 flex flex-col bg-(--surface-2) border-l border-(--border)"
		>
			<div class="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
				<!-- Core Info -->
				<div class="space-y-5">
					<div class="space-y-3">
						<div>${ui.tierEl}</div>
						<div class="space-y-1.5 min-w-0">
							${ui.priceEl}
							<div class="flex items-center gap-2 text-xs text-(--muted)">
								${ui.locationEl}
								<span class="opacity-30">•</span>
								${ui.postedEl}
							</div>
						</div>
					</div>

					<!-- Market Context Banner -->
					<div
						class="flex items-center justify-between p-4 bg-(--surface) border border-(--border) rounded-(--r)"
					>
						<div class="space-y-1">
							<div
								class="text-[10px] font-bold text-(--muted) uppercase tracking-wider"
							>
								${t("propMarketAvg")}
							</div>
							<div class="text-sm font-semibold">${ui.mktAvgEl}</div>
						</div>
						<div class="text-right space-y-1">
							<div
								class="text-[10px] font-bold text-(--muted) uppercase tracking-wider"
							>
								${t("propDiscount")}
							</div>
							<div class="text-sm font-bold">${ui.discPctEl}</div>
						</div>
					</div>
				</div>

				<!-- Stats & Tags -->
				<div class="space-y-4">${ui.statsEl} ${ui.tagsEl}</div>

				<!-- Conditional Sections -->
				${ui.historySecEl} ${ui.descSecEl}
			</div>

			<!-- Sticky Actions -->
			<div
				class="p-6 border-t border-(--border) bg-(--surface) space-y-4 shrink-0"
			>
				${ui.linkEl}
				<div class="flex items-center justify-center gap-3">
					${ui.bmarkBtn} ${ui.shareBtn} ${ui.hideBtn}
				</div>
			</div>
		</div>
	`;

	ui.modal = Dialog({
		id: "prop-detail-modal",
		maxWidth: "1150px",
		showClose: true,
		className: "text-(--text) flex-1 min-h-0",
		content: html`
			<div class="flex flex-col md:flex-row h-full min-h-0">
				${leftCol} ${rightCol}
			</div>
		`,
	}) as HTMLElement & { showModal: () => void; close: () => void };

	return ui.modal;
}
