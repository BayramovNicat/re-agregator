import {
	type CircleMarker,
	circleMarker,
	featureGroup,
	type map as LeafletMap,
	tooltip as leafletTooltip,
} from "leaflet";
import { bus, EVENTS } from "../core/events";
import { t } from "../core/i18n";
import { state } from "../core/state";
import type { MapPin, Property } from "../core/types";
import { debounce, fmt, fmtFloor, frag, toast, tTier } from "../core/utils";
import { initLeaflet } from "../ui/map-base";
import { ts } from "../ui/tier";
import { openPropertyDetail } from "./property-detail";

let lmap: ReturnType<typeof LeafletMap> | null = null;
const pinGroup = featureGroup();
let mapContainer: HTMLElement | null = null;
let abortController: AbortController | null = null;
let fitDone = false;

const sharedTooltip = leafletTooltip({
	sticky: false,
	direction: "top",
	opacity: 1,
	className:
		"!bg-(--surface-3) !border-(--border-h) !rounded-(--r-sm) !shadow-[0_8px_24px_rgba(0,0,0,0.5)] !p-0 [&::before]:!hidden",
});

function getTooltipContent(pin: MapPin, tStyle: { hex: string; c: string }) {
	const discSign = pin.discount_percent >= 0 ? "-" : "+";
	const discAbs = Math.abs(Math.round(pin.discount_percent));
	const floorStr = fmtFloor(pin.floor, pin.total_floors);
	const meta = [
		pin.area_sqm ? `${fmt(pin.area_sqm, 0)} m²` : null,
		pin.rooms ? `${pin.rooms}br` : null,
		floorStr ? `fl ${floorStr}` : null,
	]
		.filter(Boolean)
		.join(" · ");

	const thumbHtml = pin.image_url
		? `<img src="${pin.image_url}" style="width:52px;height:52px;object-fit:cover;flex-shrink:0;border-radius:5px">`
		: "";

	return /*html*/ `<div style="padding:10px 12px;min-width:180px;max-width:240px">
		<div style="display:flex;align-items:flex-start;gap:8px">
			${thumbHtml}
			<div style="min-width:0;flex:1">
				<div style="margin-bottom:4px">
					<div style="font-size:15px;font-weight:700;color:var(--text);line-height:1.2">
						₼ ${fmt(pin.price)}
					</div>
				</div>
				<div style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px">
					<span>₼${fmt(pin.price_per_sqm, 0)}/m²</span>
					<span style="color:${tStyle.c};font-weight:700">${discSign}${discAbs}%</span>
				</div>
				${meta ? `<div style="font-size:10px;color:var(--muted);margin-top:2px">${meta}</div>` : ""}
			</div>
		</div>
	</div>`;
}

function createPinMarker(pin: MapPin): CircleMarker {
	const tStyle = ts(pin.tier);
	const cm = circleMarker([pin.lat, pin.lng], {
		radius: 7,
		color: tStyle.hex,
		fillColor: tStyle.hex,
		fillOpacity: 0.82,
		weight: 1.5,
		opacity: 1,
	});

	const tipContent = getTooltipContent(pin, tStyle);

	cm.on("mouseover", () => {
		cm.setRadius(10);
		if (lmap) {
			sharedTooltip.setContent(tipContent);
			sharedTooltip.setLatLng([pin.lat, pin.lng]);
			sharedTooltip.addTo(lmap);
		}
	});

	cm.on("mouseout", () => {
		cm.setRadius(7);
		sharedTooltip.remove();
	});

	cm.on("click", async () => {
		sharedTooltip.remove();
		try {
			const r = await fetch("/api/deals/by-urls", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ urls: [pin.source_url] }),
			});
			const json = (await r.json()) as { data?: Property[] };
			if (json.data?.[0]) openPropertyDetail(json.data[0]);
		} catch (e) {
			if ((e as Error).name !== "AbortError") toast((e as Error).message, true);
		}
	});

	return cm;
}

const fetchAndRender = debounce(async () => {
	if (!lmap) return;
	const params = new URLSearchParams(window.location.search);
	if (!params.get("location")) return;

	if (abortController) abortController.abort();
	abortController = new AbortController();

	fitDone = false;
	pinGroup.clearLayers();

	try {
		const res = await fetch(`/api/deals/map-pins?${params}`, {
			signal: abortController.signal,
		});
		const d = (await res.json()) as {
			error?: string;
			count?: number;
			data?: MapPin[];
		};

		if (d.error) {
			toast(d.error, true);
			return;
		}

		const pins = d.data ?? [];
		for (const pin of pins) {
			const cm = createPinMarker(pin);
			cm.addTo(pinGroup);
		}

		if (pins.length > 0 && !fitDone && lmap) {
			fitDone = true;
			lmap.fitBounds(pinGroup.getBounds().pad(0.12));
		}

		updateResultsMeta(pins);
	} catch (e) {
		if ((e as Error).name !== "AbortError") toast((e as Error).message, true);
	} finally {
		abortController = null;
	}
}, 150);

function updateResultsMeta(pins: MapPin[]) {
	const meta = state.refs.resultsMeta;
	if (!meta) return;

	if (pins.length === 0) {
		meta.replaceChildren(
			frag`<span style="color:var(--muted)">${t("noResults")}</span>`,
		);
		return;
	}

	const total = pins.length;
	const tierCounts = pins.reduce<Record<string, number>>((acc, p) => {
		acc[p.tier] = (acc[p.tier] ?? 0) + 1;
		return acc;
	}, {});

	const tierBadges = [
		{ tier: "High Value Deal", color: "var(--green)" },
		{ tier: "Good Deal", color: "var(--blue)" },
		{ tier: "Fair Price", color: "var(--yellow)" },
		{ tier: "Overpriced", color: "var(--red)" },
	];

	const distStr = tierBadges
		.filter((tb) => tierCounts[tb.tier])
		.map(
			(tb) =>
				`<span style="color:${tb.color}">${tierCounts[tb.tier]} ${tTier(tb.tier, true)}</span>`,
		)
		.join(' <span style="color:var(--border)">·</span> ');

	meta.replaceChildren(
		frag`<strong>${fmt(total, 0)}</strong> ${
			total !== 1 ? t("results") : t("result")
		}${distStr ? ` <span style="color:var(--border)">·</span> ${distStr}` : ""}`,
	);
}

export function initMapView(container: HTMLElement): () => void {
	mapContainer = container;

	const offDeals = bus.on(EVENTS.DEALS_UPDATED, () => {
		if (state.currentView === "map") {
			fitDone = false;
			void fetchAndRender();
		}
	});

	return () => {
		offDeals();
		if (abortController) abortController.abort();
		pinGroup.clearLayers();
		sharedTooltip.remove();
		if (lmap) {
			lmap.remove();
			lmap = null;
		}
		mapContainer = null;
	};
}

export function showMapView(): void {
	if (!mapContainer) return;
	mapContainer.style.display = "";

	if (!lmap) {
		lmap = initLeaflet(mapContainer);
		lmap.setView([40.38, 49.87], 12);
		pinGroup.addTo(lmap);
	} else {
		lmap.invalidateSize();
	}

	void fetchAndRender();
}

export function hideMapView(): void {
	if (mapContainer) mapContainer.style.display = "none";
}
