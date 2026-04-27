import { t } from "../core/i18n";
import { fmt, html, makeEventManager } from "../core/utils";
import { RawButton } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Icons } from "../ui/icons";
import { RawInput } from "../ui/input";

// --- Types & Constants ---
type LocationRow = {
	location_name: string;
	avg_price_per_sqm: number;
	count: number;
	recent_avg: number | null;
	prior_avg: number | null;
	trend: "up" | "down" | "flat";
};

type SortKey = "district" | "avg_ppsm" | "listing_count" | "trend";
type SortDir = "asc" | "desc";

const CACHE_TTL = 15 * 60_000;

// --- State & References ---
const state = {
	cachedData: null as LocationRow[] | null,
	cachedAt: 0,
	sortKey: "avg_ppsm" as SortKey,
	sortDir: "desc" as SortDir,
	filterQuery: "",
	isInitialized: false,
};

const ev = makeEventManager();

const refs = {
	subtitle: html`<div class="text-xs text-(--muted) mt-0.5"></div>`,
	loading: createLoadingSkeleton(),
	table: null as unknown as HTMLTableElement,
	tbody: html`<tbody></tbody>`,
	error: null as unknown as HTMLElement,
	empty: html`
		<div class="hidden py-20 text-center">
			<div class="text-(--muted) text-sm">${t("districtEmpty")}</div>
		</div>
	`,
	search: null as unknown as HTMLInputElement,
	clear: null as unknown as HTMLButtonElement,
	dialogEl: null as HTMLDialogElement | null,
	sortIndicators: {} as Record<SortKey, HTMLElement>,
	sortHeaders: {} as Record<SortKey, HTMLElement>,
};

// --- Components & Helpers ---

function createLoadingSkeleton(): HTMLElement {
	return html`
		<div class="hidden py-1 px-5">
			${Array.from({ length: 8 }).map(
				() => html`
					<div
						class="py-3.5 border-b border-(--border) flex items-center gap-4 animate-pulse"
					>
						<div class="h-4 w-32 bg-(--surface-3) rounded"></div>
						<div class="flex-1"></div>
						<div class="h-4 w-16 bg-(--surface-3) rounded"></div>
						<div class="h-4 w-12 bg-(--surface-3) rounded"></div>
						<div class="h-4 w-10 bg-(--surface-3) rounded"></div>
					</div>
				`,
			)}
		</div>
	`;
}

function createSortHeader(
	key: SortKey,
	label: string,
	align: "left" | "right" | "center",
): HTMLElement {
	const indicator = html`<span
		class="w-3 text-[10px] opacity-0 transition-opacity"
	></span>`;
	refs.sortIndicators[key] = indicator;

	const th = html`
		<th
			class="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-(--muted) cursor-pointer select-none hover:text-(--text) transition-colors ${
				align === "right"
					? "text-right"
					: align === "center"
						? "text-center"
						: "text-left"
			}"
			data-col="${key}"
		>
			<div
				class="flex items-center gap-1 ${
					align === "right"
						? "justify-end"
						: align === "center"
							? "justify-center"
							: ""
				}"
			>
				${label} ${indicator}
			</div>
		</th>
	`;
	refs.sortHeaders[key] = th;
	return th;
}

function createSearchBar(): HTMLElement {
	refs.search = RawInput({
		id: "dst-search",
		type: "text",
		placeholder: t("searchDistrict"),
		className:
			"w-full h-9 pl-9 pr-9 bg-(--surface-2) border border-(--border) rounded-(--r-sm) text-sm focus:outline-none focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 transition-all",
		oninput: (e) => {
			const val = (e.target as HTMLInputElement).value;
			state.filterQuery = val;
			refs.clear.classList.toggle("visible", val.length > 0);
			renderTable();
		},
	});

	refs.clear = RawButton({
		className:
			"w-6 h-6 flex items-center justify-center rounded-(--r-sm) text-(--muted) hover:text-(--text) hover:bg-(--surface-3) transition-all opacity-0 pointer-events-none [&.visible]:opacity-100 [&.visible]:pointer-events-auto",
		content: Icons.close(12),
		ariaLabel: "Clear search",
		onclick: () => {
			refs.search.value = "";
			state.filterQuery = "";
			refs.clear.classList.remove("visible");
			renderTable();
			refs.search.focus({ preventScroll: true });
		},
	});

	return html`
		<div class="relative group">
			<div
				class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-(--muted) group-focus-within:text-(--text) transition-colors"
			>
				${Icons.search(14)}
			</div>
			${refs.search}
			<div class="absolute inset-y-0 right-1.5 flex items-center">
				${refs.clear}
			</div>
		</div>
	`;
}

/**
 * Initializes the District Statistics modal.
 */
export function initDistrictStats(root: HTMLElement): () => void {
	if (state.isInitialized) return () => {};

	const retryBtn = RawButton({
		className:
			"px-4 py-2 bg-(--surface-3) rounded-(--r-sm) text-xs font-medium hover:bg-(--surface-4) transition-colors",
		content: "Retry",
		onclick: () => void loadStats(),
	});

	refs.error = html`
		<div class="hidden py-20 text-center">
			<div class="text-(--muted) mb-4 text-sm">${t("districtError")}</div>
			${retryBtn}
		</div>
	`;

	refs.table = html`
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr class="border-b border-(--border) sticky top-0 bg-(--surface) z-10">
					${createSortHeader("district", t("districtCol"), "left")}
					${createSortHeader("avg_ppsm", t("districtAvgPpsm"), "right")}
					${createSortHeader("listing_count", t("districtListings"), "right")}
					${createSortHeader("trend", t("districtTrend"), "center")}
				</tr>
			</thead>
			${refs.tbody}
		</table>
	` as HTMLTableElement;

	refs.dialogEl = Dialog({
		id: "district-stats-modal",
		maxWidth: "600px",
		className: "text-(--text)",
		title: t("districtStats"),
		description: refs.subtitle,
		content: html`
			<div class="flex flex-col h-150 max-h-[85vh]">
				<div class="px-5 pt-1.5 pb-3.5 border-b border-(--border) shrink-0">
					${createSearchBar()}
				</div>

				<div class="flex-1 overflow-y-auto min-h-0">
					${refs.loading} ${refs.table} ${refs.error} ${refs.empty}
				</div>
			</div>
		`,
	});

	root.appendChild(refs.dialogEl);
	state.isInitialized = true;

	return () => {
		refs.dialogEl?.remove();
		state.isInitialized = false;
		ev.cleanup();
	};
}

// --- Logic & Data Handling ---

function getTrendOrder(t: "up" | "down" | "flat"): number {
	const orders = { up: 2, flat: 1, down: 0 };
	return orders[t];
}

function getProcessedData(): LocationRow[] {
	if (!state.cachedData) return [];

	let data = [...state.cachedData];

	// Filter
	if (state.filterQuery) {
		const q = state.filterQuery.toLowerCase();
		data = data.filter((r) => r.location_name.toLowerCase().includes(q));
	}

	// Sort strategies
	const sorters: Record<SortKey, (a: LocationRow, b: LocationRow) => number> = {
		district: (a, b) => a.location_name.localeCompare(b.location_name),
		avg_ppsm: (a, b) => a.avg_price_per_sqm - b.avg_price_per_sqm,
		listing_count: (a, b) => a.count - b.count,
		trend: (a, b) => getTrendOrder(a.trend) - getTrendOrder(b.trend),
	};

	data.sort((a, b) => {
		const cmp = sorters[state.sortKey](a, b);
		return state.sortDir === "asc" ? cmp : -cmp;
	});

	return data;
}

function trendBadge(row: LocationRow): HTMLElement {
	const { trend, recent_avg, prior_avg } = row;
	if (trend === "flat" || !recent_avg || !prior_avg) {
		return html`<span class="text-(--muted) text-[11px]">···</span>`;
	}

	const isUp = trend === "up";
	const diff = Math.abs(((recent_avg - prior_avg) / prior_avg) * 100);
	const colorClass = isUp
		? "bg-(--red)/10 text-(--red)"
		: "bg-(--green)/10 text-(--green)";

	return html`
		<div
			class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${colorClass} text-[11px] font-bold"
		>
			${Icons.chevron({
				size: 10,
				strokeWidth: 3,
				className: isUp ? "rotate-180" : "",
			})}
			${diff.toFixed(1)}%
		</div>
	`;
}

function renderTable(): void {
	const data = getProcessedData();
	refs.tbody.innerHTML = "";

	if (data.length === 0) {
		refs.table.classList.add("hidden");
		refs.empty.classList.remove("hidden");
	} else {
		refs.table.classList.remove("hidden");
		refs.empty.classList.add("hidden");

		const fragment = document.createDocumentFragment();
		data.forEach((row) => {
			fragment.appendChild(html`
				<tr
					class="group hover:bg-(--surface-2) border-b border-(--border)/50 transition-colors"
				>
					<td
						class="px-5 py-3 font-medium text-(--text) max-w-50 truncate"
						title="${row.location_name}"
					>
						${row.location_name}
					</td>
					<td class="px-4 py-3 text-right font-mono text-[13px]">
						₼ ${fmt(row.avg_price_per_sqm, 0)}
					</td>
					<td class="px-4 py-3 text-right text-(--muted) tabular-nums">
						${row.count}
					</td>
					<td class="px-4 pr-5 py-3 text-center">${trendBadge(row)}</td>
				</tr>
			`);
		});
		refs.tbody.appendChild(fragment);
	}

	// Sync sort indicators
	const cols: SortKey[] = ["district", "avg_ppsm", "listing_count", "trend"];
	for (const col of cols) {
		const th = refs.sortHeaders[col];
		const indicator = refs.sortIndicators[col];
		const isActive = col === state.sortKey;

		indicator.textContent = isActive
			? state.sortDir === "asc"
				? "↑"
				: "↓"
			: "";
		indicator.className = `w-3 text-[10px] transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`;
		th.setAttribute(
			"aria-sort",
			isActive
				? state.sortDir === "asc"
					? "ascending"
					: "descending"
				: "none",
		);
	}

	const countStr = t("districtSubtitle", { n: data.length });
	const timeStr = state.cachedAt
		? new Date(state.cachedAt).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			})
		: "";
	refs.subtitle.textContent = timeStr
		? `${countStr} • Updated at ${timeStr}`
		: countStr;
}

async function loadStats(): Promise<void> {
	const isFresh = state.cachedData && Date.now() - state.cachedAt < CACHE_TTL;
	if (isFresh) {
		refs.loading.classList.add("hidden");
		renderTable();
		return;
	}

	refs.loading.classList.remove("hidden");
	[refs.table, refs.error, refs.empty].forEach((el) => {
		el.classList.add("hidden");
	});

	try {
		const r = await fetch("/api/heatmap");
		if (!r.ok) throw new Error(`HTTP ${r.status}`);

		const { data } = (await r.json()) as { data?: LocationRow[] };
		if (!data) throw new Error("Invalid response format");

		state.cachedData = data;
		state.cachedAt = Date.now();
		refs.loading.classList.add("hidden");
		renderTable();
	} catch (e) {
		console.error("[DistrictStats]", e);
		refs.loading.classList.add("hidden");
		refs.error.classList.remove("hidden");
	}
}

function attachHandlers(): void {
	ev.cleanup();

	const cols: SortKey[] = ["district", "avg_ppsm", "listing_count", "trend"];
	for (const col of cols) {
		ev.add(refs.sortHeaders[col], "click", () => {
			if (state.sortKey === col) {
				state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
			} else {
				state.sortKey = col;
				state.sortDir = col === "district" ? "asc" : "desc";
			}
			renderTable();
		});
	}
}

/**
 * Public API to open the modal.
 */
export function openDistrictStats(): void {
	if (!refs.dialogEl) return;

	refs.dialogEl.showModal();
	attachHandlers();

	// Reset UI state on each open
	if (refs.search) {
		refs.search.value = "";
		state.filterQuery = "";
		refs.clear?.classList.remove("visible");
	}

	void loadStats();
}
