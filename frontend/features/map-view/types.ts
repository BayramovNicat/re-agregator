import type { FeatureGroup, Map as LMap, Tooltip } from "leaflet";

export interface MapViewState {
	lmap: LMap | null;
	pinGroup: FeatureGroup;
	fitDone: boolean;
	abortController: AbortController | null;
	sharedTooltip: Tooltip;
}
