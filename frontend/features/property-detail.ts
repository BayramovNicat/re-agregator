import { divIcon, type map, marker } from "leaflet";
import { bus, EVENTS } from "../core/events";
import { t } from "../core/i18n";
import type { PriceHistoryEntry, Property } from "../core/types";
import { fmt, fmtFloor, getLocale, html, timeAgo, tTier } from "../core/utils";
import { Button } from "../ui/button";
import { Tag } from "../ui/chip";
import { Dialog } from "../ui/dialog";
import { Gallery } from "../ui/gallery";
import { Icons } from "../ui/icons";
import { initLeaflet } from "../ui/map-base";
import { StatBox } from "../ui/stat-box";
import { ts } from "../ui/tier";
import { openGallery } from "../dialogs/gallery";

/**
 * Renders a price history sparkline using a declarative SVG template.
 */
function PriceHistoryChart(
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

/**
 * Unified property detail modal controller.
 * Manages data binding, map initialization, and user interactions.
 */
export function initPropertyDetail(root: HTMLElement): () => void {
	let currentProperty: Property | null = null;
	let lmap: ReturnType<typeof map> | null = null;
	let lmark: ReturnType<typeof marker> | null = null;

	// ── UI Components & Refs ───────────────────────────────────────────────────

	const gallery = Gallery({
		onExpand: () => {
			if (currentProperty?.image_urls) {
				openGallery(currentProperty.image_urls, gallery.getIndex());
			}
		},
	});

	// Header elements
	const locationEl = html`<div class="text-xs text-(--muted) truncate"></div>`;
	const postedEl = html`<div class="text-xs text-(--muted) shrink-0"></div>`;
	const priceEl = html`<span class="text-2xl font-bold tracking-tight"></span>`;
	const tierEl = html`<span
		class="inline-flex items-center text-[10px] font-semibold tracking-wider px-2 py-0.75 rounded-full border border-current whitespace-nowrap"
	></span>`;

	// Stats & Tags
	const statsEl = html`<div class="grid grid-cols-4 gap-2 mb-3"></div>`;
	const mktAvgEl = html`<span class="text-(--text-2) font-medium"></span>`;
	const discPctEl = html`<span class="text-sm font-bold"></span>`;
	const discBarEl = html`<div
		class="h-full rounded-full transition-[width] duration-500 ease-out"
		style="width:0%"
	></div>`;
	const tagsEl = html`<div
		class="flex flex-wrap gap-1.25 mt-3 empty:hidden"
	></div>`;

	// Content Sections
	const historyChartEl = html`<div></div>`;
	const historySecEl = html`
		<div class="px-5 py-4 border-b border-(--border) hidden">
			<div
				class="text-xs font-semibold text-(--muted) uppercase tracking-wider mb-2.5"
			>
				${t("priceHistory")}
			</div>
			${historyChartEl}
		</div>
	`;

	const descBodyEl = html`<p
		class="text-sm text-(--text-2) leading-[1.75] whitespace-pre-wrap"
	></p>`;
	const descSecEl = html`
		<div class="px-5 py-4 border-b border-(--border) hidden">
			<div
				class="text-xs font-semibold text-(--muted) uppercase tracking-wider mb-2"
			>
				${t("btnDescription")}
			</div>
			${descBodyEl}
		</div>
	`;

	const mapCtEl = html`<div class="w-full h-65"></div>`;
	const mapSecEl = html`<div class="border-b border-(--border) hidden">
		${mapCtEl}
	</div>`;

	// Footer Actions
	const linkEl = html`<a
		href="#"
		target="_blank"
		rel="noopener"
		class="inline-flex items-center gap-1.25 text-xs text-(--muted) transition-colors hover:text-(--text)"
	>
		${t("viewListing")} ${Icons.external(10)}
	</a>` as HTMLAnchorElement;

	const shareBtn = Button({
		content: html`${Icons.external(10)} <span>${t("btnShare")}</span>`,
		variant: "padded",
		color: "indigo",
		onclick: () => {
			if (!currentProperty) return;
			const url = currentProperty.source_url;
			const flash = (msg: string) => {
				const span = shareBtn.querySelector("span");
				if (!span) return;
				const prev = span.textContent;
				span.textContent = msg;
				setTimeout(() => (span.textContent = prev), 2000);
			};

			if (navigator.share) {
				navigator
					.share({ url, title: currentProperty.location_name ?? "Property" })
					.then(() => flash(t("shareCopied")))
					.catch(() =>
						navigator.clipboard
							.writeText(url)
							.then(() => flash(t("shareCopied"))),
					);
			} else {
				navigator.clipboard.writeText(url).then(() => flash(t("shareCopied")));
			}
		},
	});

	const bmarkBtn = Button({
		content: html`${Icons.bookmark({ size: 12, fill: false })}
			<span>${t("btnSave")}</span>`,
		variant: "padded",
		color: "indigo",
		onclick: () => {
			if (currentProperty)
				modal.dispatchEvent(
					new CustomEvent("pd:bmark", {
						bubbles: true,
						detail: currentProperty,
					}),
				);
		},
	});

	const hideBtn = Button({
		content: html`${Icons.hide(12)} <span>${t("btnHide")}</span>`,
		variant: "padded",
		color: "red",
		onclick: () => {
			if (currentProperty) {
				modal.dispatchEvent(
					new CustomEvent("pd:hide", {
						bubbles: true,
						detail: currentProperty,
					}),
				);
				modal.close();
			}
		},
	});

	// ── Layout Construction ────────────────────────────────────────────────────

	const bodyEl = html`
		<div class="overflow-y-auto flex-1 min-h-0">
			${gallery}
			<div class="px-5 pt-4 pb-3 border-b border-(--border)">
				<div class="flex items-center justify-between gap-3 mb-1">
					${locationEl} ${postedEl}
				</div>
				<div class="flex items-center gap-2.5">${priceEl} ${tierEl}</div>
			</div>
			<div class="px-5 py-4 border-b border-(--border)">
				${statsEl}
				<div class="flex items-center justify-between mb-1.5">
					<span class="text-xs text-(--muted)"
						>${t("propMarketAvg")} ${mktAvgEl}</span
					>
					${discPctEl}
				</div>
				<div class="h-1 bg-(--surface-3) rounded-full overflow-hidden">
					${discBarEl}
				</div>
				${tagsEl}
			</div>
			${historySecEl} ${descSecEl} ${mapSecEl}
		</div>
	`;

	const modal = Dialog({
		id: "prop-detail-modal",
		maxWidth: "900px",
		showClose: true,
		className: "text-(--text)",
		content: html`
			<div class="flex flex-col h-full min-h-0">
				${bodyEl}
				<div
					class="px-5 py-3 flex items-center justify-between gap-3 border-t border-(--border) bg-(--surface) shrink-0"
				>
					${linkEl}
					<div class="flex items-center gap-1.5">
						${shareBtn} ${bmarkBtn} ${hideBtn}
					</div>
				</div>
			</div>
		`,
	});

	// ── Data Binding Logic ─────────────────────────────────────────────────────

	function open(p: Property): void {
		currentProperty = p;
		const tier = ts(p.tier);

		// 1. Gallery & Header
		gallery.setUrls(p.image_urls ?? []);
		locationEl.textContent = p.location_name ?? p.district ?? "—";
		priceEl.textContent = `₼ ${fmt(p.price)}`;
		tierEl.textContent = tTier(p.tier);
		tierEl.style.cssText = `color:${tier.c};background:${tier.bg};border-color:${tier.b}`;
		tierEl.title =
			p.discount_percent >= 0
				? t("tierTipBelow", {
						n: String(Math.abs(Math.round(p.discount_percent))),
					})
				: t("tierTipAbove", {
						n: String(Math.abs(Math.round(p.discount_percent))),
					});

		const ago = p.posted_date ? timeAgo(p.posted_date) : "";
		postedEl.textContent = ago ? `${t("propPosted")} ${ago}` : "";

		// 2. Statistics Grid
		statsEl.replaceChildren();
		const statData = [
			{ label: t("area"), value: `${fmt(p.area_sqm, 1)} m²` },
			{ label: t("ppsm"), value: `₼${fmt(p.price_per_sqm, 0)}` },
			{ label: t("rooms"), value: p.rooms ?? "—" },
			{ label: t("floor"), value: fmtFloor(p.floor, p.total_floors) },
		];
		statData.forEach((s) => {
			statsEl.appendChild(StatBox(s));
		});

		// 3. Discount Visualization
		mktAvgEl.textContent = `₼${fmt(p.location_avg_price_per_sqm, 0)}/m²`;
		discPctEl.textContent = `${p.discount_percent >= 0 ? "-" : "+"}${Math.abs(p.discount_percent)}%`;
		discPctEl.style.color = tier.c;
		discBarEl.style.width = `${Math.min(100, Math.max(2, p.discount_percent * 2.5))}%`;
		discBarEl.style.background = tier.hex;

		// 4. Feature Tags
		tagsEl.replaceChildren();
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
				tagsEl.appendChild(
					Tag({ label: f.label, icon: f.icon, className: f.cls }),
				);
			});

		// 5. Sections (Map, History, Description)
		if (p.latitude && p.longitude) {
			const { latitude: lat, longitude: lng } = p;
			mapSecEl.classList.remove("hidden");
			requestAnimationFrame(() => {
				if (lmap && lmark) {
					lmap.invalidateSize();
					lmark.setLatLng([lat, lng]);
					lmap.setView([lat, lng], 15, { animate: false });
				}
			});
		} else {
			mapSecEl.classList.add("hidden");
		}

		if (p.price_history && p.price_history.length >= 2) {
			historySecEl.classList.remove("hidden");
			historyChartEl.replaceChildren(
				PriceHistoryChart(p.price_history, tier.hex, getLocale()),
			);
		} else {
			historySecEl.classList.add("hidden");
		}

		if (p.description) {
			descSecEl.classList.remove("hidden");
			descBodyEl.textContent = p.description;
		} else {
			descSecEl.classList.add("hidden");
		}

		// 6. Finalize
		linkEl.href = p.source_url;
		modal.showModal();
		setTimeout(() => (bodyEl.scrollTop = 0), 0);
	}

	// ── Interaction Handlers ───────────────────────────────────────────────────

	const onKey = (e: KeyboardEvent) => {
		if (e.key === "ArrowLeft") gallery.navigate(-1);
		if (e.key === "ArrowRight") gallery.navigate(1);
	};
	modal.addEventListener("keydown", onKey);

	root.appendChild(modal);

	// Eagerly init map (Leaflet requires the container to be in DOM)
	mapSecEl.classList.remove("hidden");
	mapSecEl.style.visibility = "hidden";
	lmap = initLeaflet(mapCtEl);
	const mapIcon = divIcon({
		className: "",
		html: /*html*/ `<div class="w-3 h-3 rounded-full bg-(--green) border-2 border-(--bg) animate-[mpulse_2s_ease-out_infinite]"></div>`,
		iconSize: [12, 12],
		iconAnchor: [6, 6],
	});
	lmark = marker([0, 0], { icon: mapIcon }).addTo(lmap);
	mapSecEl.classList.add("hidden");
	mapSecEl.style.visibility = "";

	const offOpen = bus.on(EVENTS.PROPERTY_OPEN, (p) => open(p));

	return () => {
		modal.removeEventListener("keydown", onKey);
		offOpen();
		if (lmap) {
			lmap.remove();
			lmap = null;
			lmark = null;
		}
		modal.remove();
	};
}

export function openPropertyDetail(p: import("../core/types").Property): void {
	bus.emit(EVENTS.PROPERTY_OPEN, p);
}
