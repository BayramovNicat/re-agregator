import { bus, EVENTS } from "../core/events";
import { t } from "../core/i18n";
import { state } from "../core/state";
import type { CardCallbacks, Property } from "../core/types";
import {
	fmt,
	frag,
	hide,
	html,
	makeEventManager,
	show,
	toast,
	trust,
	tTier,
} from "../core/utils";
import { openGallery } from "../dialogs/gallery";
import { openPropertyDetail } from "./property-detail";
import { Button, RawButton } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Icons } from "../ui/icons";
import { Product } from "../ui/product";
import { Select } from "../ui/select";
import { hideMapView, initMapView, showMapView } from "./map-view";

/**
 * Products feature manages the results area, including sorting,
 * view toggles, saved deals, and the infinite scroll list.
 */

export function initProducts(container: HTMLElement): () => void {
	// --- 1. Pure Logic & State Helpers ---

	function sortDeals(list: Property[], sortBy: string): Property[] {
		const Sorters: Record<string, (a: Property, b: Property) => number> = {
			disc: (a, b) => b.discount_percent - a.discount_percent,
			drops: (a, b) => (b.price_drop_count ?? 0) - (a.price_drop_count ?? 0),
			new: (a, b) =>
				new Date(b.posted_date ?? 0).getTime() -
				new Date(a.posted_date ?? 0).getTime(),
			"price-asc": (a, b) => a.price - b.price,
			"price-desc": (a, b) => b.price - a.price,
			area: (a, b) => b.area_sqm - a.area_sqm,
			ppsm: (a, b) => a.price_per_sqm - b.price_per_sqm,
		};
		const sorter = Sorters[sortBy];
		return sorter ? [...list].sort(sorter) : list;
	}

	function syncStateToStorage(): void {
		const bmDataObj = Object.fromEntries(state.bookmarkData);
		localStorage.setItem("re-bm-data", JSON.stringify(bmDataObj));
		localStorage.setItem("re-bm", JSON.stringify([...state.bookmarks]));
		localStorage.setItem("re-hidden", JSON.stringify([...state.hidden]));
	}

	function toggleBM(p: Property): void {
		const isBM = state.bookmarks.has(p.source_url);
		if (isBM) {
			state.bookmarks.delete(p.source_url);
			state.bookmarkData.delete(p.source_url);
		} else {
			state.bookmarks.add(p.source_url);
			state.bookmarkData.set(p.source_url, p);
		}
		toast(t(isBM ? "toastRemoved" : "toastSaved"));
		syncStateToStorage();
		bus.emit(EVENTS.DEALS_UPDATED);
	}

	function hideItem(url: string): void {
		state.hidden.add(url);
		state.bookmarks.delete(url);
		state.bookmarkData.delete(url);
		syncStateToStorage();
		toast(t("toastHidden"));
		bus.emit(EVENTS.DEALS_UPDATED);
	}

	function getPropertyTags(p: Property): string[] {
		const tags: string[] = [];
		if (p.is_urgent) tags.push("Urgent");
		if (p.has_document) tags.push("Document");
		if (p.has_repair) tags.push("Repaired");
		if (p.has_mortgage) tags.push("Mortgage eligible");
		if (p.has_active_mortgage) tags.push("Active mortgage");
		if (p.price_drop_count && p.price_drop_count > 0)
			tags.push(`Price dropped ${p.price_drop_count}×`);
		return tags;
	}

	function handleExport(): void {
		const sortBy = sortSel.value || "disc";
		const list = sortDeals(
			state.showingSaved
				? state.savedOnlyResults.filter((p) =>
						state.bookmarks.has(p.source_url),
					)
				: state.allResults.filter((p) => !state.hidden.has(p.source_url)),
			sortBy,
		);

		if (!list.length) return;

		const lines: string[] = [
			`REDEAL PROPERTY EXPORT — ${list.length} listings`,
			`Exported: ${new Date().toISOString()}`,
			"",
		];

		list.forEach((p, i) => {
			const tags = getPropertyTags(p);
			const loc = `${p.location_name ?? "Unknown"}${p.district && p.district !== p.location_name ? ` (${p.district})` : ""}`;
			const details = [
				p.rooms !== undefined && `${p.rooms} rooms`,
				p.floor !== undefined &&
					`Floor ${p.floor}${p.total_floors ? `/${p.total_floors}` : ""}`,
			]
				.filter(Boolean)
				.join(" | ");

			lines.push(`--- [${i + 1}] ---`);
			lines.push(`Location: ${loc}`);
			lines.push(
				`Price: ₼${fmt(p.price)} | Area: ${p.area_sqm}m² | ₼/m²: ${fmt(p.price_per_sqm)}`,
			);
			lines.push(
				`Market avg ₼/m²: ${fmt(p.location_avg_price_per_sqm)} | Discount: ${Number(p.discount_percent).toFixed(1)}% (${p.tier})`,
			);
			if (details) lines.push(`Details: ${details}`);
			if (tags.length) lines.push(`Tags: ${tags.join(", ")}`);
			if (p.posted_date)
				lines.push(`Posted: ${new Date(p.posted_date).toLocaleDateString()}`);
			if (p.description?.trim())
				lines.push(`Description: ${p.description.trim()}`);
			lines.push(`URL: ${p.source_url}`, "");
		});

		const text = lines.join("\n");
		navigator.clipboard
			.writeText(text)
			.then(() => toast(t("exportCopied")))
			.catch(() => {
				const blob = new Blob([text], { type: "text/plain" });
				const a = document.createElement("a");
				a.href = URL.createObjectURL(blob);
				a.download = `redeal-export-${Date.now()}.txt`;
				a.click();
			});
	}

	// --- 2. UI Components & References ---

	const resultsMeta = html`<div
		class="text-sm text-(--text-2) [&_strong]:text-(--text) [&_strong]:font-semibold"
	></div>`;

	const savedBadge = html`<span></span>`;
	const savedBtn = Button({
		className: "hidden",
		content: frag`${Icons.bookmark({ size: 12, fill: false })} ${t("saved")} ${savedBadge}`,
		onclick: handleSavedClick,
	});

	const sortSel = Select({
		name: "sort-by",
		variant: "xs",
		ariaLabel: t("sortBy"),
		title: t("sortBy"),
		options: [
			{ value: "disc", label: t("sortDisc") },
			{ value: "drops", label: t("sortDrops") },
			{ value: "new", label: t("sortNew") },
			{ value: "price-asc", label: t("sortPriceAsc") },
			{ value: "price-desc", label: t("sortPriceDesc") },
			{ value: "area", label: t("sortArea") },
			{ value: "ppsm", label: t("sortPpsm") },
		],
	});

	const vgrid = Button({
		variant: "square",
		color: "indigo",
		active: state.currentView === "grid",
		title: t("gridView"),
		content: Icons.grid(13),
		onclick: () => setView("grid"),
	});
	const vlist = Button({
		variant: "square",
		color: "indigo",
		active: state.currentView === "list",
		title: t("listView"),
		content: Icons.list(13),
		onclick: () => setView("list"),
	});
	const vmapview = Button({
		variant: "square",
		color: "indigo",
		active: state.currentView === "map",
		title: t("mapView"),
		content: Icons.mapPins(13),
		onclick: () => setView("map"),
	});

	const resultsBarInner = html`
		<div
			class="flex items-center justify-between mb-2 p-2 gap-2.5 flex-wrap"
			style="display: none"
		>
			${resultsMeta}
			<div class="flex items-center gap-1.75">
				${Button({
					title: t("exportBtn"),
					content: frag`${Icons.download(12)} ${t("exportBtn")}`,
					color: "blue",
					onclick: handleExport,
				})}
				${Button({
					title: t("telegramAlerts"),
					content: frag`${Icons.bell(12)} ${t("alertMe")}`,
					color: "yellow",
					onclick: () => bus.emit(EVENTS.ALERTS_OPEN),
				})}
				${savedBtn} ${sortSel} ${vgrid} ${vlist} ${vmapview}
			</div>
		</div>
	`;

	const resultsBarContainer = html`
		<div class="sticky top-0 z-10" style="background:var(--bg)">
			${resultsBarInner}
		</div>
	`;

	const loading = EmptyState({
		icon: Icons.spinner({
			size: 26,
			className: "animate-spin text-(--muted) opacity-40 mb-1",
		}),
		title: t("searching"),
	});

	const empty = EmptyState({
		icon: Icons.noResults({
			size: 42,
			strokeWidth: 1.4,
			className: "text-(--muted) opacity-40 mb-1",
		}),
		title: t("noResults"),
		subtitle: t("noResultsSub"),
	});

	const welcome = EmptyState({
		icon: Icons.home({
			size: 52,
			strokeWidth: 1.1,
			className: "text-(--muted) opacity-40 mb-1",
		}),
		title: t("welcome"),
		subtitle: t("welcomeSub"),
		hidden: false,
		padTop: true,
	});

	const cards = html`<div></div>`;
	const sentinel = html`<div></div>`;
	const loadMore = html`<div class="hidden"></div>`;
	const mapViewCt = html`<div
		style="display:none;height:calc(100vh - 280px);min-height:420px"
		class="rounded-(--r-lg) overflow-hidden border border-(--border)"
	></div>`;

	// Populate global refs for other features (e.g. search)
	state.refs.cards = cards;
	state.refs.loading = loading;
	state.refs.empty = empty;
	state.refs.welcome = welcome;
	state.refs.resultsBar = resultsBarInner;
	state.refs.resultsMeta = resultsMeta;
	state.refs.loadMore = loadMore;
	state.refs.savedBtn = savedBtn;

	container.appendChild(
		frag`${resultsBarContainer}${loading}${empty}${welcome}${cards}${sentinel}${loadMore}${mapViewCt}`,
	);

	// --- 3. Initialization ---

	const cleanupMapView = initMapView(mapViewCt);

	const backToTopBtn = RawButton({
		ariaLabel: t("backToTop"),
		className:
			"fixed bottom-5 right-5 z-40 w-9 h-9 rounded-full bg-(--surface-3) border border-(--border) text-(--muted) flex items-center justify-center shadow-lg transition-all duration-200 hover:text-(--text) hover:border-(--border-h) opacity-0 pointer-events-none text-[14px]",
		content: "↑",
		onclick: () => window.scrollTo({ top: 0, behavior: "instant" }),
	});
	document.body.appendChild(backToTopBtn);

	const onScroll = () => {
		const isScrolled = window.scrollY > 450;
		backToTopBtn.style.opacity = isScrolled ? "1" : "0";
		backToTopBtn.style.pointerEvents = isScrolled ? "auto" : "none";
		if (resultsBarInner) {
			const stuck = resultsBarContainer.getBoundingClientRect().top <= 0;
			resultsBarInner.classList.toggle("mb-2", !stuck);
		}
	};

	window.addEventListener("scroll", onScroll, { passive: true });

	// Restore persisted sort
	const savedSort = localStorage.getItem("re-sort");
	if (savedSort) sortSel.value = savedSort;

	const cardCallbacks: CardCallbacks = {
		onBM: toggleBM,
		onHide: hideItem,
		onGallery: openGallery,
		onDetail: openPropertyDetail,
	};

	// --- 4. Rendering Logic ---

	function render(): void {
		if (!cards) return;

		let list = state.showingSaved
			? state.savedOnlyResults.filter((p) => state.bookmarks.has(p.source_url))
			: state.allResults.filter((p) => !state.hidden.has(p.source_url));

		const sortBy = sortSel.value || "disc";
		const tierSel = state.refs.tierFilter?.value || "";
		if (tierSel) list = list.filter((p) => p.tier === tierSel);

		if (state.currentView === "map") {
			show(resultsBarInner);
			updateResultsMeta(list.length);
			return;
		}

		list = sortDeals(list, sortBy);
		if (!list.length) {
			if (!state.hasSearched) hide(resultsBarInner);
			else {
				show(resultsBarInner);
				updateResultsMeta(0);
			}
			show(empty);
			cards.replaceChildren();
			return;
		}

		show(resultsBarInner);
		hide(empty);
		renderList(cards, list);
		updateResultsMeta(list.length, list);
		updatePagination();
		updateSavedBadge();
	}

	function updateResultsMeta(count: number, list: Property[] = []): void {
		const tierCounts = list.reduce<Record<string, number>>((acc, p) => {
			acc[p.tier] = (acc[p.tier] ?? 0) + 1;
			return acc;
		}, {});

		const TIER_BADGES = [
			{ t: "High Value Deal", c: "var(--green)" },
			{ t: "Good Deal", c: "var(--blue)" },
			{ t: "Fair Price", c: "var(--yellow)" },
			{ t: "Overpriced", c: "var(--red)" },
		];

		const distStr = TIER_BADGES.filter((b) => tierCounts[b.t])
			.map(
				(b) =>
					`<span style="color:${b.c}">${tierCounts[b.t]} ${tTier(b.t, true)}</span>`,
			)
			.join(' <span style="color:var(--border)">·</span> ');

		const totalStr =
			state.currentTotal > state.allResults.length && !state.showingSaved
				? ` <span style="color:var(--muted)">· ${fmt(state.currentTotal)} ${t("total")}</span>`
				: "";

		const label = state.showingSaved
			? count !== 1
				? t("savedDeals")
				: t("savedDeal")
			: count !== 1
				? t("results")
				: t("result");

		resultsMeta.innerHTML = trust(
			`<strong>${count}</strong> ${label}${totalStr}${distStr ? ` <span style="color:var(--border)">·</span> ${distStr}` : ""}`,
		) as string;
	}

	function renderList(ct: HTMLElement, list: Property[]): void {
		ct.replaceChildren();
		const wrap = html`<div
			class="${state.currentView === "grid"
				? "grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[580px]:grid-cols-1"
				: "flex flex-col gap-2"}"
		></div>`;

		let newCount = 0;
		for (const property of list) {
			const el = Product({
				property,
				bookmarked: state.bookmarks.has(property.source_url),
				view: state.currentView as "grid" | "row",
				callbacks: cardCallbacks,
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
	}

	function updatePagination(): void {
		if (!state.showingSaved && state.allResults.length < state.currentTotal) {
			setupScrollObserver(() =>
				bus.emit(EVENTS.SEARCH_STARTED, { more: true }),
			);
		} else {
			if (state.scrollObserver) {
				state.scrollObserver.disconnect();
				state.scrollObserver = null;
			}
		}
	}

	function updateSavedBadge(): void {
		if (state.bookmarks.size > 0) {
			show(savedBtn, "inline-flex");
			savedBadge.textContent = String(state.bookmarks.size);
		} else {
			hide(savedBtn);
		}
	}

	function setupScrollObserver(loadMoreFn: () => void): void {
		if (state.scrollObserver) state.scrollObserver.disconnect();
		if (!sentinel) return;
		state.scrollObserver = new IntersectionObserver(
			(entries) => {
				if (
					entries[0]?.isIntersecting &&
					!state.showingSaved &&
					!state.loading &&
					state.allResults.length < state.currentTotal
				) {
					loadMoreFn();
				}
			},
			{ rootMargin: "0px 0px 1000px 0px" },
		);
		state.scrollObserver.observe(sentinel);
	}

	// --- 5. Event Handlers ---

	async function handleSavedClick(e: MouseEvent) {
		const btn = e.currentTarget as HTMLElement;
		state.showingSaved = !state.showingSaved;
		btn.classList.toggle("on", state.showingSaved);
		state.renderedSet.clear();

		if (!state.showingSaved || state.bookmarks.size === 0) {
			state.savedOnlyResults = [];
			render();
			return;
		}

		const cached = [...state.bookmarkData.values()].filter((p) =>
			state.bookmarks.has(p.source_url),
		);
		state.savedOnlyResults = cached;
		render();

		try {
			const res = await fetch("/api/deals/by-urls", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ urls: [...state.bookmarks] }),
			});
			const json = (await res.json()) as { data?: Property[] };
			if (json.data && json.data.length > 0) {
				state.savedOnlyResults = json.data;
				for (const p of json.data) {
					state.bookmarkData.set(p.source_url, p);
				}
				syncStateToStorage();
				state.renderedSet.clear();
				render();
			}
		} catch {
			// Silently fail, cached data is already shown
		}
	}

	const setView = (view: "grid" | "list" | "map") => {
		if (state.currentView === view) return;
		const wasMap = state.currentView === "map";
		state.currentView = view;

		vgrid.classList.toggle("on", view === "grid");
		vlist.classList.toggle("on", view === "list");
		vmapview.classList.toggle("on", view === "map");

		if (view === "map") {
			hide(cards);
			hide(sentinel);
			hide(loadMore);
			render();
			showMapView();
		} else {
			if (wasMap) {
				hideMapView();
				show(cards);
				show(sentinel);
			}
			state.renderedSet.clear();
			render();
		}
	};

	const { add, cleanup: cleanupHandlers } = makeEventManager();

	add(sortSel, "change", () => {
		localStorage.setItem("re-sort", sortSel.value);
		state.renderedSet.clear();
		render();
	});

	const offDeals = bus.on(EVENTS.DEALS_UPDATED, () => render());
	const onPdBmark = (e: Event) => {
		const p = (e as CustomEvent<Property>).detail;
		if (p) toggleBM(p);
	};
	const onPdHide = (e: Event) => {
		const p = (e as CustomEvent<Property>).detail;
		if (p) hideItem(p.source_url);
	};
	document.addEventListener("pd:bmark", onPdBmark);
	document.addEventListener("pd:hide", onPdHide);

	// --- 6. Cleanup ---

	return () => {
		cleanupHandlers();
		if (state.scrollObserver) {
			state.scrollObserver.disconnect();
			state.scrollObserver = null;
		}
		offDeals();
		document.removeEventListener("pd:bmark", onPdBmark);
		document.removeEventListener("pd:hide", onPdHide);
		window.removeEventListener("scroll", onScroll);
		backToTopBtn.remove();
		cleanupMapView();
	};
}
