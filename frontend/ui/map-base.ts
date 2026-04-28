import type { map } from "leaflet";
import { html } from "@/core/utils";
import { Dialog } from "./dialog";

export const MAP_MODAL_MAXWIDTH = "860px";

/**
 * Ensures the Leaflet CSS is loaded in the document.
 */
function ensureLeafletStyles(): Promise<void> {
	if (document.getElementById("leaflet-css")) return Promise.resolve();
	return new Promise((resolve) => {
		const link = document.createElement("link");
		link.id = "leaflet-css";
		link.rel = "stylesheet";
		link.href = "/leaflet.css";
		link.onload = () => resolve();
		link.onerror = () => resolve(); // Proceed even on error to avoid hanging
		document.head.appendChild(link);
	});
}

/**
 * Initializes a Leaflet map with standard dark-mode settings.
 */
export async function initLeaflet(
	target: string | HTMLElement,
): Promise<ReturnType<typeof map>> {
	await ensureLeafletStyles();
	const { map: Lmap, tileLayer: LtileLayer } = await import("leaflet");
	const lmap = Lmap(target, {
		zoomControl: true,
		attributionControl: false,
	});

	LtileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
		subdomains: "abcd",
		maxZoom: 19,
	}).addTo(lmap);

	return lmap;
}

/**
 * Creates a Dialog containing a standard map container.
 */
export function MapDialog({
	id,
	containerId,
	className = "",
}: {
	id: string;
	containerId: string;
	className?: string;
}): HTMLDialogElement {
	return Dialog({
		id,
		maxWidth: MAP_MODAL_MAXWIDTH,
		className: `max-h-[calc(100vh-2rem)] ${className}`,
		showClose: true,
		content: html`<div id="${containerId}" class="w-full h-120 relative"></div>`,
	});
}
