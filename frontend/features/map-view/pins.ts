import { type CircleMarker, circleMarker } from "leaflet";
import type { MapPin, Property } from "../../core/types";
import { fmt, fmtFloor, toast } from "../../core/utils";
import { ts } from "../../ui/tier";
import { openPropertyDetail } from "../property-detail/index";
import type { MapViewState } from "./types";

/**
 * Creates a circle marker for a map pin with hover and click handlers.
 */
export function createPinMarker(
	pin: MapPin,
	state: MapViewState,
): CircleMarker {
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
		if (state.lmap) {
			state.sharedTooltip.setContent(tipContent);
			state.sharedTooltip.setLatLng([pin.lat, pin.lng]);
			state.sharedTooltip.addTo(state.lmap);
		}
	});

	cm.on("mouseout", () => {
		cm.setRadius(7);
		state.sharedTooltip.remove();
	});

	cm.on("click", async () => {
		state.sharedTooltip.remove();
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

/**
 * Formats the tooltip content for a pin.
 */
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
