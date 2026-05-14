function cacheControl(
	scope: "public" | "private",
	cacheAge?: number,
	staleAge?: number,
): string {
	if (cacheAge === undefined) return "no-store";
	return `${scope}, max-age=${cacheAge}${staleAge ? `, stale-while-revalidate=${staleAge}` : ""}`;
}

function publicJson(
	body: unknown,
	cacheAge?: number,
	staleAge?: number,
): Response {
	return Response.json(body, {
		headers: { "Cache-Control": cacheControl("public", cacheAge, staleAge) },
	});
}

function privateJson(
	body: unknown,
	cacheAge?: number,
	staleAge?: number,
): Response {
	return Response.json(body, {
		headers: { "Cache-Control": cacheControl("private", cacheAge, staleAge) },
	});
}

function error(message: string, status = 500): Response {
	return Response.json(
		{ error: message },
		{ status, headers: { "Cache-Control": "no-store" } },
	);
}

export const ResponseHelper = {
	publicJson,
	privateJson,
	error,
} as const;
