import type { MapPin } from "../../core/types";
import { toast } from "../../core/utils";
import type { MapViewState } from "./types";

/**
 * Fetches map pins based on current URL search parameters.
 */
export async function fetchMapPins(
	state: MapViewState,
): Promise<MapPin[] | null> {
	const params = new URLSearchParams(window.location.search);
	if (!params.get("location")) return null;

	if (state.abortController) state.abortController.abort();
	state.abortController = new AbortController();

	try {
		const res = await fetch(`/api/deals/map-pins?${params}`, {
			signal: state.abortController.signal,
		});
		const d = (await res.json()) as {
			error?: string;
			data?: MapPin[];
		};

		if (d.error) {
			toast(d.error, true);
			return null;
		}

		return d.data ?? [];
	} catch (e) {
		if ((e as Error).name !== "AbortError") {
			toast((e as Error).message, true);
		}
		return null;
	} finally {
		state.abortController = null;
	}
}
