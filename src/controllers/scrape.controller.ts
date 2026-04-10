import { ScrapingService } from '../services/scraping.service.js';
import { BinaScraper } from '../scrapers/bina.scraper.js';
import type { ScrapeProgressEvent } from '../scrapers/base.scraper.js';

const scrapingService = new ScrapingService([new BinaScraper()]);

/**
 * POST /api/scrape/trigger
 *
 * Optional JSON body:
 *   { maxPages?: number, startPage?: number, endPage?: number, delayMs?: number }
 */
export async function triggerScrape(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try { body = await req.json() as Record<string, unknown>; } catch { /* no body or not JSON */ }

  const { maxPages, startPage, endPage, delayMs } = body;
  const options = {
    maxPages:  typeof maxPages  === 'number' ? maxPages  : 20,
    startPage: typeof startPage === 'number' ? startPage : undefined,
    endPage:   typeof endPage   === 'number' ? endPage   : undefined,
    delayMs:   typeof delayMs   === 'number' ? delayMs   : 800,
  };

  try {
    console.log('[ScrapeController] Manual scrape triggered', options);
    const results = await scrapingService.runAll(options);
    const totalPersisted = results.reduce((sum, r) => sum + r.persisted, 0);
    return Response.json({ message: 'Scrape completed', total_persisted: totalPersisted, results });
  } catch (err) {
    console.error('[ScrapeController] triggerScrape:', err);
    return Response.json({ error: 'Scrape job failed' }, { status: 500 });
  }
}

/**
 * GET /api/scrape/stream
 *
 * Streams Server-Sent Events with live scrape progress.
 * Optional query params: maxPages, startPage, endPage, delayMs
 */
export function streamScrape(req: Request): Response {
  const url = new URL(req.url);
  const q = url.searchParams;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ScrapeProgressEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const maxPages  = q.get('maxPages');
      const startPage = q.get('startPage');
      const endPage   = q.get('endPage');
      const delayMs   = q.get('delayMs');

      const options = {
        maxPages:  maxPages  !== null ? parseInt(maxPages,  10) : 20,
        startPage: startPage !== null ? parseInt(startPage, 10) : undefined,
        endPage:   endPage   !== null ? parseInt(endPage,   10) : undefined,
        delayMs:   delayMs   !== null ? parseInt(delayMs,   10) : 800,
        onProgress: send,
      };

      try {
        console.log('[ScrapeController] Streaming scrape triggered', { maxPages: options.maxPages });
        await scrapingService.runAll(options);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[ScrapeController] streamScrape:', err);
        send({ type: 'error', platform: 'server', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
