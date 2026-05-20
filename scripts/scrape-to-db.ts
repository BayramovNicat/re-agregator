import { ScrapingService } from "../src/modules/scrape/scrape.service";
import { BinaScraper } from "../src/scrapers/bina.scraper";
import { prisma } from "../src/utils/prisma";

try {
	const service = new ScrapingService([new BinaScraper()]);
	const results = await service.runAll({
		maxPages: 10,
		delayMs: 800,
	});

	console.log(JSON.stringify(results, null, 2));
} finally {
	await prisma.$disconnect();
}
