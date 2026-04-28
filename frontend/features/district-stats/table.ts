import { fmt, html } from "../../core/utils";
import { Icons } from "../../ui/icons";
import type { DistrictStatsUI, LocationRow, SortKey } from "./types";

/**
 * Renders a sortable table header and populates UI indicators.
 */
export function renderSortHeader(
	ui: DistrictStatsUI,
	key: SortKey,
	label: string,
	align: "left" | "right" | "center",
	onClick: () => void,
): HTMLElement {
	const indicator = html`<span
		class="w-3 text-[10px] opacity-0 transition-opacity"
	></span>`;
	ui.sortIndicators[key] = indicator;

	const th = html`
		<th
			class="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-(--muted) cursor-pointer select-none hover:text-(--text) transition-colors ${
				align === "right"
					? "text-right"
					: align === "center"
						? "text-center"
						: "text-left"
			}"
			data-col="${key}"
		>
			<div
				class="flex items-center gap-1 ${
					align === "right"
						? "justify-end"
						: align === "center"
							? "justify-center"
							: ""
				}"
			>
				${label} ${indicator}
			</div>
		</th>
	`;
	th.onclick = onClick;
	ui.sortHeaders[key] = th;
	return th;
}

/**
 * Renders a trend badge for a location row.
 */
export function TrendBadge(row: LocationRow): HTMLElement {
	const { trend, recent_avg, prior_avg } = row;
	if (trend === "flat" || !recent_avg || !prior_avg) {
		return html`<span class="text-(--muted) text-[11px]">···</span>`;
	}

	const isUp = trend === "up";
	const diff = Math.abs(((recent_avg - prior_avg) / prior_avg) * 100);
	const colorClass = isUp
		? "bg-(--red)/10 text-(--red)"
		: "bg-(--green)/10 text-(--green)";

	return html`
		<div
			class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${colorClass} text-[11px] font-bold"
		>
			${Icons.chevron({
				size: 10,
				strokeWidth: 3,
				className: isUp ? "rotate-180" : "",
			})}
			${diff.toFixed(1)}%
		</div>
	`;
}

/**
 * Renders a single data row for the stats table.
 */
export function DataRow(row: LocationRow): HTMLElement {
	return html`
		<tr
			class="group hover:bg-(--surface-2) border-b border-(--border)/50 transition-colors"
		>
			<td
				class="px-5 py-3 font-medium text-(--text) max-w-50 truncate"
				title="${row.location_name}"
			>
				${row.location_name}
			</td>
			<td class="px-4 py-3 text-right font-mono text-[13px]">
				₼ ${fmt(row.avg_price_per_sqm, 0)}
			</td>
			<td class="px-4 py-3 text-right text-(--muted) tabular-nums">
				${row.count}
			</td>
			<td class="px-4 pr-5 py-3 text-center">${TrendBadge(row)}</td>
		</tr>
	`;
}
