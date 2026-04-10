/**
 * AnalyticsService — core deal-finding logic.
 *
 * Deal Score methodology:
 * ─────────────────────────────────────────────────────────────
 *   discount_percent = ((location_avg - property_price_per_sqm) / location_avg) × 100
 *
 *   A positive value means the property is cheaper than the location average.
 *   A negative value means it is more expensive.
 *
 * Tier thresholds:
 *   ≥ 20% below average  →  "High Value Deal"
 *   10–19% below average →  "Good Deal"
 *    0–9% below average  →  "Fair Price"
 *   Above average        →  "Overpriced"
 * ─────────────────────────────────────────────────────────────
 */

import { prisma } from '../utils/prisma.js';

export type DealTier = 'High Value Deal' | 'Good Deal' | 'Fair Price' | 'Overpriced';

export interface DealScore {
  propertyId: number;
  source_url: string;
  location_name: string;
  price_per_sqm: number;
  location_avg_price_per_sqm: number;
  /** Positive = cheaper than average; negative = more expensive */
  discount_percent: number;
  tier: DealTier;
}

/**
 * Maps a discount percentage to a human-readable deal tier.
 * This is the single place to adjust scoring thresholds.
 */
function classifyDeal(discountPercent: number): DealTier {
  if (discountPercent >= 20) return 'High Value Deal';
  if (discountPercent >= 10) return 'Good Deal';
  if (discountPercent >= 0) return 'Fair Price';
  return 'Overpriced';
}

export class AnalyticsService {
  /**
   * Returns the mean price_per_sqm across all valid listings in a location.
   * Excludes listings with price_per_sqm = 0 (data-quality guard).
   */
  async getLocationAvgPricePerSqm(location: string): Promise<number> {
    const result = await prisma.property.aggregate({
      where: { location_name: location, price_per_sqm: { gt: 0 } },
      _avg: { price_per_sqm: true },
    });

    return parseFloat((result._avg.price_per_sqm ?? 0).toString());
  }

  /**
   * Returns all properties with is_urgent = true, newest first.
   */
  async getUrgentListings() {
    return prisma.property.findMany({
      where: { is_urgent: true },
      orderBy: { scraped_at: 'desc' },
    });
  }

  /**
   * Returns properties in a location priced at least `thresholdPercent`% below
   * the location average price_per_sqm, with deal-score metadata attached.
   *
   * @param location - Exact location_name value (e.g. "Memar Əcəmi m.")
   * @param thresholdPercent - Minimum discount to qualify (default: 10%)
   */
  async getUndervaluedByLocation(location: string, thresholdPercent = 10) {
    const avg = await this.getLocationAvgPricePerSqm(location);

    if (avg === 0) return [];

    /**
     * Upper bound for price_per_sqm to be at least `thresholdPercent`% below average.
     * e.g. avg=1000, threshold=10 → maxPricePerSqm=900
     */
    const maxPricePerSqm = avg * (1 - thresholdPercent / 100);

    const properties = await prisma.property.findMany({
      where: {
        location_name: location,
        price_per_sqm: { gt: 0, lte: maxPricePerSqm },
      },
      orderBy: { price_per_sqm: 'asc' },
    });

    return properties.map((p) => {
      const pricePerSqm = parseFloat(p.price_per_sqm.toString());
      const discountPercent = parseFloat(
        (((avg - pricePerSqm) / avg) * 100).toFixed(2),
      );

      return {
        ...p,
        price: parseFloat(p.price.toString()),
        area_sqm: parseFloat(p.area_sqm.toString()),
        price_per_sqm: pricePerSqm,
        location_avg_price_per_sqm: parseFloat(avg.toFixed(2)),
        discount_percent: discountPercent,
        tier: classifyDeal(discountPercent),
      };
    });
  }

  /**
   * Calculates the full deal-score breakdown for every listing in a location.
   * Useful for building leaderboard / ranking views.
   */
  async getDealScoresForLocation(location: string): Promise<DealScore[]> {
    const avg = await this.getLocationAvgPricePerSqm(location);

    if (avg === 0) return [];

    const properties = await prisma.property.findMany({
      where: { location_name: location, price_per_sqm: { gt: 0 } },
    });

    return properties.map((p) => {
      const pricePerSqm = parseFloat(p.price_per_sqm.toString());
      const discountPercent = parseFloat(
        (((avg - pricePerSqm) / avg) * 100).toFixed(2),
      );

      return {
        propertyId: p.id,
        source_url: p.source_url,
        location_name: p.location_name ?? '',
        price_per_sqm: pricePerSqm,
        location_avg_price_per_sqm: parseFloat(avg.toFixed(2)),
        discount_percent: discountPercent,
        tier: classifyDeal(discountPercent),
      };
    });
  }
}
