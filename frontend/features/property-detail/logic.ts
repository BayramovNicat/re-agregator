import { divIcon, marker } from "leaflet";
import { t } from "../../core/i18n";
import type { Property } from "../../core/types";
import { fmt, fmtFloor, getLocale, timeAgo, tTier } from "../../core/utils";
import { Tag } from "../../ui/chip";
import { initLeaflet } from "../../ui/map-base";
import { StatBox } from "../../ui/stat-box";
import { ts } from "../../ui/tier";
import { PriceHistoryChart } from "./chart";
import type { PropertyDetailUI } from "./types";

/**
 * Updates the UI with data from a specific property.
 */
export function bindPropertyData(ui: PropertyDetailUI, p: Property): void {
	ui.currentProperty = p;
	const tier = ts(p.tier);

	// 1. Gallery & Header
	ui.gallery.setUrls(p.image_urls ?? []);
	ui.locationEl.textContent = p.location_name ?? p.district ?? "—";
	ui.priceEl.textContent = `₼ ${fmt(p.price)}`;
	ui.tierEl.textContent = tTier(p.tier);
	ui.tierEl.style.cssText = `color:${tier.c};background:${tier.bg};border-color:${tier.b}`;
	ui.tierEl.title =
		p.discount_percent >= 0
			? t("tierTipBelow", {
					n: String(Math.abs(Math.round(p.discount_percent))),
				})
			: t("tierTipAbove", {
					n: String(Math.abs(Math.round(p.discount_percent))),
				});

	const ago = p.posted_date ? timeAgo(p.posted_date) : "";
	ui.postedEl.textContent = ago ? `${t("propPosted")} ${ago}` : "";

	// 2. Statistics Grid
	ui.statsEl.replaceChildren();
	const statData = [
		{ label: t("area"), value: fmt(p.area_sqm, 1) },
		{ label: t("ppsm"), value: `₼${fmt(p.price_per_sqm, 0)}` },
		{ label: t("rooms"), value: p.rooms ?? "—" },
		{ label: t("floor"), value: fmtFloor(p.floor, p.total_floors) },
	];
	statData.forEach((s) => {
		ui.statsEl.appendChild(StatBox(s));
	});

	// 3. Discount Visualization
	ui.mktAvgEl.textContent = `₼${fmt(p.location_avg_price_per_sqm, 0)}/m²`;
	ui.discPctEl.textContent = `${p.discount_percent >= 0 ? "-" : "+"}${Math.abs(p.discount_percent)}%`;
	ui.discPctEl.style.color = tier.c;

	// 4. Feature Tags
	ui.tagsEl.replaceChildren();
	const features = [
		{
			if: p.is_urgent,
			icon: "⚡",
			label: t("tagUrgent"),
			cls: "text-(--red) border-(--red-b) bg-(--red-dim)",
		},
		{
			if: p.has_document,
			label: t("tagDocument"),
			cls: "text-(--blue) border-(--blue-b) bg-(--blue-dim)",
		},
		{
			if: p.has_repair,
			label: t("tagRepaired"),
			cls: "text-(--green) border-(--green-b) bg-(--green-dim)",
		},
		{
			if: p.has_mortgage,
			label: t("tagMortgage"),
			cls: "text-(--muted) border-(--border)",
		},
		{
			if: p.has_active_mortgage,
			icon: "⚠",
			label: t("tagActiveMortgage"),
			cls: "text-(--yellow) border-(--yellow-b) bg-(--yellow-dim)",
		},
	];
	features
		.filter((f) => f.if)
		.forEach((f) => {
			ui.tagsEl.appendChild(
				Tag({ label: f.label, icon: f.icon, className: f.cls }),
			);
		});

	// 5. Sections (Map, History, Description)
	if (p.latitude && p.longitude) {
		const { latitude: lat, longitude: lng } = p;
		ui.mapSecEl.classList.remove("hidden");
		requestAnimationFrame(() => {
			if (ui.lmap && ui.lmark) {
				ui.lmap.invalidateSize();
				ui.lmark.setLatLng([lat, lng]);
				ui.lmap.setView([lat, lng], 15, { animate: false });
			}
		});
	} else {
		ui.mapSecEl.classList.add("hidden");
	}

	if (p.price_history && p.price_history.length >= 2) {
		ui.historySecEl.classList.remove("hidden");
		ui.historyChartEl.replaceChildren(
			PriceHistoryChart(p.price_history, tier.hex, getLocale()),
		);
	} else {
		ui.historySecEl.classList.add("hidden");
	}

	if (p.description) {
		ui.descSecEl.classList.remove("hidden");
		ui.descBodyEl.textContent = p.description;
	} else {
		ui.descSecEl.classList.add("hidden");
	}

	// 6. Finalize
	ui.linkEl.href = p.source_url;
}

/**
 * Initializes the Leaflet map and marker.
 */
export function initMap(ui: PropertyDetailUI): void {
	// Eagerly init map (Leaflet requires the container to be in DOM)
	ui.mapSecEl.classList.remove("hidden");
	ui.mapSecEl.style.visibility = "hidden";
	ui.lmap = initLeaflet(ui.mapCtEl);
	const mapIcon = divIcon({
		className: "",
		html: /*html*/ `<div class="w-3 h-3 rounded-full bg-(--green) border-2 border-(--bg) animate-[mpulse_2s_ease-out_infinite]"></div>`,
		iconSize: [12, 12],
		iconAnchor: [6, 6],
	});
	ui.lmark = marker([0, 0], { icon: mapIcon }).addTo(ui.lmap);
	ui.mapSecEl.classList.add("hidden");
	ui.mapSecEl.style.visibility = "";
}
