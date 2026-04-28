import type { PriceHistoryEntry } from "../../core/types";
import { html } from "../../core/utils";

/**
 * Renders a price history sparkline using a declarative SVG template.
 */
export function PriceHistoryChart(
	history: PriceHistoryEntry[],
	color: string,
	locale: string,
): HTMLElement {
	const data = [...history].reverse();
	const prices = data.map((h) => Number(h.price));
	const min = Math.min(...prices);
	const max = Math.max(...prices);
	const range = max - min || 1;

	const W = 400,
		H = 72,
		PT = 8,
		PB = 20;
	const xy = (i: number, p: number) => ({
		x: (i / (prices.length - 1)) * W,
		y: PT + (1 - (p - min) / range) * (H - PT - PB),
	});

	const gradId = `ph-${Math.random().toString(36).slice(2, 7)}`;
	const ptStr = prices.map((p, i) => {
		const pt = xy(i, p);
		return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
	});

	const first = xy(0, prices[0]);
	const last = xy(prices.length - 1, prices[prices.length - 1]);
	const areaD = `M ${first.x} ${H - PB} L ${ptStr.map((p) => p.replace(",", " ")).join(" L ")} L ${last.x} ${H - PB} Z`;

	const fmtD = (s: string) =>
		new Date(s).toLocaleDateString(locale, { month: "short", day: "numeric" });

	return html`
		<svg
			viewBox="0 0 ${W} ${H}"
			preserveAspectRatio="none"
			class="w-full h-18 block overflow-visible"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="${color}" stop-opacity="0.2" />
					<stop offset="100%" stop-color="${color}" stop-opacity="0" />
				</linearGradient>
			</defs>
			<path d="${areaD}" fill="url(#${gradId})" />
			<polyline
				points="${ptStr.join(" ")}"
				fill="none"
				stroke="${color}"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<circle
				cx="${first.x.toFixed(1)}"
				cy="${first.y.toFixed(1)}"
				r="3"
				fill="${color}"
			/>
			<circle
				cx="${last.x.toFixed(1)}"
				cy="${last.y.toFixed(1)}"
				r="3"
				fill="${color}"
			/>
			<text x="1" y="${H - 3}" fill="var(--muted)" font-size="10">
				${fmtD(data[0].recorded_at)}
			</text>
			<text
				x="${W - 1}"
				y="${H - 3}"
				fill="var(--muted)"
				font-size="10"
				text-anchor="end"
			>
				${fmtD(data[data.length - 1].recorded_at)}
			</text>
		</svg>
	`;
}
