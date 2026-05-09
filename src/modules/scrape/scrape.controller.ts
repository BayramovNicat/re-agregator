import { IS_DEV, SCRAPE_ADMIN_TOKEN } from "@/config.js";
import { runAlerts } from "@/modules/alerts/alerts.service.js";
import type { ScrapeProgressEvent } from "@/scrapers/base.scraper.js";
import { parseQueryNum } from "@/utils/query.js";
import * as res from "@/utils/response.js";
import { scrapeRunsService } from "./scrape-runs.service.js";

const SSE_HEADERS = {
	"Content-Type": "text/event-stream",
	"Cache-Control": "no-cache",
	Connection: "keep-alive",
} as const;

function parseBoundedInt(
	q: URLSearchParams,
	name: string,
	min: number,
	max: number,
	defaultValue?: number,
): number | undefined | Response {
	const raw = q.get(name);
	const parsed = parseQueryNum(raw);
	const value = parsed ?? defaultValue;
	if (
		(raw !== null && parsed === undefined) ||
		(value !== undefined && (!Number.isInteger(value) || value < min || value > max))
	) {
		return res.error(`"${name}" must be an integer between ${min} and ${max}`, 400);
	}
	return value;
}

function requireScrapeAdmin(req: Request): Response | null {
	if (!SCRAPE_ADMIN_TOKEN) {
		return IS_DEV
			? null
			: res.error("SCRAPE_ADMIN_TOKEN is not configured", 503);
	}
	const token = req.headers.get("x-scrape-admin-token") ?? "";
	if (token === SCRAPE_ADMIN_TOKEN) return null;
	return res.error("Unauthorized", 401);
}

export async function getScrapeRuns(req: Request): Promise<Response> {
	const q = new URL(req.url).searchParams;
	const limitParam = q.get("limit");
	const limitRaw = parseQueryNum(limitParam);
	const limit = limitRaw ?? 20;
	if (
		(limitParam !== null && limitRaw === undefined) ||
		!Number.isInteger(limit) ||
		limit < 1 ||
		limit > 100
	) {
		return res.error('"limit" must be an integer between 1 and 100', 400);
	}

	try {
		const runs = await scrapeRunsService.list(limit);
		return res.json({ ok: true, runs });
	} catch (err) {
		console.error("[ScrapeController] getScrapeRuns:", err);
		return res.error("Failed to fetch scrape runs");
	}
}

export function runScrape(req: Request): Response {
	const authError = requireScrapeAdmin(req);
	if (authError) return authError;

	scrapeRunsService
		.run("manual", {
			maxPages: 20,
			delayMs: 800,
		})
		.then(async (run) => {
			if (run.status === "success") await runAlerts();
		})
		.catch((err) => {
			console.error("[ScrapeController] runScrape:", err);
		});

	return res.json({ ok: true });
}

export function streamScrape(req: Request): Response {
	const authError = requireScrapeAdmin(req);
	if (authError) return authError;

	const q = new URL(req.url).searchParams;
	const maxPages = parseBoundedInt(q, "maxPages", 1, 100, 20);
	if (maxPages instanceof Response) return maxPages;
	const startPage = parseBoundedInt(q, "startPage", 1, 100);
	if (startPage instanceof Response) return startPage;
	const endPage = parseBoundedInt(q, "endPage", 1, 100);
	if (endPage instanceof Response) return endPage;
	const delayMs = parseBoundedInt(q, "delayMs", 250, 10_000, 800);
	if (delayMs instanceof Response) return delayMs;
	const encoder = new TextEncoder();

	function encodeEvent(event: ScrapeProgressEvent): Uint8Array {
		return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
	}

	const stream = new ReadableStream({
		async start(controller) {
			const send = (event: ScrapeProgressEvent) => {
				controller.enqueue(encodeEvent(event));
			};

			const options = {
				maxPages,
				startPage,
				endPage,
				delayMs,
				onProgress: send,
			};

			try {
				console.log("[ScrapeController] Streaming scrape triggered", {
					maxPages: options.maxPages,
				});
				const run = await scrapeRunsService.run("manual", options, send);
				if (run.status === "success") {
					await runAlerts();
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error("[ScrapeController] streamScrape:", err);
				send({ type: "error", platform: "server", message });
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, { headers: SSE_HEADERS });
}
