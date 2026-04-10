# re-agregator

Real estate deal-finding aggregator for the Azerbaijani (Baku) market. Scrapes property listings from bina.az, stores them in Postgres via Prisma, and exposes a REST API to surface undervalued deals, urgent listings, and location analytics.

## Stack

- **Runtime:** Bun
- **Server:** `Bun.serve()` (no Express)
- **Database:** PostgreSQL via Prisma ORM
- **Language:** TypeScript

## Setup

1. Install dependencies:

```bash
bun install
```

2. Create a `.env` file with your database URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/re_agregator"
```

3. Apply the database schema:

```bash
bun run db:push
```

## Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start with hot reload (`bun --hot`) |
| `bun run start` | Start for production |
| `bun run typecheck` | Type-check without emitting |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:migrate` | Run migrations (dev) |
| `bun run db:push` | Push schema to DB without migration |
| `bun run db:studio` | Open Prisma Studio |

## API Endpoints

### Health

```
GET /health
```

Returns `{ status: "ok", timestamp }`.

### Deals

```
GET /api/deals/locations
```
Returns all distinct location names in the database.

```
GET /api/deals/urgent
```
Returns all listings marked `is_urgent = true`, newest first.

```
GET /api/deals/undervalued
```
Returns listings priced below the location average by at least `threshold`%.

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `location` | string | required | Exact location name (e.g. `Memar Əcəmi m.`) |
| `threshold` | number | `10` | Minimum % discount vs location average |
| `minPrice` / `maxPrice` | number | — | Total price range (AZN) |
| `minArea` / `maxArea` | number | — | Area range (m²) |
| `minRooms` / `maxRooms` | number | — | Room count range |
| `minFloor` / `maxFloor` | number | — | Floor range |
| `maxTotalFloors` | number | — | Max building height |
| `hasDocument` | boolean | — | Filter by document status |
| `hasMortgage` | boolean | — | Filter by mortgage eligibility |
| `hasRepair` | boolean | — | Filter by repair status |
| `isUrgent` | boolean | — | Filter urgent listings only |
| `category` | string | — | Property category |

Each result includes `discount_percent` and `tier` (`High Value Deal` / `Good Deal` / `Fair Price` / `Overpriced`).

### Scraping

```
POST /api/scrape/trigger
```
Runs a full scrape and returns summary stats.

Optional JSON body:

```json
{ "maxPages": 20, "startPage": 1, "endPage": 10, "delayMs": 800 }
```

```
GET /api/scrape/stream
```
Streams live scrape progress as Server-Sent Events.

Optional query params: `maxPages`, `startPage`, `endPage`, `delayMs`.

## Deal Score Methodology

```
discount_percent = ((location_avg_price_per_sqm - property_price_per_sqm) / location_avg_price_per_sqm) × 100
```

| Discount | Tier |
|---|---|
| ≥ 20% | High Value Deal |
| 10–19% | Good Deal |
| 0–9% | Fair Price |
| Negative | Overpriced |

## Project Structure

```
src/
  index.ts                   # Bun.serve() entry point
  controllers/
    deals.controller.ts      # Deal/location HTTP handlers
    scrape.controller.ts     # Trigger & stream scrape handlers
  services/
    analytics.service.ts     # Deal scoring & queries
    scraping.service.ts      # Orchestrates scrapers
  scrapers/
    base.scraper.ts          # Abstract scraper interface
    bina.scraper.ts          # bina.az scraper
  utils/
    prisma.ts                # Prisma client singleton
    district-normalizer.ts   # Location name normalization
prisma/
  schema.prisma              # DB schema (Property model)
public/                      # Static frontend (served as SPA fallback)
```
