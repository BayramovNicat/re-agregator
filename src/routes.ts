import { br } from "@/middleware/brotli.js";
import {
	createAlert,
	deleteAlert,
	getAlerts,
} from "@/modules/alerts/alerts.controller.js";
import {
	getDealsByUrls,
	getHeatmap,
	getLocations,
	getMapPins,
	getPriceDrops,
	getTrend,
	getUndervaluedDeals,
} from "@/modules/deals/deals.controller.js";
import {
	getScrapeRuns,
	runScrape,
	streamScrape,
} from "@/modules/scrape/scrape.controller.js";
import { handleWebhook } from "@/modules/telegram/telegram.controller.js";
import { prisma } from "@/utils/prisma.js";

let healthCache: { count: number; at: number } | null = null;
let healthPromise: Promise<number> | null = null;
const HEALTH_TTL = 5 * 60_000;

export const routes = {
	"/health": {
		GET: br(async () => {
			if (!healthCache || Date.now() - healthCache.at > HEALTH_TTL) {
				if (!healthPromise) {
					healthPromise = (async () => {
						try {
							const count = await prisma.property.count();
							healthCache = { count, at: Date.now() };
							return count;
						} finally {
							healthPromise = null;
						}
					})();
				}
				await healthPromise;
			}
			return Response.json({
				status: "ok",
				timestamp: new Date().toISOString(),
				properties: healthCache?.count ?? 0,
			});
		}),
	},
	"/api/deals/locations": { GET: br(getLocations) },
	"/api/deals/trend": { GET: br(getTrend) },
	"/api/deals/undervalued": { GET: br(getUndervaluedDeals) },
	"/api/deals/price-drops": { GET: br(getPriceDrops) },
	"/api/deals/map-pins": { GET: br(getMapPins) },
	"/api/deals/by-urls": { POST: br(getDealsByUrls) },
	"/api/heatmap": { GET: br(getHeatmap) },
	"/api/scrape/stream": { GET: streamScrape },
	"/api/scrape/runs": { GET: br(getScrapeRuns) },
	"/api/scrape/run": { POST: br(runScrape) },
	"/api/alerts": { GET: br(getAlerts), POST: br(createAlert) },
	"/api/alerts/:token": { DELETE: br(deleteAlert) },
	"/api/telegram/webhook": { POST: br(handleWebhook) },
} as const;
