import { ScrapingService } from "@/modules/scrape/scrape.service.js";
import { BinaScraper } from "@/scrapers/bina.scraper.js";
import { acquireLock, releaseLock } from "@/utils/scrape-lock.js";

const CRON_INTERVAL_MS = 60 * 60 * 1000;

export function startCron(): void {
	const cronService = new ScrapingService([new BinaScraper()]);

	async function runCronScrape() {
		if (!acquireLock()) {
			console.log("[Cron] Previous scrape still running, skipping this tick.");
			return;
		}
		console.log("[Cron] Hourly scrape started", new Date().toISOString());
		try {
			const results = await cronService.runAll({ maxPages: 40, delayMs: 800 });
			const total = results.reduce((sum, r) => sum + r.persisted, 0);
			console.log(`[Cron] Hourly scrape done — persisted=${total}`);
		} catch (err) {
			console.error("[Cron] Hourly scrape failed:", err);
		} finally {
			releaseLock();
		}
	}

	setInterval(runCronScrape, CRON_INTERVAL_MS);
	console.log(
		`[Cron] Hourly scrape scheduled (every ${CRON_INTERVAL_MS / 60000} min)`,
	);
}
