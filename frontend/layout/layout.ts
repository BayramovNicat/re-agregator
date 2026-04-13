import { renderToastsContainer } from "../core/utils";
import { initAlerts } from "../dialogs/alert";
import { renderDescModal } from "../dialogs/description";
import { renderHeatmapModal } from "../dialogs/heatmap";
import { renderMapModal } from "../dialogs/map";
import { renderStateArea } from "../ui/render";

export function renderLayout(root: HTMLElement): void {
	const wrap = document.createElement("div");
	wrap.className = "max-w-290 mx-auto px-5 pt-0 pb-20";
	root.appendChild(wrap);

	renderHeader(wrap);
	renderSearchPanel(wrap);
	renderStateArea(wrap);

	renderMapModal(root);
	renderHeatmapModal(root);
	renderDescModal(root);
	initAlerts(root);
	renderToastsContainer(root);
}
