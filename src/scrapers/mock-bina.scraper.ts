/**
 * Mock scraper for bina.az.
 *
 * In production this class would:
 *  1. Fetch listing-index pages with axios/got
 *  2. Parse HTML with Cheerio (static) or Playwright (JS-rendered pages)
 *  3. Follow pagination until maxPages is reached
 *
 * For now it operates on hard-coded mock data that mirrors the HTML
 * structure you'd find on a typical Azerbaijani real estate portal.
 */

import { BaseScraper, type ScrapedListing, type ScraperOptions } from './base.scraper.js';
import { normalizeDistrict } from '../utils/district-normalizer.js';

interface RawListing {
  url: string;
  priceText: string;
  areaText: string;
  districtText: string;
  descriptionText: string;
  postedDateText: string;
}

/** Simulates rows that would be scraped from bina.az listing pages */
const MOCK_LISTINGS: RawListing[] = [
  {
    url: 'https://bina.az/listings/1',
    priceText: '95 000 AZN',
    areaText: '75 kv.m',
    districtText: 'Yasamal r.',
    descriptionText: 'Təcili satılır! 3 otaqlı mənzil, yeni tikili.',
    postedDateText: '2024-01-10',
  },
  {
    url: 'https://bina.az/listings/2',
    priceText: '185 000 AZN',
    areaText: '90 kv.m',
    districtText: 'Nasimi ray.',
    descriptionText: '4 otaqlı köhnə tikili, əla vəziyyətdə.',
    postedDateText: '2024-01-11',
  },
  {
    url: 'https://bina.az/listings/3',
    priceText: '62 000 AZN',
    areaText: '55 kv.m',
    districtText: 'Nərimanov r.',
    descriptionText: 'Təcili! 2 otaqlı, orta mərtəbə, sənədlər hazırdır.',
    postedDateText: '2024-01-12',
  },
  {
    url: 'https://bina.az/listings/4',
    priceText: '210 000 AZN',
    areaText: '110 kv.m',
    districtText: 'Nizami r.',
    descriptionText: '5 otaqlı mənzil, hamam, sauna daxil.',
    postedDateText: '2024-01-12',
  },
  {
    url: 'https://bina.az/listings/5',
    priceText: '78 000 AZN',
    areaText: '70 kv.m',
    districtText: 'Yasamal rayonu',
    descriptionText: 'Yasamalda 3 otaqlı mənzil, mülkiyyət.',
    postedDateText: '2024-01-13',
  },
  {
    url: 'https://bina.az/listings/6',
    priceText: '145 000 AZN',
    areaText: '88 kv.m',
    districtText: 'Nasimi r.',
    descriptionText: 'Neftçilər m. yaxınlığında, 4 otaqlı.',
    postedDateText: '2024-01-13',
  },
  {
    url: 'https://bina.az/listings/7',
    priceText: '55 000 AZN',
    areaText: '48 kv.m',
    districtText: 'Binəqədi r.',
    descriptionText: 'Binəqədidə 2 otaqlı mənzil, təcili satılır.',
    postedDateText: '2024-01-14',
  },
  {
    url: 'https://bina.az/listings/8',
    priceText: '320 000 AZN',
    areaText: '150 kv.m',
    districtText: 'Səbail r.',
    descriptionText: 'Səbaildə 5 otaqlı mənzil, dəniz mənzərəsi.',
    postedDateText: '2024-01-14',
  },
  {
    url: 'https://bina.az/listings/9',
    priceText: '112 000 AZN',
    areaText: '82 kv.m',
    districtText: 'Yasamal r.',
    descriptionText: '3 otaqlı, yeni tikili, tam təmirli.',
    postedDateText: '2024-01-15',
  },
  {
    url: 'https://bina.az/listings/10',
    priceText: '167 000 AZN',
    areaText: '95 kv.m',
    districtText: 'Nasimi r.',
    descriptionText: 'Mərkəzdə, 4 otaqlı, sənədlər qaydasındadır.',
    postedDateText: '2024-01-15',
  },
];

export class MockBinaScraper extends BaseScraper {
  readonly platform = 'bina.az';

  async scrape(options: ScraperOptions = {}): Promise<ScrapedListing[]> {
    const { delayMs = 100 } = options;
    const listings: ScrapedListing[] = [];

    console.log(`[${this.platform}] Starting mock scrape (${MOCK_LISTINGS.length} listings)...`);

    for (const item of MOCK_LISTINGS) {
      await this.delay(delayMs);

      const price = this.parsePrice(item.priceText);
      const area_sqm = this.parseArea(item.areaText);

      if (price === 0 || area_sqm === 0) {
        console.warn(`[${this.platform}] Skipping invalid listing: ${item.url}`);
        continue;
      }

      const district = normalizeDistrict(item.districtText);
      const is_urgent = this.isUrgent(item.descriptionText);

      listings.push({
        source_url: item.url,
        price,
        area_sqm,
        district,
        description: item.descriptionText,
        is_urgent,
        posted_date: new Date(item.postedDateText),
      });

      console.log(
        `[${this.platform}] ✓ ${item.url} — ${district}, ${price} AZN, ${area_sqm} m², urgent=${is_urgent}`,
      );
    }

    return listings;
  }
}
