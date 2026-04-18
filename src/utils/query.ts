/** Parse optional numeric query parameter */
export function parseQueryNum(val: string | null): number | undefined {
	if (val === null || val === "") return undefined;
	const n = Number(val);
	return Number.isNaN(n) ? undefined : n;
}

/** Parse optional boolean query parameter */
export function parseQueryBool(val: string | null): boolean | undefined {
	if (val === null || val === "") return undefined;
	return val === "true";
}
