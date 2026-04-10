import type { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

const analytics = new AnalyticsService();

/** GET /api/deals/urgent */
export async function getUrgentDeals(_req: Request, res: Response): Promise<void> {
  try {
    const listings = await analytics.getUrgentListings();
    res.json({ count: listings.length, data: listings });
  } catch (err) {
    console.error('[DealsController] getUrgentDeals:', err);
    res.status(500).json({ error: 'Failed to fetch urgent listings' });
  }
}

/** GET /api/deals/undervalued?location={name}&threshold={pct} */
export async function getUndervaluedDeals(req: Request, res: Response): Promise<void> {
  const { location, threshold } = req.query;

  if (!location || typeof location !== 'string') {
    res.status(400).json({ error: 'Query parameter "location" is required' });
    return;
  }

  const thresholdPct = threshold !== undefined ? Number(threshold) : 10;

  if (isNaN(thresholdPct) || thresholdPct < 0 || thresholdPct > 100) {
    res.status(400).json({ error: '"threshold" must be a number between 0 and 100' });
    return;
  }

  try {
    const listings = await analytics.getUndervaluedByLocation(location, thresholdPct);
    res.json({ location, threshold_pct: thresholdPct, count: listings.length, data: listings });
  } catch (err) {
    console.error('[DealsController] getUndervaluedDeals:', err);
    res.status(500).json({ error: 'Failed to fetch undervalued listings' });
  }
}
