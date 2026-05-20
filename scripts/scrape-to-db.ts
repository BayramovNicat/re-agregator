import { ScrapingService } from "../src/modules/scrape/scrape.service";
import { BinaScraper } from "../src/scrapers/bina.scraper";
import { prisma } from "../src/utils/prisma";

try {
	const service = new ScrapingService([new BinaScraper()]);

	console.log("--- Starting Rent Scraper (300 pages) ---");
	const rentResults = await service.runAll({
		maxPages: 300,
		delayMs: 800,
		listingType: "rent",
	});
	console.log("Rent Scraper Completed:");
	console.log(JSON.stringify(rentResults, null, 2));

	console.log("--- Starting House Scraper (300 pages) ---");
	const houseResults = await service.runAll({
		maxPages: 300,
		delayMs: 800,
		categoryId: "5",
	});
	console.log("House Scraper Completed:");
	console.log(JSON.stringify(houseResults, null, 2));
} finally {
	await prisma.$disconnect();
}
