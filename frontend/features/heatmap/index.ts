import {
	type Circle,
	circle,
	type FeatureGroup,
	featureGroup,
	type Map as LMap,
	latLngBounds,
} from "leaflet";
import { bus, EVENTS } from "../../core/events";
import type { HeatmapPoint } from "../../core/types";
import { initLeaflet, MapDialog } from "../../ui/map-base";
import { fetchHeatmapData } from "./api";
import { setupCircleEvents } from "./events";
import { getPriceColor } from "./logic";

export function initHeatmap(root: HTMLElement): () => void {
	const overlay = featureGroup();
	let isFirstOpen = true;
	let lmap: LMap | null = null;
	let currentOnAction: ((name: string, isToggle: boolean) => void) | null =
		null;
	let cachedData: HeatmapPoint[] = [];
	let latestActiveLocations: string[] = [];

	const containerId = "heatmap-map-container";
	const modal = MapDialog({
		id: "heatmap-modal",
		containerId,
	});

	root.appendChild(modal);

	const updateCircleStyles = () => {
		overlay.eachLayer((layer) => {
			if ("setStyle" in layer) {
				const circle = layer as Circle & { _heatmapData?: HeatmapPoint };
				const d = circle._heatmapData;
				if (!d) return;
				const isActive = latestActiveLocations.includes(d.location_name);
				circle.setStyle({
					color: isActive ? "white" : "transparent",
					weight: isActive ? 2 : 1,
					opacity: isActive ? 1 : 0.3,
					fillOpacity: 0.65,
				});
			}
		});
	};

	const onOpen = async (
		activeLocations: string[],
		onAction: (name: string, isToggle: boolean) => void,
	) => {
		latestActiveLocations = activeLocations;
		currentOnAction = onAction;
		modal.showModal();

		if (!lmap) {
			const ct = modal.querySelector(`#${containerId}`) as HTMLElement;
			lmap = initLeaflet(ct);
			overlay.addTo(lmap);
		}

		if (isFirstOpen) {
			isFirstOpen = false;
			cachedData = await fetchHeatmapData();
			if (cachedData.length > 0 && lmap) {
				renderPoints(
					lmap,
					cachedData,
					overlay,
					() => latestActiveLocations,
					(name, isToggle) => {
						if (currentOnAction) currentOnAction(name, isToggle);
						if (!isToggle) modal.close();
						else {
							const idx = latestActiveLocations.indexOf(name);
							if (idx > -1) latestActiveLocations.splice(idx, 1);
							else latestActiveLocations.push(name);
							updateCircleStyles();
						}
					},
				);
			}
		} else {
			updateCircleStyles();
		}

		lmap.invalidateSize();
		if (cachedData.length > 0) {
			const b = latLngBounds(cachedData.map((d) => [d.lat, d.lng]));
			lmap.fitBounds(b, { padding: [20, 20] });
		}
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
	group: FeatureGroup,
	getActiveLocations: () => string[],
	onSelect: (name: string, isToggle: boolean) => void,
): void {
	const ppsms = data.map((d) => d.avg_price_per_sqm);
	const min = Math.min(...ppsms);
	const max = Math.max(...ppsms);

	for (const d of data) {
		const isActive = getActiveLocations().includes(d.location_name);
		const color = getPriceColor(d.avg_price_per_sqm, min, max);
		const c = circle([d.lat, d.lng], {
			radius: 150 + Math.sqrt(d.count) * 15,
			fillColor: color,
			fillOpacity: 0.65,
			stroke: true,
			color: isActive ? "white" : "transparent",
			weight: isActive ? 2 : 1,
			opacity: isActive ? 1 : 0.3,
		}) as Circle & { _heatmapData?: HeatmapPoint };

		// Attach data for style updates
		c._heatmapData = d;

		setupCircleEvents(c, d, getActiveLocations, onSelect);

		c.addTo(group);
	}

	if (data.length > 0) {
		const b = latLngBounds(data.map((d) => [d.lat, d.lng]));
		lmap.fitBounds(b, { padding: [20, 20] });
	}
}
