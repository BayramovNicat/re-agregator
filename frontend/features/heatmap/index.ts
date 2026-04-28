import {
	circle,
	DomEvent,
	featureGroup,
	type LeafletMouseEvent,
	type Map as LMap,
	layerGroup,
} from "leaflet";
import { bus, EVENTS } from "../../core/events";
import { t } from "../../core/i18n";
import type { HeatmapPoint } from "../../core/types";
import { fmt, html, toast } from "../../core/utils";
import { initLeaflet, MapDialog } from "../../ui/map-base";
import { fetchHeatmapData } from "./api";
import { getPriceColor } from "./logic";

export function initHeatmap(root: HTMLElement): () => void {
	const overlay = layerGroup();
	let isFirstOpen = true;
	let lmap: LMap | null = null;
	let currentOnAction: ((name: string, isToggle: boolean) => void) | null =
		null;

	const containerId = "heatmap-map-container";
	const modal = MapDialog({
		id: "heatmap-modal",
		containerId,
	});

	root.appendChild(modal);

	const onOpen = async (
		_activeLocations: string[],
		onAction: (name: string, isToggle: boolean) => void,
	) => {
		currentOnAction = onAction;
		modal.showModal();

		if (!lmap) {
			const ct = modal.querySelector(`#${containerId}`) as HTMLElement;
			lmap = initLeaflet(ct);
		}

		if (isFirstOpen) {
			isFirstOpen = false;
			const data = await fetchHeatmapData();
			if (data.length > 0 && lmap) {
				renderPoints(lmap, data, overlay, (name, isToggle) => {
					if (currentOnAction) currentOnAction(name, isToggle);
					modal.close();
				});
			}
		}

		overlay.addTo(lmap);
		lmap.invalidateSize();
	};

	const offOpen = bus.on(EVENTS.HEATMAP_OPEN, (payload) => {
		void onOpen(payload.activeLocations, payload.onAction);
	});

	return () => {
		offOpen();
		modal.remove();
		overlay.remove();
		lmap?.remove();
	};
}

/**
 * Global helper to open the heatmap modal.
 */
export function openHeatmap(
	activeLocations: string[],
	onAction: (name: string, isToggle: boolean) => void,
): void {
	bus.emit(EVENTS.HEATMAP_OPEN, { activeLocations, onAction });
}

function renderPoints(
	lmap: LMap,
	data: HeatmapPoint[],
	group: ReturnType<typeof layerGroup>,
	onSelect: (name: string, isToggle: boolean) => void,
): void {
	const ppsms = data.map((d) => d.avg_price_per_sqm);
	const min = Math.min(...ppsms);
	const max = Math.max(...ppsms);

	const points = featureGroup();

	for (const d of data) {
		const color = getPriceColor(d.avg_price_per_sqm, min, max);
		const c = circle([d.lat, d.lng], {
			radius: 400,
			fillColor: color,
			fillOpacity: 0.65,
			stroke: true,
			color: "white",
			weight: 1,
			opacity: 0.3,
		});

		c.on("mouseover", (_e: LeafletMouseEvent) => {
			c.setStyle({ fillOpacity: 0.9, weight: 2, opacity: 1 });
			const popup = html`
				<div class="p-1 min-w-32">
					<div class="text-[10px] uppercase tracking-wider text-(--muted) font-bold mb-1">${d.location_name}</div>
					<div class="text-sm font-bold">₼ ${fmt(d.avg_price_per_sqm, 0)} <span class="text-xs font-normal opacity-70">/ m²</span></div>
					<div class="text-[11px] text-(--muted) mt-1">${d.count} ${t(d.count !== 1 ? "listings" : "listing")}</div>
				</div>
			`;
			c.bindPopup(popup, {
				closeButton: false,
				offset: [0, -2],
				className: "re-popup",
			}).openPopup();
		});

		c.on("mouseout", () => {
			c.setStyle({ fillOpacity: 0.65, weight: 1, opacity: 0.3 });
			c.closePopup();
		});

		c.on("click", (e: LeafletMouseEvent) => {
			DomEvent.stopPropagation(e);
			onSelect(d.location_name, e.originalEvent.shiftKey);
			toast(d.location_name);
		});

		c.addTo(points);
	}

	points.addTo(group);
	lmap.fitBounds(points.getBounds(), { padding: [20, 20] });
}
