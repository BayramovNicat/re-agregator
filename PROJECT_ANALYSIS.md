# Redeal Project Analysis

## Project Overview

**Redeal** is a real estate deal aggregator for the Baku market (bina.az). It scrapes property listings, scores them by value, and provides a searchable interface with alerts via Telegram.

**Stack:** Bun + TypeScript + PostgreSQL (Prisma) + Vanilla TS frontend

**Live Features:** 21 major feature areas across search, filtering, visualization, and alerts.

---

## Architecture

### Backend (Bun + Bun.serve)

**Entry:** `src/index.ts` — HTTP server with typed route handlers

**Key Modules:**
- `src/routes.ts` — Route definitions (17 route paths / 18 methods)
- `src/modules/deals/` — Property search, scoring, filtering
- `src/modules/alerts/` — Telegram alert CRUD
- `src/modules/scrape/` — Admin scrape operations
- `src/modules/telegram/` — Webhook handler
- `src/utils/deals.ts` — Deal tier classification
- `src/utils/prisma.ts` — DB client singleton
- `src/utils/district-normalizer.ts` — Location name normalization
- `src/middleware/brotli.js` — Response compression

**Database:** PostgreSQL via Prisma
- Core table: `Property` (source_url unique, indexed on district/location/price_per_sqm)
- Indexes: district, location_name, is_urgent, price_per_sqm, composite (location_name, price_per_sqm)

**Scrapers:**
- `src/scrapers/base.scraper.ts` — Abstract interface
- `src/scrapers/bina.scraper.ts` — bina.az implementation
- Hourly cron runs 20 pages with 800ms delay

**API Surface:** 17 route paths / 18 methods
- `/health` — Status + property count
- `/api/deals/*` — Search, trend, map pins, heatmap
- `/api/alerts/*` — CRUD alerts
- `/api/scrape/*` — Admin operations
- `/api/telegram/webhook` — Bot webhook

**Compression:** All responses use brotli when client supports `Accept-Encoding: br`

---

### Frontend (Vanilla TS + Bun.serve HTML imports)

**Entry:** `frontend/main.ts` — Initializes all feature modules

**Architecture:**
- `core/` — State, types, i18n, events, utils
- `features/` — Feature modules (products, search, alerts, etc.)
- `ui/` — Reusable components (buttons, inputs, dialogs, etc.)
- `dialogs/` — Modal dialogs (property-detail, gallery, heatmap, map)

**State Management:**
- `core/state.ts` — Global state (results, filters, bookmarks, view mode)
- `core/events.ts` — Event bus (pub/sub for feature communication)
- localStorage — Persists: bookmarks, saved sort, language, chat ID

**Key Features:**

1. **Products** (`features/products/`)
   - Grid/List/Map view modes
   - Pagination with infinite scroll
   - Sorting (discount %, price, price/m², posted date)
   - Keyboard navigation (arrow keys)
   - Back-to-top button

2. **Search** (`features/search/`)
   - Location multi-select
   - Discount range slider
   - Advanced filters (price, area, rooms, floor, category, mortgage, repair, urgent, document)
   - Description text search
   - Active filter chips with removal
   - URL state sync (bookmarkable searches)

3. **Alerts** (`features/alerts/`)
   - Telegram chat ID input
   - Alert label
   - Filter preview
   - CRUD operations
   - List existing alerts

4. **Property Detail** (`features/property-detail/`)
   - Full property info modal
   - Image gallery with navigation
   - Price history chart
   - Market average comparison
   - Discount visualization
   - Bookmark/share/hide actions
   - Embedded map

5. **Gallery** (`features/gallery.ts`)
   - Full-screen image viewer
   - Arrow key navigation
   - Image counter

6. **Trend** (`features/trend/`)
   - 12-week price/m² sparkline
   - Current price display
   - % change with color coding
   - Location-specific

7. **Map View** (`features/map-view/`)
   - Leaflet-based interactive map
   - Pins colored by tier
   - Hover tooltips
   - Click to open property detail
   - Auto-fit bounds

8. **Heatmap** (`features/heatmap/`)
   - District-level price circles
   - Size by listing count
   - Color by price/m²
   - Trend indicators
   - Drag-select multiple districts
   - Integration with location filter

9. **Admin** (`features/admin.ts`)
   - Password-protected login
   - Scrape runs list
   - Manual background scrape trigger

10. **Header** (`features/header.ts`)
    - Logo
    - Language toggle
    - Alerts icon
    - Health status

11. **District Stats** (`features/district-stats/`)
    - Table view of districts
    - Sortable columns
    - Search within table

**Lazy Loading:**
- Gallery: loaded on first property open
- Heatmap: loaded on "Price Map" click
- Map View: loaded on map view activation
- Admin: loaded on `/admin` route

**Accessibility:**
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- Color + icons for indicators

**Responsive Design:**
- Desktop (1920px): 4-column grid
- Laptop (1366px): 3-column grid
- Tablet (768px): 2-column grid
- Mobile (375px): 1-column grid

**Localization:**
- English + Azerbaijani
- `core/i18n.ts` — Translation keys
- Language toggle in header
- Persisted in localStorage

---

## Data Flow

### Search Flow
1. User selects location + filters
2. `initSearch` builds query params
3. Fetch `/api/deals/undervalued?location=X&threshold=Y&...`
4. Backend filters properties, returns paginated results
5. `initProducts` renders cards
6. User can sort, bookmark, hide, open detail

### Alert Flow
1. User applies filters, opens alerts modal
2. Enters Telegram chat ID + label
3. POST `/api/alerts` with filters
4. Backend stores alert in DB
5. Telegram bot sends notifications when new deals match filters

### Scrape Flow
1. Hourly cron or manual trigger
2. `bina.scraper.ts` fetches 20 pages from bina.az
3. Parses listings, normalizes locations
4. Scores each property (tier classification)
5. Upserts into DB (source_url unique)
6. Scrape run history tracks status and results

### Map Flow
1. User switches to map view
2. Fetch `/api/deals/map-pins` with current filters
3. Backend returns lat/lng + metadata for visible properties
4. Leaflet renders pins, colored by tier
5. Hover/click interactions handled client-side

---

## Key Algorithms

### Deal Scoring (`src/modules/deals/deals.service.ts`, `src/utils/deals.ts`)
- Calculates `discount_percent` = (location_avg - property_price) / location_avg * 100
- Classifies tier based on discount:
  - **High Value Deal** (green): discount > 15%
  - **Good Deal** (blue): discount 5-15%
  - **Fair Price** (yellow): discount -5 to 5%
  - **Overpriced** (red): discount < -5%

### Location Normalization (`src/utils/district-normalizer.ts`)
- Maps bina.az location names to canonical district names
- Handles typos, aliases, variations
- Ensures consistent grouping for analytics

### Heatmap Radius Calculation
- `radius = MIN(500, 140 + sqrt(count) * 11)`
- Scales circle size by listing count
- Prevents overlap at extreme counts

---

## Performance Characteristics

### Backend
- **Brotli compression:** ~70% size reduction on JSON responses
- **Health cache:** 5-minute TTL to avoid repeated DB counts
- **Scrape delay:** 800ms between requests to avoid rate limiting
- **Pagination:** 20 results per page (configurable via `state.PAGE`)

### Frontend
- **Lazy loading:** Gallery, heatmap, map loaded on demand
- **Debounced search:** 500ms debounce on filter changes
- **Infinite scroll:** Sentinel element triggers load-more at bottom
- **localStorage:** Persists bookmarks, sort, language, chat ID
- **Service Worker:** Caches static assets

### Database
- **Indexes:** district, location_name, is_urgent, price_per_sqm, composite
- **Unique constraint:** source_url (prevents duplicates)
- **Query patterns:** Filtered by location + price range + custom filters

---

## Known Limitations & TODOs

### Frontend
- [ ] No offline mode (SW caches assets but not data)
- [ ] No dark mode toggle (theme hardcoded)
- [ ] Map view doesn't show all 1000+ results (performance)
- [ ] Gallery doesn't support video
- [ ] No export to CSV/PDF

### Backend
- [ ] Single scraper (bina.az only)
- [ ] No rate limiting on API endpoints
- [ ] No authentication for non-admin endpoints
- [ ] Telegram alerts require manual chat ID entry (no OAuth)
- [ ] No deal history tracking (only current + price history)

### Data
- [ ] Location names may have inconsistencies (normalizer handles most)
- [ ] Some properties missing lat/lng (map view incomplete)
- [ ] Price history limited to recent changes

---

## Testing Coverage

### Manual Testing
- **21 feature areas** covered in `TESTING.md`
- **Smoke test:** 12 core flows
- **Regression:** Sections 1-5 + smoke test after changes

### Automated Testing
- No unit tests currently
- No E2E tests currently
- Type checking: `bun run typecheck`

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Deployment

### Development
```bash
bun run dev          # Hot reload, dev server on :3000
bun run typecheck    # Type check
bun test             # Run tests (if any)
```

### Production
```bash
bun build frontend/main.ts  # Bundle frontend
bun run src/index.ts        # Start server
```

**Environment:**
- `.env` auto-loaded by Bun
- Required: `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `ADMIN_PASSWORD`

---

## Code Quality

### Conventions
- **No framework:** Vanilla TS, Bun.serve, no Express
- **No ORM abstractions:** Direct Prisma queries
- **Minimal comments:** Only for non-obvious logic
- **Event-driven:** Features communicate via event bus
- **Lazy loading:** Heavy features loaded on demand
- **Semantic HTML:** Accessibility-first

### File Organization
- `src/` — Backend (routes, services, scrapers, utils)
- `frontend/` — Frontend (features, ui, core)
- `public/` — Static assets
- `prisma/` — Schema + migrations

---

## Next Steps (Recommendations)

1. **Add unit tests** for analytics, normalizer, scraper
2. **Add E2E tests** for critical flows (search, alert, bookmark)
3. **Implement dark mode** toggle
4. **Add more scrapers** (other real estate sites)
5. **Implement authentication** for API endpoints
6. **Add deal history** tracking (price changes over time)
7. **Optimize map view** for 1000+ pins (clustering)
8. **Add export** functionality (CSV, PDF)
9. **Implement offline mode** (SW caches search results)
10. **Add analytics** (user behavior, popular searches)

---

## Contact & Support

- **Dev Server:** `bun run dev` (port 3000)
- **Admin:** `/admin` (password-protected)
- **Telegram:** Bot token in `.env`
