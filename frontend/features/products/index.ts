import { bus, EVENTS } from "@/core/events";
import { t } from "@/core/i18n";
import { state } from "@/core/state";
import type { CardCallbacks, Property } from "@/core/types";
import {
	fmt,
	frag,
	hide,
	html,
	makeEventManager,
	show,
	tTier,
} from "@/core/utils";
// Lazy triggered via bus.emit(EVENTS.GALLERY_OPEN)
// Map View is lazy loaded in setView()
// Lazy triggered via bus.emit(EVENTS.PROPERTY_OPEN)
import { RawButton } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Icons } from "@/ui/icons";
import { renderProductsBar } from "./bar";
import { appendSkeletons, renderList, updatePagination } from "./list";
import {
	handleExport,
	hideItem,
	sortDeals,
	syncStateToStorage,
	toggleBM,
} from "./logic";
import type { ProductsUI } from "./types";

export function initProducts(container: HTMLElement): () => void {
	const ui: ProductsUI = {
		container,
		resultsMeta: null as unknown as HTMLElement,
		savedBtn: null as unknown as HTMLButtonElement,
		savedBadge: null as unknown as HTMLElement,
		sortSelect: null as unknown as HTMLSelectElement,
		viewGridBtn: null as unknown as HTMLButtonElement,
		viewListBtn: null as unknown as HTMLButtonElement,
		viewMapBtn: null as unknown as HTMLButtonElement,
		resultsBarInner: null as unknown as HTMLElement,
		resultsBarContainer: null as unknown as HTMLElement,
		loadingState: null as unknown as HTMLElement,
		emptyState: null as unknown as HTMLElement,
		welcomeState: null as unknown as HTMLElement,
		cardsContainer: null as unknown as HTMLElement,
		sentinel: null as unknown as HTMLElement,
		loadMoreContainer: null as unknown as HTMLElement,
		mapViewContainer: null as unknown as HTMLElement,
		backToTopBtn: null as unknown as HTMLButtonElement,
	};

	ui.loadingState = EmptyState({
		icon: Icons.spinner({
			size: 26,
			className: "animate-spin text-(--muted) opacity-40 mb-1",
		}),
		title: t("searching"),
	});

	ui.emptyState = EmptyState({
		icon: Icons.noResults({
			size: 42,
			strokeWidth: 1.4,
			className: "text-(--muted) opacity-40 mb-1",
		}),
		title: t("noResults"),
		subtitle: t("noResultsSub"),
	});

	ui.welcomeState = EmptyState({
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

	ui.cardsContainer = html`<div></div>`;
	ui.sentinel = html`<div></div>`;
	ui.loadMoreContainer = html`<div class="hidden"></div>`;
	ui.mapViewContainer = html`<div
		style="display:none;height:calc(100vh - 280px);min-height:420px"
		class="rounded-(--r-lg) overflow-hidden border border-(--border)"
	></div>`;

	const productsBar = renderProductsBar(ui, {
		onSortChange: () => {
			localStorage.setItem("re-sort", ui.sortSelect.value);
			state.renderedSet.clear();
			render();
		},
		onViewChange: (view) => setView(view),
		onExport: () => handleExport(ui.sortSelect.value),
		onSavedClick: (e) => void handleSavedClick(e),
		onAlertsOpen: () => bus.emit(EVENTS.ALERTS_OPEN),
		onBackToTop: () => window.scrollTo({ top: 0, behavior: "instant" }),
	});

	ui.backToTopBtn = RawButton({
		ariaLabel: t("backToTop"),
		className:
			"fixed bottom-5 right-5 z-40 w-9 h-9 rounded-full bg-(--surface-3) border border-(--border) text-(--muted) flex items-center justify-center shadow-lg transition-all duration-200 hover:text-(--text) hover:border-(--border-h) opacity-0 pointer-events-none text-[14px]",
		content: "↑",
		onclick: () => window.scrollTo({ top: 0, behavior: "instant" }),
	});

	container.appendChild(
		frag`${productsBar}${ui.loadingState}${ui.emptyState}${ui.welcomeState}${ui.cardsContainer}${ui.sentinel}${ui.loadMoreContainer}${ui.mapViewContainer}`,
	);
	document.body.appendChild(ui.backToTopBtn);

	const cardCallbacks: CardCallbacks = {
		onBM: (p) => {
			toggleBM(p);
			updateSavedBadge();
		},
		onHide: (url) => {
			hideItem(url);
			updateSavedBadge();
		},
		onGallery: (urls, index) => bus.emit(EVENTS.GALLERY_OPEN, { urls, index }),
		onDetail: (p) => bus.emit(EVENTS.PROPERTY_OPEN, p),
	};

	function render(): void {
		let list = state.showingSaved
			? state.savedOnlyResults.filter((p) => state.bookmarks.has(p.source_url))
			: state.allResults.filter((p) => !state.hidden.has(p.source_url));

		const sortBy = ui.sortSelect.value || "disc";
		const tierSel = state.refs.tierFilter?.value || "";
		if (tierSel) list = list.filter((p) => p.tier === tierSel);

		if (state.currentView === "map") {
			show(ui.resultsBarInner);
			updateResultsMeta(list.length);
			return;
		}

		list = sortDeals(list, sortBy);
		if (!list.length) {
			if (!state.hasSearched) hide(ui.resultsBarInner);
			else {
				show(ui.resultsBarInner);
				updateResultsMeta(0);
			}
			show(ui.emptyState);
			ui.cardsContainer.replaceChildren();
			return;
		}

		show(ui.resultsBarInner);
		hide(ui.emptyState);
		renderList(ui, list, cardCallbacks);
		updateResultsMeta(list.length, list);
		updatePagination(ui);
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

		ui.resultsMeta.replaceChildren(
			frag`<strong>${count}</strong> ${label}${totalStr}${distStr ? ` <span style="color:var(--border)">·</span> ${distStr}` : ""}`,
		);
	}

	function updateSavedBadge(): void {
		if (state.bookmarks.size > 0) {
			show(ui.savedBtn, "inline-flex");
			ui.savedBadge.textContent = String(state.bookmarks.size);
		} else {
			hide(ui.savedBtn);
		}
	}

	async function setView(view: "grid" | "list" | "map") {
		if (state.currentView === view) return;
		const wasMap = state.currentView === "map";
		state.currentView = view;

		ui.viewGridBtn.classList.toggle("on", view === "grid");
		ui.viewListBtn.classList.toggle("on", view === "list");
		ui.viewMapBtn.classList.toggle("on", view === "map");

		if (view === "map") {
			hide(ui.cardsContainer);
			hide(ui.sentinel);
			hide(ui.loadMoreContainer);
			render();
			const { initMapView, showMapView } = await import(
				"@/features/map-view/index"
			);
			if (!cleanupMapView) cleanupMapView = initMapView(ui.mapViewContainer);
			showMapView();
		} else {
			if (wasMap) {
				const { hideMapView } = await import("@/features/map-view/index");
				hideMapView();
				show(ui.cardsContainer);
				show(ui.sentinel);
			}
			state.renderedSet.clear();
			render();
		}
	}

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

	const { add, cleanup: cleanupHandlers } = makeEventManager();
	let cleanupMapView: (() => void) | null = null;

	const onScroll = () => {
		const isScrolled = window.scrollY > 450;
		ui.backToTopBtn.style.opacity = isScrolled ? "1" : "0";
		ui.backToTopBtn.style.pointerEvents = isScrolled ? "auto" : "none";
		if (ui.resultsBarInner) {
			const stuck = ui.resultsBarContainer.getBoundingClientRect().top <= 0;
			ui.resultsBarInner.classList.toggle("mb-2", !stuck);
		}
	};
	add(window, "scroll", onScroll);

	const getColumnCount = () => {
		const wrap = ui.cardsContainer.firstElementChild as HTMLElement;
		if (!wrap) return 1;
		const style = getComputedStyle(wrap);
		if (style.display !== "grid") return 1;
		return style.gridTemplateColumns.split(" ").filter(Boolean).length || 1;
	};

	add(ui.cardsContainer, "keydown", (e: KeyboardEvent) => {
		if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
			return;

		const target = e.target as HTMLElement;
		const currentCard = target.closest(".product-card") as HTMLElement;
		if (!currentCard) return;

		const allCards = Array.from(
			ui.cardsContainer.firstElementChild?.children || [],
		).filter((c) => c.classList.contains("product-card")) as HTMLElement[];
		const currentIndex = allCards.indexOf(currentCard);
		if (currentIndex === -1) return;

		const cols = getColumnCount();
		let nextIndex = currentIndex;

		switch (e.key) {
			case "ArrowLeft":
				nextIndex = currentIndex - 1;
				break;
			case "ArrowRight":
				nextIndex = currentIndex + 1;
				break;
			case "ArrowUp":
				nextIndex = currentIndex - cols;
				break;
			case "ArrowDown":
				nextIndex = currentIndex + cols;
				break;
		}

		if (
			nextIndex >= 0 &&
			nextIndex < allCards.length &&
			nextIndex !== currentIndex
		) {
			e.preventDefault();
			allCards[nextIndex].focus({ preventScroll: true });
			allCards[nextIndex].scrollIntoView({
				block: "nearest",
				behavior: "instant",
			});
		}
	});

	const offDeals = bus.on(EVENTS.DEALS_UPDATED, () => render());

	const offSearchStart = bus.on(EVENTS.SEARCH_STARTED, (detail) => {
		if (detail?.more) appendSkeletons(ui);
	});

	const onPdBmark = (e: Event) => {
		const p = (e as CustomEvent<Property>).detail;
		if (p) {
			toggleBM(p);
			updateSavedBadge();
		}
	};
	const onPdHide = (e: Event) => {
		const p = (e as CustomEvent<Property>).detail;
		if (p) {
			hideItem(p.source_url);
			updateSavedBadge();
		}
	};
	add(document, "pd:bmark", onPdBmark);
	add(document, "pd:hide", onPdHide);

	// Populate global refs for other features
	state.refs.cards = ui.cardsContainer;
	state.refs.loading = ui.loadingState;
	state.refs.empty = ui.emptyState;
	state.refs.welcome = ui.welcomeState;
	state.refs.resultsBar = ui.resultsBarInner;
	state.refs.resultsMeta = ui.resultsMeta;
	state.refs.loadMore = ui.loadMoreContainer;
	state.refs.savedBtn = ui.savedBtn;

	// Restore persisted sort
	const savedSort = localStorage.getItem("re-sort");
	if (savedSort) ui.sortSelect.value = savedSort;

	return () => {
		cleanupHandlers();
		if (state.scrollObserver) {
			state.scrollObserver.disconnect();
			state.scrollObserver = null;
		}
		offDeals();
		offSearchStart();
		ui.backToTopBtn.remove();
		if (cleanupMapView) cleanupMapView();
	};
}
