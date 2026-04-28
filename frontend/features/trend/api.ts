import type { TrendPoint } from "../../core/types";
import type { TrendState } from "./types";

/**
 * Fetches trend data with localized caching.
 */
export async function fetchTrendData(
	location: string,
	state: TrendState,
): Promise<TrendPoint[] | null> {
	const CACHE_TTL = 30 * 60_000;
	const hit = state.cache[location];

	if (hit && Date.now() - hit.at < CACHE_TTL) {
		return hit.data;
	}

	try {
		const r = await fetch(
			`/api/deals/trend?location=${encodeURIComponent(location)}`,
		);
		const d = (await r.json()) as { data?: TrendPoint[] };
		if (!d.data || d.data.length < 2) return null;

		state.cache[location] = { data: d.data, at: Date.now() };
		const keys = Object.keys(state.cache);
		if (keys.length > 20) delete state.cache[keys[0]];

		return d.data;
	} catch (e) {
		console.error("[Trend] fetch failed:", e);
		return null;
	}
}
