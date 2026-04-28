/**
 * Simple linear interpolation between Green -> Yellow -> Red.
 */
export function getPriceColor(val: number, min: number, max: number): string {
	const t = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));

	// Interpolation stops: [34, 197, 94] (Green) -> [234, 179, 8] (Yellow) -> [239, 68, 68] (Red)
	if (t < 0.5) {
		const f = t * 2;
		const r = Math.round(34 + f * (234 - 34));
		const g = Math.round(197 + f * (179 - 197));
		const b = Math.round(94 + f * (8 - 94));
		return `rgb(${r},${g},${b})`;
	}

	const f = (t - 0.5) * 2;
	const r = Math.round(234 + f * (239 - 234));
	const g = Math.round(179 + f * (68 - 179));
	const b = Math.round(8 + f * (68 - 8));
	return `rgb(${r},${g},${b})`;
}
