import { IS_DEV, PORT } from "@/config.js";
import { br } from "@/middleware/brotli.js";
import { initStatic, serveStatic } from "@/middleware/static.js";
import { getLocations, getUndervalued } from "@/modules/deals/deals.service.js";
import { startCron } from "@/plugins/cron.js";
import { routes } from "@/routes.js";
import { prisma } from "@/utils/prisma.js";

const publicDir = `${import.meta.dir}/../public`;
await initStatic(publicDir);

const indexHtml = await Bun.file(`${publicDir}/index.html`).text();

Bun.serve({
	port: PORT,
	routes: {
		...routes,
		"/": br(async (req) => {
			const url = new URL(req.url);
			if (url.pathname !== "/") return serveStatic(req, publicDir);

			const locRaw = url.searchParams.get("location") || "__all__";
			const locParam =
				locRaw === "__all__" ? "__all__" : locRaw.split(",").filter(Boolean);
			const threshold = Number(url.searchParams.get("threshold") || "10");

			// Parallel fetch of initial data
			const [locs, undervalued, count] = await Promise.all([
				getLocations(),
				getUndervalued(locParam, threshold, {}, { limit: 200, offset: 0 }),
				prisma.property.count(),
			]);

			const initialData = {
				locations: locs,
				undervalued,
				health: { properties: count },
				params: { location: locParam, threshold },
			};

			const injectedHtml = indexHtml.replace(
				"</body>",
				`<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script></body>`,
			);

			return new Response(injectedHtml, {
				headers: {
					"Content-Type": "text/html",
					"Cache-Control": "public, no-cache, must-revalidate",
				},
			});
		}),
	},
	async fetch(req) {
		return serveStatic(req, publicDir);
	},
});

console.log(`Server listening on http://localhost:${PORT}`);
console.log("Routes:");
console.log("  GET  /health");
console.log("  GET  /api/deals/undervalued?location=Yasamal&threshold=10");
console.log("  GET  /api/scrape/stream?maxPages=20&delayMs=800");

if (!IS_DEV) startCron();
