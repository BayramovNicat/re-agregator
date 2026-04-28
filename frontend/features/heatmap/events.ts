import { type Circle, DomEvent, type LeafletMouseEvent } from "leaflet";
import { t } from "../../core/i18n";
import type { HeatmapPoint } from "../../core/types";
import { fmt, html, toast } from "../../core/utils";

export function setupCircleEvents(
	c: Circle & { _heatmapData?: HeatmapPoint },
	d: HeatmapPoint,
	getActiveLocations: () => string[],
	onSelect: (name: string, isToggle: boolean) => void,
) {
	c.on("mouseover", (_e: LeafletMouseEvent) => {
		c.setStyle({ fillOpacity: 0.9, weight: 2, opacity: 1, color: "white" });
		const popup = html`
			<div class="p-1 min-w-32">
				<div
					class="text-[10px] uppercase tracking-wider text-(--muted) font-bold mb-1"
				>
					${d.location_name}
				</div>
				<div class="text-sm font-bold">
					₼ ${fmt(d.avg_price_per_sqm, 0)}
					<span class="text-xs font-normal opacity-70">/ m²</span>
				</div>
				<div class="text-[11px] text-(--muted) mt-1">
					${d.count} ${t(d.count !== 1 ? "listings" : "listing")}
				</div>
			</div>
		`;
		c.bindPopup(popup, {
			closeButton: false,
			offset: [0, -2],
			className:
				"[&_.leaflet-popup-content-wrapper]:!bg-(--surface-3) [&_.leaflet-popup-content-wrapper]:!text-(--text) [&_.leaflet-popup-content-wrapper]:!rounded-(--r-sm) [&_.leaflet-popup-content-wrapper]:!p-0 [&_.leaflet-popup-content-wrapper]:!border [&_.leaflet-popup-content-wrapper]:!border-(--border-h) [&_.leaflet-popup-tip]:!bg-(--surface-3) [&_.leaflet-popup-tip]:!border [&_.leaflet-popup-tip]:!border-(--border-h) [&_.leaflet-popup-content]:!m-0",
		}).openPopup();
	});

	c.on("mouseout", () => {
		const isStillActive = getActiveLocations().includes(d.location_name);
		c.setStyle({
			fillOpacity: 0.65,
			weight: isStillActive ? 2 : 1,
			opacity: isStillActive ? 1 : 0.3,
			color: isStillActive ? "white" : "transparent",
		});
		c.closePopup();
	});

	c.on("click", (e: LeafletMouseEvent) => {
		DomEvent.stopPropagation(e);
		onSelect(d.location_name, e.originalEvent.shiftKey);
		toast(d.location_name);
	});

	c.on("contextmenu", (e: LeafletMouseEvent) => {
		DomEvent.stopPropagation(e);
		onSelect(d.location_name, true);
		toast(d.location_name);
	});
}
