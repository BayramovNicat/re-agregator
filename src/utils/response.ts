/**
 * Standardized JSON response helper with Cache-Control support.
 * @param body - The response body object.
 * @param cacheAge - max-age in seconds. If omitted, defaults to "no-store".
 * @param staleAge - stale-while-revalidate in seconds.
 */
export function json(body: unknown, cacheAge?: number, staleAge?: number): Response {
	const headers: Record<string, string> = {
		"Cache-Control":
			cacheAge === undefined
				? "no-store"
				: `public, max-age=${cacheAge}${staleAge ? `, stale-while-revalidate=${staleAge}` : ""}`,
	};

	return Response.json(body, { headers });
}

/**
 * Standardized Error response helper.
 */
export function error(message: string, status = 500): Response {
	return Response.json({ error: message }, { status });
}
