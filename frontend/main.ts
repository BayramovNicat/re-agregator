import { html, renderToastsContainer, trustScriptURL } from "./core/utils";
import { initAlerts } from "./features/alerts/index";
import { initDistrictStats } from "./features/district-stats/index";
import { initGallery } from "./features/gallery";
import { initHeader } from "./features/header";
import { initHeatmap } from "./features/heatmap/index";
import { initProducts } from "./features/products/index";
import { initPropertyDetail } from "./features/property-detail/index";
import { initSearch } from "./features/search";
import { initTrend } from "./features/trend/index";
import { initTooltip } from "./ui/tooltip";

/**
 * Main application entry point.
 * Initializes the layout and all feature modules.
 */

// 1. Initial Layout
const root = document.getElementById("app") as HTMLElement;
if (!root) throw new Error("Root element #app not found");

const headerArea = html`<header></header>`;
const searchArea = html`<section></section>`;
const trendArea = html`<section></section>`;
const productsArea = html`<main id="products-area"></main>`;

root.appendChild(html`
	<div class="w-full px-5 pt-0 pb-20">
		${headerArea}
		${searchArea}
		${trendArea}
		${productsArea}
	</div>
`);

// 2. Feature Initialization
// Each feature returns a cleanup function for its lifecycle management.
const cleanups: (() => void)[] = [
	initProducts(productsArea),
	initTrend(trendArea),
	initSearch(searchArea),
	initHeader(headerArea),
	initAlerts(root),
	initGallery(root),
	initTooltip(root),
	initPropertyDetail(root),
	initHeatmap(root),
];

// 3. Global Static Modals & Utilities
cleanups.push(initDistrictStats(root));
renderToastsContainer(root);

// 4. Handle cleanup on window pagehide
window.addEventListener("pagehide", (e) => {
	if (!e.persisted) {
		cleanups.forEach((fn) => {
			if (typeof fn === "function") fn();
		});
	}
});

// 5. Dev hot-reload
declare const __DEV__: boolean;
if (__DEV__) {
	const devWs = new WebSocket("ws://localhost:3001");
	devWs.onmessage = () => location.reload();
}

// 6. Register Service Worker
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register(trustScriptURL("/sw.js") as string)
			.then((registration) => {
				console.log("SW registered:", registration);
			})
			.catch((error) => {
				console.log("SW registration failed:", error);
			});
	});
}
