import type { CardCallbacks, Property } from "../core/types";
import { fmt, timeAgo } from "../core/utils";
import { ts } from "./tier";

export function buildCard(
	p: Property,
	bm: boolean,
	cb: CardCallbacks,
): HTMLElement {
	const t = ts(p.tier);
	const barW = Math.min(100, Math.max(2, p.discount_percent * 2.5));
	const tags: string[] = [];
	if (p.is_urgent)
		tags.push(
			`<span class="tag" style="color:var(--red);border-color:var(--red-b);background:var(--red-dim)">⚡ Urgent</span>`,
		);
	if (p.has_document)
		tags.push(
			`<span class="tag" style="color:var(--blue);border-color:var(--blue-b);background:var(--blue-dim)">Document</span>`,
		);
	if (p.has_repair)
		tags.push(
			`<span class="tag" style="color:var(--green);border-color:var(--green-b);background:var(--green-dim)">Repaired</span>`,
		);
	if (p.has_mortgage)
		tags.push(
			`<span class="tag" style="color:var(--text-2);border-color:var(--border)">Mortgage</span>`,
		);
	if (p.has_active_mortgage)
		tags.push(
			`<span class="tag" style="color:var(--yellow);border-color:var(--yellow-b);background:var(--yellow-dim)">⚠ Active mortgage</span>`,
		);
	const ago = timeAgo(p.posted_date);
	if (ago)
		tags.push(
			`<span class="tag" style="color:var(--muted);border-color:var(--border)">${ago}</span>`,
		);

	const floorStr =
		p.floor != null && p.total_floors != null
			? `${p.floor}/${p.total_floors}`
			: (p.floor ?? "—");

	const el = document.createElement("article");
	el.className = "card";
	el.innerHTML = `
		<div class="card-top">
			<div style="min-width:0">
				<div class="card-loc">${p.location_name ?? p.district ?? "—"}</div>
				<div class="card-price">₼ ${fmt(p.price)}</div>
			</div>
			<div class="card-right">
				<span class="tier-badge" style="color:${t.c};background:${t.bg};border-color:${t.b}">${p.tier}</span>
				<div style="display:flex;gap:4px;align-items:center">
					<button type="button" class="bmark-btn${bm ? " on" : ""}" title="${bm ? "Remove" : "Save"}" data-url="${p.source_url}">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="${bm ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
					</button>
					<button type="button" class="hide-btn" title="Hide this listing" data-url="${p.source_url}">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
					</button>
				</div>
			</div>
		</div>
		<div class="disc-wrap">
			<div class="disc-top">
				<span class="disc-lbl">Market avg ₼${fmt(p.location_avg_price_per_sqm, 0)}/m²</span>
				<span class="disc-val" style="color:${t.c}">-${p.discount_percent}%</span>
			</div>
			<div class="disc-bar"><div class="disc-fill" style="width:${barW}%;background:${t.hex}"></div></div>
		</div>
		<div class="card-stats">
			<div class="stat-c"><div class="stat-c-lbl">Area</div><div class="stat-c-val">${fmt(p.area_sqm, 1)} m²</div></div>
			<div class="stat-c"><div class="stat-c-lbl">₼/m²</div><div class="stat-c-val">${fmt(p.price_per_sqm, 0)}</div></div>
			<div class="stat-c"><div class="stat-c-lbl">Rooms</div><div class="stat-c-val">${p.rooms ?? "—"}</div></div>
			<div class="stat-c"><div class="stat-c-lbl">Floor</div><div class="stat-c-val">${floorStr}</div></div>
		</div>
		${tags.length ? `<div class="card-tags">${tags.join("")}</div>` : ""}
		<div class="card-foot">
			<a class="card-link" href="${p.source_url}" target="_blank" rel="noopener">
				View listing
				<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
			</a>
			<div class="card-btns">
				${p.description ? `<button type="button" class="icon-btn desc-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> Desc</button>` : ""}
				${p.latitude != null ? `<button type="button" class="icon-btn map-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg> Map</button>` : ""}
			</div>
		</div>`;

	el.querySelector(".bmark-btn")!.addEventListener("click", () => cb.onBM(p));
	el.querySelector(".hide-btn")!.addEventListener("click", () =>
		cb.onHide(p.source_url),
	);
	if (p.description)
		el.querySelector(".desc-btn")!.addEventListener("click", () =>
			cb.onDesc(p.description!),
		);
	if (p.latitude != null)
		el.querySelector(".map-btn")!.addEventListener("click", () =>
			cb.onMap(p.latitude!, p.longitude!),
		);
	return el;
}

export function buildRow(
	p: Property,
	bm: boolean,
	cb: CardCallbacks,
): HTMLElement {
	const t = ts(p.tier);
	const floorStr =
		p.floor != null && p.total_floors != null
			? `${p.floor}/${p.total_floors}`
			: (p.floor ?? "—");

	const el = document.createElement("div");
	el.className = "card-row";
	el.innerHTML = `
		<div class="row-disc">
			<div style="font-size:17px;font-weight:700;color:${t.c}">-${p.discount_percent}%</div>
			<div style="font-size:10px;color:var(--muted);margin-top:2px">${p.tier.replace(" Deal", "").replace(" Price", "")}</div>
		</div>
		<div style="min-width:0">
			<div class="row-price">₼ ${fmt(p.price)} <span style="font-weight:400;color:var(--muted);font-size:12px">· ${p.location_name ?? p.district ?? "—"}</span></div>
			<div class="row-meta">${fmt(p.area_sqm, 1)} m² · ${p.rooms ?? "—"} rooms · floor ${floorStr} · ₼${fmt(p.price_per_sqm, 0)}/m²${p.is_urgent ? " · ⚡" : ""}</div>
		</div>
		<div class="row-acts">
			<button type="button" class="bmark-btn${bm ? " on" : ""}" data-url="${p.source_url}" title="Save">
				<svg width="11" height="11" viewBox="0 0 24 24" fill="${bm ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
			</button>
			<button type="button" class="hide-btn" title="Hide listing" data-url="${p.source_url}">
				<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
			</button>
			${p.latitude != null ? `<button type="button" class="icon-btn map-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></button>` : ""}
		</div>
		<a class="card-link" href="${p.source_url}" target="_blank" rel="noopener" style="white-space:nowrap">View ↗</a>`;

	el.querySelector(".bmark-btn")!.addEventListener("click", () => cb.onBM(p));
	el.querySelector(".hide-btn")!.addEventListener("click", () =>
		cb.onHide(p.source_url),
	);
	if (p.latitude != null)
		el.querySelector(".map-btn")!.addEventListener("click", () =>
			cb.onMap(p.latitude!, p.longitude!, p.location_name ?? p.district ?? ""),
		);
	return el;
}
