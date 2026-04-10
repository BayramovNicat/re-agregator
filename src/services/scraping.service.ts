/**
 * ScrapingService orchestrates the scraping pipeline.
 * It runs all registered scrapers and upserts results into the database,
 * computing price_per_sqm before persistence.
 */

import type { IScraper, ScrapedListing, ScraperOptions, ScrapeProgressEvent } from '../scrapers/base.scraper.js';
import { prisma } from '../utils/prisma.js';

export interface ScrapeResult {
  platform: string;
  persisted: number;
  skipped: number;
  errors: string[];
}

export class ScrapingService {
  private scrapers: IScraper[];

  constructor(scrapers: IScraper[] = []) {
    this.scrapers = scrapers;
  }

  /** Adds a scraper implementation at runtime */
  registerScraper(scraper: IScraper): void {
    this.scrapers.push(scraper);
  }

  /**
   * Triggers all registered scrapers sequentially and persists results.
   * Returns a per-platform summary of what was upserted vs skipped.
   */
  async runAll(options?: ScraperOptions): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const scraper of this.scrapers) {
      const result: ScrapeResult = {
        platform: scraper.platform,
        persisted: 0,
        skipped: 0,
        errors: [],
      };

      try {
        const listings = await scraper.scrape(options);
        options?.onProgress?.({ type: 'persisting', platform: scraper.platform, count: listings.length });
        const { persisted, skipped, errors } = await this.persistListings(listings);
        result.persisted = persisted;
        result.skipped = skipped;
        result.errors = errors;
        console.log(
          `[ScrapingService] ${scraper.platform}: persisted=${persisted} skipped=${skipped}`,
        );
        options?.onProgress?.({ type: 'done', platform: scraper.platform, persisted, skipped });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[ScrapingService] ${scraper.platform} failed: ${message}`);
        result.errors.push(message);
        options?.onProgress?.({ type: 'error', platform: scraper.platform, message });
      }

      results.push(result);
    }

    const total_persisted = results.reduce((sum, r) => sum + r.persisted, 0);
    options?.onProgress?.({ type: 'complete', total_persisted });
    return results;
  }

  private async persistListings(
    listings: ScrapedListing[],
  ): Promise<{ persisted: number; skipped: number; errors: string[] }> {
    let persisted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const listing of listings) {
      try {
        const price_per_sqm =
          listing.area_sqm > 0
            ? parseFloat((listing.price / listing.area_sqm).toFixed(2))
            : 0;

        await prisma.property.upsert({
          where: { source_url: listing.source_url },
          update: {
            price: listing.price,
            area_sqm: listing.area_sqm,
            price_per_sqm,
            district: listing.district,
            location_name: listing.location_name,
            latitude: listing.latitude,
            longitude: listing.longitude,
            rooms: listing.rooms,
            floor: listing.floor,
            total_floors: listing.total_floors,
            category: listing.category,
            has_document: listing.has_document,
            has_mortgage: listing.has_mortgage,
            has_repair: listing.has_repair,
            description: listing.description,
            is_urgent: listing.is_urgent,
            posted_date: listing.posted_date,
          },
          create: {
            source_url: listing.source_url,
            price: listing.price,
            area_sqm: listing.area_sqm,
            price_per_sqm,
            district: listing.district,
            location_name: listing.location_name,
            latitude: listing.latitude,
            longitude: listing.longitude,
            rooms: listing.rooms,
            floor: listing.floor,
            total_floors: listing.total_floors,
            category: listing.category,
            has_document: listing.has_document,
            has_mortgage: listing.has_mortgage,
            has_repair: listing.has_repair,
            description: listing.description,
            is_urgent: listing.is_urgent,
            posted_date: listing.posted_date,
          },
        });
        persisted++;
      } catch (err) {
        skipped++;
        errors.push(
          `${listing.source_url}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return { persisted, skipped, errors };
  }
}
