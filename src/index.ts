import { IS_DEV, PORT } from "@/config.js";
import { initStatic, serveStatic } from "@/middleware/static.js";
import { startCron } from "@/plugins/cron.js";
import { routes } from "@/routes.js";

const publicDir = `${import.meta.dir}/../public`;
await initStatic(publicDir);

Bun.serve({
	port: PORT,
	routes,
	fetch: (req) => serveStatic(req, publicDir),
});

console.log(`Server listening on http://localhost:${PORT}`);
console.log("Routes:");
console.log("  GET  /health");
console.log("  GET  /api/deals/undervalued?location=Yasamal&threshold=10");
console.log("  GET  /api/scrape/stream?maxPages=20&delayMs=800");
console.log("  GET  /api/scrape/runs?limit=20");
console.log("  POST /api/scrape/run");

if (!IS_DEV) startCron();
