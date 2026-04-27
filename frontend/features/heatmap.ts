import {
	circle,
	DomEvent,
	featureGroup,
	layerGroup,
	type LeafletMouseEvent,
	type map,
} from "leaflet";
import { bus, EVENTS, type EventPayloads } from "../core/events";
import { t } from "../core/i18n";
import type { HeatmapPoint } from "../core/types";
import { fmt, toast } from "../core/utils";
import { initLeaflet, MapDialog } from "../ui/map-base";

/**
 * Heatmap Feature
 * Visualizes spatial price distribution across districts.
 * Encapsulates its own map instance and handles data fetching & lifecycle.
 */

// ── State & Interpolation ───────────────────────────────────────────────────

/**
 * Simple linear interpolation between Green -> Yellow -> Red.
 */
function getPriceColor(val: number, min: number, max: number): string {
	const t = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));

	// Interpolation stops: [34, 197, 94] (Green) -> [234, 179, 8] (Yellow) -> [239, 68, 68] (Red)
	if (t < 0.5) {
		const u = t * 2;
		const r = Math.round(34 + (234 - 34) * u);
		const g = Math.round(197 + (179 - 197) * u);
		const b = Math.round(94 + (8 - 94) * u);
		return `rgb(${r},${g},${b})`;
	}
	const u = (t - 0.5) * 2;
	const r = Math.round(234 + (239 - 234) * u);
	const g = Math.round(179 + (68 - 179) * u);
	const b = Math.round(8 + (68 - 8) * u);
	return `rgb(${r},${g},${b})`;
}

// ── Feature Initialization ──────────────────────────────────────────────────

export function initHeatmap(root: HTMLElement): () => void {
	let lmap: ReturnType<typeof map> | null = null;
	const lgroup = layerGroup();
	const modal = MapDialog({ id: "heatmap-modal", containerId: "heatmap-ct" });

	root.appendChild(modal);

	const handleOpen = (payload: EventPayloads[typeof EVENTS.HEATMAP_OPEN]) => {
		const { activeLocations, onAction } = payload;
		modal.showModal();

		requestAnimationFrame(async () => {
			if (!lmap) {
				const mapInstance = initLeaflet("heatmap-ct");
				lmap = mapInstance;
				lgroup.addTo(mapInstance);
				restoreView(mapInstance);
				mapInstance.on("moveend", () => saveView(mapInstance));
			} else {
				lmap.invalidateSize();
			}

			try {
				const response = await fetch("/api/heatmap");
				const res = (await response.json()) as {
					error?: string;
					data?: HeatmapPoint[];
				};
				if (res.error) throw new Error(res.error);
				if (res.data) {
					renderPoints(lmap, lgroup, res.data, activeLocations, onAction, modal);
				}
			} catch (err) {
				toast((err as Error).message, true);
			}
		});
	};

	const off = bus.on(EVENTS.HEATMAP_OPEN, handleOpen);

	return () => {
		off();
		if (lmap) {
			lmap.remove();
			lmap = null;
		}
		modal.remove();
	};
}

// ── Rendering Logic ─────────────────────────────────────────────────────────

function renderPoints(
	lmap: ReturnType<typeof map>,
	lgroup: ReturnType<typeof layerGroup>,
	data: HeatmapPoint[],
	activeLocations: string[],
	onAction: (name: string, isToggle: boolean) => void,
	modal: HTMLDialogElement,
): void {
	lgroup.clearLayers();

	const prices = data.map((d) => d.avg_price_per_sqm);
	const minP = Math.min(...prices);
	const maxP = Math.max(...prices);
	const maxCount = Math.max(...data.map((d) => d.count));

	const layers: L.Circle[] = [];

	for (const d of data) {
		const isActive = activeLocations.includes(d.location_name);
		const color = getPriceColor(d.avg_price_per_sqm, minP, maxP);
		const radius = 200 + (d.count / maxCount) * 400;

		const c = circle([d.lat, d.lng], {
			radius,
			color: isActive ? "white" : color,
			fillColor: color,
			fillOpacity: 0.55,
			weight: isActive ? 4 : 1.5,
			opacity: isActive ? 1 : 0.8,
		});

		c.bindTooltip(createTooltip(d), {
			sticky: true,
			opacity: 1,
			className:
				"!bg-(--surface-3) !border-(--border-h) !rounded-(--r-sm) !shadow-[0_8px_24px_rgba(0,0,0,0.5)] !p-0 [&::before]:!hidden",
		});

		c.on("click", () => {
			modal.close();
			onAction(d.location_name, false);
		});

		c.on("contextmenu", (e: LeafletMouseEvent) => {
			DomEvent.preventDefault(e.originalEvent);
			DomEvent.stopPropagation(e.originalEvent);

			const isNowActive = toggleLocation(activeLocations, d.location_name);
			c.setStyle({
				color: isNowActive ? "white" : color,
				weight: isNowActive ? 4 : 1.5,
				opacity: isNowActive ? 1 : 0.8,
			});

			onAction(d.location_name, true);
		});

		lgroup.addLayer(c);
		layers.push(c);
	}

	// Auto-fit if no saved view exists
	if (layers.length && !localStorage.getItem("hmap-view")) {
		lmap.fitBounds(featureGroup(layers).getBounds().pad(0.12));
	}
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function createTooltip(d: HeatmapPoint): string {
	return /*html*/ `<div class="min-w-32.5 px-3.25 py-2.5">
		<div class="mb-1 text-xs font-semibold text-(--text)">${d.location_name}</div>
		<div class="text-[17px] font-bold leading-none text-(--text)">
			₼ ${fmt(d.avg_price_per_sqm, 0)}<span class="text-[11px] font-normal text-(--muted)">/m²</span>
		</div>
		<div class="mt-0.75 text-[11px] text-(--muted)">
			${d.count.toLocaleString()} ${t(d.count !== 1 ? "listings" : "listing")}
		</div>
	</div>`;
}

function toggleLocation(list: string[], name: string): boolean {
	const idx = list.indexOf(name);
	if (idx > -1) {
		list.splice(idx, 1);
		return false;
	}
	list.push(name);
	return true;
}

function saveView(lmap: ReturnType<typeof map>): void {
	localStorage.setItem(
		"hmap-view",
		JSON.stringify({ center: lmap.getCenter(), zoom: lmap.getZoom() }),
	);
}

function restoreView(lmap: ReturnType<typeof map>): void {
	try {
		const saved = JSON.parse(localStorage.getItem("hmap-view") || "null");
		if (saved) lmap.setView(saved.center, saved.zoom);
		else lmap.setView([40.38, 49.87], 11);
	} catch {
		lmap.setView([40.38, 49.87], 11);
	}
}

/**
 * Public trigger via Event Bus.
 */
export function openHeatmap(
	activeLocations: string[],
	onAction: (name: string, isToggle: boolean) => void,
): void {
	bus.emit(EVENTS.HEATMAP_OPEN, { activeLocations, onAction });
}
