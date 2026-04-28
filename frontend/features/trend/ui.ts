import { t } from "../../core/i18n";
import { html } from "../../core/utils";
import type { TrendUI } from "./types";

/**
 * Renders the trend panel shell and populates UI refs.
 */
export function renderTrendUI(ui: TrendUI): HTMLElement {
	ui.locEl = html`<span></span>`;
	ui.curEl = html`<span></span>`;
	ui.chgEl = html`<span
		class="text-xs font-semibold px-2 py-0.5 rounded-full border"
	></span>`;
	ui.weeksEl = html`<div
		class="text-xs text-(--muted) text-right pt-0.5 whitespace-nowrap"
	></div>`;
	ui.tipEl = html`<div
		class="absolute hidden bg-(--surface-3) border border-(--border-h) rounded-(--r-sm) px-2.75 py-1.75 text-xs pointer-events-none z-10 whitespace-nowrap leading-normal top-0 left-0"
	></div>`;
	ui.chartEl = html`<div class="w-full relative">${ui.tipEl}</div>`;
	ui.datesEl = html`<div
		class="flex justify-between text-xs text-(--muted) mt-1.25 px-0.5"
	></div>`;

	ui.panel = html`<div class="hidden">
		<div
			class="bg-(--surface) border border-(--border) rounded-(--r) pt-4 px-5 pb-3 mb-4 animate-[fadeUp_0.2s_ease_both]"
		>
			<div class="flex items-start justify-between mb-3.5 gap-3">
				<div>
					<div class="text-xs text-(--muted) mb-1.25 tracking-[0.02em]">
						${t("avgTrend")} · ${ui.locEl}
					</div>
					<div class="flex items-baseline gap-2 flex-wrap">
						<span class="text-[20px] font-bold tracking-[-0.5px]"
							>${ui.curEl}</span
						>
						${ui.chgEl}
					</div>
				</div>
				${ui.weeksEl}
			</div>
			${ui.chartEl} ${ui.datesEl}
		</div>
	</div>`;

	return ui.panel;
}
