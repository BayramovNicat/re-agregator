import { state } from "../core/state";
import type { CardCallbacks, Property } from "../core/types";
import { fmt, frag, ge, hide, html, show, toast } from "../core/utils";
import { Product } from "../features/product";

export function renderStateArea(container: HTMLElement): void {
	const nodes = frag`
    <div id="trend-container"></div>
    <div id="results-bar-container"></div>

    <div id="s-loading" class="hidden">
      <div class="flex flex-col items-center justify-center py-20 px-5 gap-2.5 text-center">
        <svg class="animate-spin text-(--muted) opacity-40 mb-1" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <p class="text-base font-medium text-(--text-2)">Searching for deals…</p>
      </div>
    </div>

    <div id="s-empty" class="hidden">
      <div class="flex flex-col items-center justify-center py-20 px-5 gap-2.5 text-center">
        <svg class="text-(--muted) opacity-40 mb-1" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
          <path d="M11 8v3M11 15h.01" stroke-width="2"/>
        </svg>
        <p class="text-base font-medium text-(--text-2)">No results found</p>
        <p class="text-sm text-(--muted) max-w-75 leading-[1.6]">Try lowering the discount threshold or removing some filters.</p>
      </div>
    </div>

    <div id="s-welcome">
      <div class="flex flex-col items-center justify-center py-20 px-5 gap-2.5 text-center pt-25">
        <svg class="text-(--muted) opacity-40 mb-1" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <p class="text-base font-medium text-(--text-2)">Discover undervalued properties</p>
        <p class="text-sm text-(--muted) max-w-75 leading-[1.6]">Pick a location and discount threshold to find listings priced below the local market average.</p>
      </div>
    </div>

    <div id="cards"></div>
    <div id="scroll-sentinel"></div>
    <div id="load-more" class="hidden">
      <p class="text-xs text-(--muted) mt-2" id="load-info"></p>
    </div>
  `;
	container.appendChild(nodes);
}

// Injected by main.ts to avoid circular dep (render -> search -> render)
let _loadMoreFn: (() => void) | null = null;
export function setLoadMoreFn(fn: () => void): void {
	_loadMoreFn = fn;
}

// Card callbacks injected by main.ts (render -> map/desc avoids circular)
let _cardCb: CardCallbacks | null = null;
export function setCardCallbacks(cb: CardCallbacks): void {
	_cardCb = cb;
}

export function saveBM(): void {
	localStorage.setItem("re-bm", JSON.stringify([...state.bookmarks]));
}

export function saveHidden(): void {
	localStorage.setItem("re-hidden", JSON.stringify([...state.hidden]));
}

export function hideItem(url: string): void {
	state.hidden.add(url);
	state.bookmarks.delete(url);
	saveBM();
	saveHidden();
	toast("Item hidden");
	render();
}

export function toggleBM(p: Property): void {
	if (state.bookmarks.has(p.source_url)) {
		state.bookmarks.delete(p.source_url);
		toast("Removed from saved");
	} else {
		state.bookmarks.add(p.source_url);
		toast("★ Deal saved");
	}
	saveBM();
	render();
}

function sorted(arr: Property[]): Property[] {
	const by = (ge("sort-sel") as HTMLSelectElement).value;
	return [...arr].sort((a, b) => {
		if (by === "disc") return b.discount_percent - a.discount_percent;
		if (by === "price-asc") return a.price - b.price;
		if (by === "price-desc") return b.price - a.price;
		if (by === "area") return b.area_sqm - a.area_sqm;
		if (by === "ppsm") return a.price_per_sqm - b.price_per_sqm;
		return 0;
	});
}

function setupScrollObserver(): void {
	if (state.scrollObserver) state.scrollObserver.disconnect();
	const sentinel = ge("scroll-sentinel");
	if (!sentinel) return;
	state.scrollObserver = new IntersectionObserver(
		(entries) => {
			if (
				entries[0]?.isIntersecting &&
				!state.showingSaved &&
				state.allResults.length < state.currentTotal
			) {
				_loadMoreFn?.();
			}
		},
		{ rootMargin: "600px" },
	);
	state.scrollObserver.observe(sentinel);
}

export function render(): void {
	const ct = ge("cards");
	ct.innerHTML = "";

	let list = state.showingSaved
		? state.savedOnlyResults.filter((p) => state.bookmarks.has(p.source_url))
		: state.allResults.filter((p) => !state.hidden.has(p.source_url));
	list = sorted(list);

	if (!list.length) {
		hide("results-bar");
		show("s-empty");
		return;
	}

	show("results-bar");
	hide("s-empty");

	const wrap = html`<div
    class="${
			state.currentView === "grid"
				? "grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[580px]:grid-cols-1"
				: "flex flex-col gap-2"
		}"
  ></div>`;

	const callbacks = _cardCb;
	if (!callbacks) {
		throw new Error("Card callbacks not set");
	}
	let newCount = 0;
	for (const property of list) {
		const bookmarked = state.bookmarks.has(property.source_url);
		const el = Product({
			property,
			bookmarked,
			view: state.currentView as "grid" | "row",
			callbacks,
		});
		if (state.renderedSet.has(property.source_url)) {
			el.style.animation = "none";
		} else {
			el.style.animationDelay = `${Math.min(newCount, 15) * 22}ms`;
			state.renderedSet.add(property.source_url);
			newCount++;
		}
		wrap.appendChild(el);
	}
	ct.appendChild(wrap);

	const showing = list.length;
	ge("results-meta").innerHTML = state.showingSaved
		? `<strong>${showing}</strong> saved deal${showing !== 1 ? "s" : ""}`
		: `<strong>${showing}</strong> result${showing !== 1 ? "s" : ""}${state.currentTotal > state.allResults.length ? ` <span style="color:var(--muted)">· ${fmt(state.currentTotal)} total</span>` : ""}`;

	if (!state.showingSaved && state.allResults.length < state.currentTotal) {
		show("load-more");
		ge("load-info").textContent =
			`Showing ${state.allResults.length} of ${fmt(state.currentTotal)}`;
		setupScrollObserver();
	} else {
		hide("load-more");
		if (state.scrollObserver) {
			state.scrollObserver.disconnect();
			state.scrollObserver = null;
		}
	}

	if (state.bookmarks.size > 0) {
		show("saved-btn", "inline-flex");
		ge("saved-badge").textContent = String(state.bookmarks.size);
	} else {
		hide("saved-btn");
	}
}
