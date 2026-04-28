import type { TrendPoint } from "@/core/types";

export interface TrendUI {
	panel: HTMLElement;
	locEl: HTMLElement;
	curEl: HTMLElement;
	chgEl: HTMLElement;
	weeksEl: HTMLElement;
	tipEl: HTMLElement;
	chartEl: HTMLElement;
	datesEl: HTMLElement;
}

export interface TrendState {
	cache: Record<string, { data: TrendPoint[]; at: number }>;
	currentSvg: SVGElement | null;
}
