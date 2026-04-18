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
import { streamScrape } from "@/modules/scrape/scrape.controller.js";
import { handleWebhook } from "@/modules/telegram/telegram.controller.js";
import { queryRaw } from "@/utils/prisma.js";
import { Prisma } from "@prisma/client";

export const routes = {
	"/health": {
		GET: br(async () => {
			const result = await queryRaw<[{ count: bigint }]>(Prisma.sql`
				SELECT COUNT(*)::bigint AS count FROM "Property"
			`);
			const count = Number(result[0]?.count ?? 0);
			return Response.json({
				status: "ok",
				timestamp: new Date().toISOString(),
				properties: count,
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
	"/api/alerts": { GET: br(getAlerts), POST: br(createAlert) },
	"/api/alerts/:token": { DELETE: br(deleteAlert) },
	"/api/telegram/webhook": { POST: br(handleWebhook) },
} as const;
