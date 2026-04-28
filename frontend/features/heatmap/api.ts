import type { HeatmapPoint } from "@/core/types";

/**
 * Fetches heatmap data from the API.
 */
export async function fetchHeatmapData(): Promise<HeatmapPoint[]> {
	try {
		const r = await fetch("/api/heatmap");
		if (!r.ok) throw new Error(`HTTP ${r.status}`);
		const { data } = (await r.json()) as { data?: HeatmapPoint[] };
		return data ?? [];
	} catch (e) {
		console.error("[Heatmap] fetch failed:", e);
		return [];
	}
}
