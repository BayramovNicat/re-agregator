import type { Request, Response } from 'express';
import { ScrapingService } from '../services/scraping.service.js';
import { MockBinaScraper } from '../scrapers/mock-bina.scraper.js';

/** All active scrapers. Add new platform scrapers here. */
const scrapingService = new ScrapingService([new MockBinaScraper()]);

/** POST /api/scrape/trigger */
export async function triggerScrape(_req: Request, res: Response): Promise<void> {
  try {
    console.log('[ScrapeController] Manual scrape triggered');
    const results = await scrapingService.runAll();
    const totalPersisted = results.reduce((sum, r) => sum + r.persisted, 0);
    res.json({ message: 'Scrape completed', total_persisted: totalPersisted, results });
  } catch (err) {
    console.error('[ScrapeController] triggerScrape:', err);
    res.status(500).json({ error: 'Scrape job failed' });
  }
}
