# Redeal

Real estate deal aggregator for the Baku market. Continuously scrapes bina.az, scores every listing against its neighbourhood average, and surfaces undervalued properties through an interactive frontend.

## What it does

- **Scrapes bina.az** hourly, normalises location names, and stores listings in Postgres
- **Scores deals** by comparing each property's ₼/m² against its location average — tiers from _High Value Deal_ down to _Overpriced_
- **Filters** by price, area, rooms, floor, document status, mortgage eligibility, repair, urgency, and category
- **Three views** — grid cards, compact list, and an interactive map with property pins; hover for a quick summary, click for full detail
- **District statistics** — price trend charts and sorted location rankings
- **Property detail** — image gallery, map location, deal score breakdown, and a direct link to the source listing
- **Telegram alerts** — subscribe to a filter set and get notified when new matching deals appear
- **Live scrape stream** — watch scraping progress in real time via Server-Sent Events

## Stack

- **Runtime:** Bun
- **Server:** `Bun.serve()` (no Express)
- **Database:** PostgreSQL via Prisma ORM
- **Language:** TypeScript (server + frontend, no framework)

## Setup

1. Install dependencies:

```bash
bun install
```

2. Create `.env` with your database URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/re_agregator"
```

3. Apply database schema:

```bash
bun run db:push
```

4. Start the dev server:

```bash
bun run dev
```

## Scripts

| Script              | Description                         |
| ------------------- | ----------------------------------- |
| `bun run dev`       | Start with hot reload               |
| `bun run start`     | Start for production                |
| `bun run typecheck` | Type-check without emitting         |
| `bun run db:push`   | Push schema to DB without migration |
| `bun run db:studio` | Open Prisma Studio                  |

## Deal Score Methodology

```
discount_percent = ((location_avg_price_per_sqm - property_price_per_sqm) / location_avg_price_per_sqm) × 100
```

| Discount | Tier            |
| -------- | --------------- |
| ≥ 20%    | High Value Deal |
| 10–19%   | Good Deal       |
| 0–9%     | Fair Price      |
| Negative | Overpriced      |

## Documentation

Complete guides for testing, development, and architecture:

| Document | Purpose | Time |
|----------|---------|------|
| **[TESTING.md](TESTING.md)** | Manual testing path for all 21 features | 2–3 hours |
| **[PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)** | Architecture, data flow, algorithms | 10 min |
| **[FEATURE_MAP.md](FEATURE_MAP.md)** | Feature dependencies, event bus, state | 10 min |
| **[API_REFERENCE.md](API_REFERENCE.md)** | Complete API docs, database schema | 15 min |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | Dev setup, common tasks, debugging | 20 min |

### Quick Start

1. **Setup:** `bun install && bun run db:push`
2. **Dev:** `bun run dev` (http://localhost:3000)
3. **Test:** Follow Section 21 in [TESTING.md](TESTING.md) (10 min smoke test)
4. **Learn:** Read [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) for architecture

### Common Tasks

- **Add a filter?** → See [DEVELOPMENT.md](DEVELOPMENT.md) "Add a New Filter"
- **Add a sort option?** → See [DEVELOPMENT.md](DEVELOPMENT.md) "Add a New Sort Option"
- **Add an API endpoint?** → See [DEVELOPMENT.md](DEVELOPMENT.md) "Add a New API Endpoint"
- **Debug an issue?** → See [DEVELOPMENT.md](DEVELOPMENT.md) "Debugging Tools"
- **Understand the API?** → Read [API_REFERENCE.md](API_REFERENCE.md)
- **Test everything?** → Follow [TESTING.md](TESTING.md)

## Project Stats

| Metric | Value |
|--------|-------|
| Features | 21 major areas |
| API Endpoints | 20 |
| Frontend Modules | 11 |
| UI Components | 14 |
| Database Tables | 3 |
| Languages | 2 (EN, AZ) |
| View Modes | 3 (Grid, List, Map) |
| Sort Options | 6 |
| Filter Types | 18 |
| Frontend Size | ~150KB uncompressed, ~40KB brotli |

## Architecture

```
Frontend (Vanilla TS)
  ├─ core/ (state, events, types, i18n)
  ├─ features/ (11 modules, lazy-loaded)
  └─ ui/ (14 reusable components)
         ↓ HTTP (brotli compressed)
Backend (Bun + Bun.serve)
  ├─ routes/ (20 endpoints)
  ├─ modules/ (deals, alerts, scrape, telegram)
  ├─ services/ (analytics, telegram, alerts)
  └─ scrapers/ (bina.az)
         ↓ SQL
Database (PostgreSQL + Prisma)
  ├─ Property (12,847 listings)
  ├─ Alert (user-defined searches)
  └─ ScrapeRun (hourly history)
```

## Features

### Search & Filtering
- Location multi-select with 8+ districts
- Discount range slider (0–100%)
- 18 advanced filters (price, area, rooms, floor, category, mortgage, repair, urgent, document, etc.)
- Description text search
- Active filter chips with one-click removal
- URL state sync (bookmarkable searches)

### Views
- **Grid:** Responsive 4→3→2→1 columns (desktop→mobile)
- **List:** Compact rows with key metrics
- **Map:** Interactive Leaflet map with tier-colored pins, hover tooltips, click-to-detail

### Sorting
- Discount % (default)
- Price (low/high)
- Price/m² (low/high)
- Posted date (newest)

### Property Detail
- Full-screen image gallery with arrow navigation
- Price history chart (12-week trend)
- Market average comparison
- Discount visualization
- Bookmark/share/hide actions
- Embedded map with property location

### Alerts
- Telegram integration (chat ID + label)
- Filter preview before saving
- CRUD operations (create, list, delete)
- Real-time notifications on new matching deals

### Analytics
- 12-week price/m² trend sparkline (location-specific)
- District heatmap (price circles, size by count, trend indicators)
- Price drop tracking
- Tier distribution breakdown

### Admin
- Password-protected scrape operations
- Manual scrape trigger
- Real-time progress via Server-Sent Events
- Scrape run history

## Performance

- **Brotli compression:** ~70% size reduction on API responses
- **Lazy loading:** Gallery, heatmap, map loaded on demand
- **Pagination:** 20 results per page with infinite scroll
- **Debouncing:** 500ms on filter changes
- **Caching:** Health check (5-min TTL), trend data (client-side)
- **Indexes:** On district, location_name, price_per_sqm, composite

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `Arrow Keys` | Grid/List | Navigate cards |
| `Enter` | Search | Execute search |
| `Escape` | Modal | Close modal |
| `Arrow Left/Right` | Property Detail | Previous/next image |

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_PASSWORD=your_admin_password
NODE_ENV=development
PORT=3000
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No results | Select location, reduce filters |
| Bookmarks lost | Check localStorage quota |
| Map not loading | Check console for errors, verify container height |
| Alerts not sending | Verify bot token and chat ID in .env |
| Slow search | Check API response time, add DB indexes |

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed debugging guide.

## Development

```bash
# Type check
bun run typecheck

# Database GUI
bun run db:studio

# Database migrations
bun run db:push
bun run db:pull

# Production build
bun build frontend/main.ts
bun run src/index.ts
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for complete development guide.

## Testing

Manual testing path covers all 21 features with step-by-step instructions. See [TESTING.md](TESTING.md).

**Smoke test (10 min):** Load → search → filter → view → bookmark → alert → reload

## Deployment

1. Build frontend: `bun build frontend/main.ts`
2. Set environment variables
3. Run: `bun run src/index.ts` (or use PM2)
4. Verify: `curl http://localhost:3000/health`

See [DEVELOPMENT.md](DEVELOPMENT.md) "Deployment Checklist" for full pre-deployment steps.

## License

MIT
