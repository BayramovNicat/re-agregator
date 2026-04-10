import type { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

const analytics = new AnalyticsService();

/** GET /api/deals/locations */
export async function getLocations(_req: Request, res: Response): Promise<void> {
  try {
    const locations = await analytics.getDistinctLocations();
    res.json({ count: locations.length, data: locations });
  } catch (err) {
    console.error('[DealsController] getLocations:', err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
}

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

/** GET /api/deals/undervalued */
export async function getUndervaluedDeals(req: Request, res: Response): Promise<void> {
  const q = req.query;

  if (!q.location || typeof q.location !== 'string') {
    res.status(400).json({ error: 'Query parameter "location" is required' });
    return;
  }

  const thresholdPct = q.threshold !== undefined ? Number(q.threshold) : 10;
  if (isNaN(thresholdPct) || thresholdPct < 0 || thresholdPct > 100) {
    res.status(400).json({ error: '"threshold" must be a number between 0 and 100' });
    return;
  }

  function optNum(val: unknown): number | undefined {
    if (val === undefined || val === '') return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }

  function optBool(val: unknown): boolean | undefined {
    if (val === undefined || val === '') return undefined;
    return val === 'true';
  }

  try {
    const listings = await analytics.getUndervaluedByLocation(q.location, thresholdPct, {
      minPrice:      optNum(q.minPrice),
      maxPrice:      optNum(q.maxPrice),
      minArea:       optNum(q.minArea),
      maxArea:       optNum(q.maxArea),
      minRooms:      optNum(q.minRooms),
      maxRooms:      optNum(q.maxRooms),
      minFloor:      optNum(q.minFloor),
      maxFloor:      optNum(q.maxFloor),
      maxTotalFloors: optNum(q.maxTotalFloors),
      hasDocument:   optBool(q.hasDocument),
      hasMortgage:   optBool(q.hasMortgage),
      hasRepair:     optBool(q.hasRepair),
      isUrgent:      optBool(q.isUrgent),
      category:      typeof q.category === 'string' && q.category !== '' ? q.category : undefined,
    });
    res.json({ location: q.location, threshold_pct: thresholdPct, count: listings.length, data: listings });
  } catch (err) {
    console.error('[DealsController] getUndervaluedDeals:', err);
    res.status(500).json({ error: 'Failed to fetch undervalued listings' });
  }
}
