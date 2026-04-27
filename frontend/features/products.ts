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
import { openPropertyDetail } from "../dialogs/property-detail";
import { Button } from "../ui/button";
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
		return [...list].sort((a, b) => {
			if (sortBy === "disc") return b.discount_percent - a.discount_percent;
			if (sortBy === "drops")
				return (b.price_drop_count ?? 0) - (a.price_drop_count ?? 0);
			if (sortBy === "new")
				return (
					new Date(b.posted_date ?? 0).getTime() -
					new Date(a.posted_date ?? 0).getTime()
				);
			if (sortBy === "price-asc") return a.price - b.price;
			if (sortBy === "price-desc") return b.price - a.price;
			if (sortBy === "area") return b.area_sqm - a.area_sqm;
			if (sortBy === "ppsm") return a.price_per_sqm - b.price_per_sqm;
			return 0;
		});
	}

	function persistBookmarkData(): void {
		const obj: Record<string, Property> = {};
		for (const [url, prop] of state.bookmarkData) {
			obj[url] = prop;
		}
		localStorage.setItem("re-bm-data", JSON.stringify(obj));
	}

	function toggleBM(p: Property): void {
		if (state.bookmarks.has(p.source_url)) {
			state.bookmarks.delete(p.source_url);
			state.bookmarkData.delete(p.source_url);
			toast(t("toastRemoved"));
		} else {
			state.bookmarks.add(p.source_url);
			state.bookmarkData.set(p.source_url, p);
			toast(t("toastSaved"));
		}
		localStorage.setItem("re-bm", JSON.stringify([...state.bookmarks]));
		persistBookmarkData();
		bus.emit(EVENTS.DEALS_UPDATED);
	}

	function hideItem(url: string): void {
		state.hidden.add(url);
		state.bookmarks.delete(url);
		state.bookmarkData.delete(url);
		localStorage.setItem("re-bm", JSON.stringify([...state.bookmarks]));
		localStorage.setItem("re-hidden", JSON.stringify([...state.hidden]));
		persistBookmarkData();
		toast(t("toastHidden"));
		bus.emit(EVENTS.DEALS_UPDATED);
	}

	function handleExport(): void {
		const sortBy = sortSel.value || "disc";
		let list = state.showingSaved
			? state.savedOnlyResults.filter((p) => state.bookmarks.has(p.source_url))
			: state.allResults.filter((p) => !state.hidden.has(p.source_url));

		list = sortDeals(list, sortBy);

		if (!list.length) return;

		const lines: string[] = [
			`REDEAL PROPERTY EXPORT — ${list.length} listings`,
			`Exported: ${new Date().toISOString()}`,
			``,
		];

		list.forEach((p, i) => {
			const tags: string[] = [];
			if (p.is_urgent) tags.push("Urgent");
			if (p.has_document) tags.push("Document");
			if (p.has_repair) tags.push("Repaired");
			if (p.has_mortgage) tags.push("Mortgage eligible");
			if (p.has_active_mortgage) tags.push("Active mortgage");
			if (p.price_drop_count && p.price_drop_count > 0)
				tags.push(`Price dropped ${p.price_drop_count}×`);

			lines.push(`--- [${i + 1}] ---`);
			lines.push(
				`Location: ${p.location_name ?? "Unknown"}${p.district && p.district !== p.location_name ? ` (${p.district})` : ""}`,
			);
			lines.push(
				`Price: ₼${fmt(p.price)} | Area: ${p.area_sqm}m² | ₼/m²: ${fmt(p.price_per_sqm)}`,
			);
			lines.push(
				`Market avg ₼/m²: ${fmt(p.location_avg_price_per_sqm)} | Discount: ${Number(p.discount_percent).toFixed(1)}% (${p.tier})`,
			);
			if (p.rooms !== undefined || p.floor !== undefined) {
				const parts: string[] = [];
				if (p.rooms !== undefined) parts.push(`${p.rooms} rooms`);
				if (p.floor !== undefined)
					parts.push(
						`Floor ${p.floor}${p.total_floors ? `/${p.total_floors}` : ""}`,
					);
				lines.push(`Details: ${parts.join(" | ")}`);
			}
			if (tags.length) lines.push(`Tags: ${tags.join(", ")}`);
			if (p.posted_date)
				lines.push(`Posted: ${new Date(p.posted_date).toLocaleDateString()}`);
			if (p.description?.trim())
				lines.push(`Description: ${p.description.trim()}`);
			lines.push(`URL: ${p.source_url}`);
			lines.push(``);
		});

		const text = lines.join("\n");
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast(t("exportCopied"));
			})
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
	const loadInfo = html`<p class="text-xs text-(--muted) mt-2"></p>`;
	const loadMore = html`<div class="hidden">${loadInfo}</div>`;
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
	state.refs.loadMore = loadMore;
	state.refs.savedBtn = savedBtn;

	container.appendChild(
		frag`${resultsBarContainer}${loading}${empty}${welcome}${cards}${sentinel}${loadMore}${mapViewCt}`,
	);

	// --- 3. Initialization ---

	const cleanupMapView = initMapView(mapViewCt);

	const backToTopBtn = html`<button
		type="button"
		aria-label="${t("backToTop")}"
		class="fixed bottom-5 right-5 z-40 w-9 h-9 rounded-full bg-(--surface-3) border border-(--border) text-(--muted) flex items-center justify-center shadow-lg transition-all duration-200 hover:text-(--text) hover:border-(--border-h) opacity-0 pointer-events-none"
		style="font-size:14px"
	>
		↑
	</button>`;
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
	backToTopBtn.addEventListener("click", () =>
		window.scrollTo({ top: 0, behavior: "instant" }),
	);

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
		const tierSel =
			(document.querySelector("#tier-filter") as HTMLSelectElement)?.value ||
			"";
		if (tierSel) list = list.filter((p) => p.tier === tierSel);

		if (state.currentView === "map") {
			show(resultsBarInner);
			updateResultsMeta(list.length);
			return;
		}

		list = sortDeals(list, sortBy);
		if (!list.length) {
			hide(resultsBarInner);
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

		const totalStr =
			state.currentTotal > state.allResults.length && !state.showingSaved
				? ` <span style="color:var(--muted)">· ${fmt(state.currentTotal)} ${t("total")}</span>`
				: "";

		resultsMeta.innerHTML = trust(
			state.showingSaved
				? `<strong>${count}</strong> ${count !== 1 ? t("savedDeals") : t("savedDeal")}`
				: `<strong>${count}</strong> ${count !== 1 ? t("results") : t("result")}${totalStr}${distStr ? ` <span style="color:var(--border)">·</span> ${distStr}` : ""}`,
		) as string;
	}

	function renderList(ct: HTMLElement, list: Property[]): void {
		ct.replaceChildren();
		const wrap = html`<div
			class="${
				state.currentView === "grid"
					? "grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2 max-[580px]:grid-cols-1"
					: "flex flex-col gap-2"
			}"
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
			show(loadMore);
			loadInfo.textContent = `${t("showing")} ${state.allResults.length} ${t("of")} ${fmt(state.currentTotal)}`;
			setupScrollObserver(() =>
				bus.emit(EVENTS.SEARCH_STARTED, { more: true }),
			);
		} else {
			hide(loadMore);
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
					state.allResults.length < state.currentTotal
				) {
					loadMoreFn();
				}
			},
			{ rootMargin: "600px" },
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
				persistBookmarkData();
				state.renderedSet.clear();
				render();
			}
		} catch {
			// Silently fail, cached data is already shown
		}
	}

	const setView = (view: "grid" | "list" | "map") => {
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

	let savedScrollY = 0;
	const offPropOpen = bus.on(EVENTS.PROPERTY_OPEN, () => {
		savedScrollY = window.scrollY;
	});

	const onDialogClose = (e: Event) => {
		const el = e.target as HTMLElement;
		if (el.id === "prop-detail-modal" && savedScrollY > 0) {
			requestAnimationFrame(() =>
				window.scrollTo({ top: savedScrollY, behavior: "instant" }),
			);
		}
	};
	document.addEventListener("close", onDialogClose, true);

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
		offPropOpen();
		document.removeEventListener("pd:bmark", onPdBmark);
		document.removeEventListener("pd:hide", onPdHide);
		document.removeEventListener("close", onDialogClose, true);
		window.removeEventListener("scroll", onScroll);
		backToTopBtn.remove();
		cleanupMapView();
	};
}
