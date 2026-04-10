import type { Request, Response } from 'express';
import { ScrapingService } from '../services/scraping.service.js';
import { BinaScraper } from '../scrapers/bina.scraper.js';

/** All active scrapers. Add new platform scrapers here. */
const scrapingService = new ScrapingService([new BinaScraper()]);

/**
 * POST /api/scrape/trigger
 *
 * Optional JSON body:
 *   { maxPages?: number, delayMs?: number }
 *
 * maxPages controls how many 25-listing pages to fetch per scraper (default: 20).
 * delayMs controls the pause between pages in ms (default: 800).
 */
export async function triggerScrape(req: Request, res: Response): Promise<void> {
  const { maxPages, delayMs } = req.body as { maxPages?: unknown; delayMs?: unknown };

  const options = {
    maxPages: typeof maxPages === 'number' ? maxPages : 20,
    delayMs: typeof delayMs === 'number' ? delayMs : 800,
  };

  try {
    console.log('[ScrapeController] Manual scrape triggered', options);
    const results = await scrapingService.runAll(options);
    const totalPersisted = results.reduce((sum, r) => sum + r.persisted, 0);
    res.json({ message: 'Scrape completed', total_persisted: totalPersisted, results });
  } catch (err) {
    console.error('[ScrapeController] triggerScrape:', err);
    res.status(500).json({ error: 'Scrape job failed' });
  }
}
