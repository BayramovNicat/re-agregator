# Feature Dependency Map & Quick Reference

## Feature Modules Overview

```
main.ts (entry point)
├── initHeader()           → Header with language toggle, alerts icon
├── initProducts()         → Grid/List/Map view, pagination, sorting
├── initSearch()           → Filters, location select, advanced options
├── initTrend()            → Price trend sparkline (location-specific)
├── initAlerts()           → Telegram alert modal
│
├── [Lazy] initPropertyDetail()  → Property modal (on PROPERTY_OPEN event)
│   ├── Gallery (lazy)
│   ├── Price history chart
│   └── Embedded map
│
├── [Lazy] initGallery()         → Full-screen image viewer
│
├── [Lazy] initMapView()         → Leaflet map with pins (on map view toggle)
│
└── [Lazy] initHeatmap()         → District heatmap (on HEATMAP_OPEN event)
```

---

## Event Bus (core/events.ts)

Central communication hub. Features emit/listen for events:

| Event | Emitted By | Listened By | Payload |
|-------|-----------|------------|---------|
| `SEARCH_STARTED` | Search | Products | `{ more?: boolean }` |
| `DEALS_UPDATED` | Search | Products, Trend, MapView | — |
| `PROPERTY_OPEN` | Products | PropertyDetail, Gallery | `Property` |
| `GALLERY_OPEN` | Products, PropertyDetail | Gallery | `{ urls, index }` |
| `HEATMAP_OPEN` | Search | Heatmap | `{ activeLocations, onAction, onSelectMany }` |
| `ALERTS_OPEN` | Products | Alerts | — |
| `LOCATION_CHANGED` | Search | Trend | `location_name` |

---

## State Management (core/state.ts)

Global state object shared across features:

```typescript
state = {
  // Results
  allResults: Property[]              // All search results
  savedOnlyResults: Property[]         // Bookmarked results
  currentTotal: number                 // Total available (for pagination)
  currentOffset: number                // Pagination offset
  
  // Filters & Search
  getFilters: () => AlertFilters       // Current filter state (built by Search)
  
  // UI State
  currentView: "grid" | "list" | "map" // Active view mode
  showingSaved: boolean                // Showing bookmarks only
  hasSearched: boolean                 // User has performed search
  loading: boolean                     // API call in progress
  
  // Persistence
  bookmarks: Set<string>               // Bookmarked URLs
  bookmarkData: Map<string, Property>  // Cached bookmark data
  hidden: Set<string>                  // Hidden property URLs
  
  // Rendering
  renderedSet: Set<string>             // Already-rendered URLs (avoid duplicates)
  scrollObserver: IntersectionObserver // Infinite scroll observer
  
  // Refs (populated by features)
  refs: {
    cards, loading, empty, welcome, resultsBar, resultsMeta,
    loadMore, savedBtn, sortSelect, tierFilter, trendPanel
  }
  
  // Constants
  PAGE: 20                             // Results per page
}
```

**Persistence:**
- `bookmarks`, `hidden` → localStorage `re-bookmarks`, `re-hidden`
- `currentView` → localStorage `re-view`
- Sort → localStorage `re-sort`
- Language → localStorage `re-lang`
- Chat ID → localStorage `re-chatid`

---

## API Endpoints

### Search & Deals
| Endpoint | Method | Query Params | Returns |
|----------|--------|--------------|---------|
| `/api/deals/locations` | GET | — | `{ data: string[] }` |
| `/api/deals/undervalued` | GET | location, threshold, limit, offset, sort, filters | `{ data: Property[], total: number }` |
| `/api/deals/trend` | GET | location | `{ data: TrendPoint[] }` |
| `/api/deals/map-pins` | GET | location, filters | `{ data: MapPin[] }` |
| `/api/deals/price-drops` | GET | — | `{ data: Property[] }` |
| `/api/deals/by-urls` | POST | `{ urls: string[] }` | `{ data: Property[] }` |
| `/api/heatmap` | GET | — | `{ data: HeatmapPoint[] }` |

### Alerts
| Endpoint | Method | Body | Returns |
|----------|--------|------|---------|
| `/api/alerts` | GET | `?chat_id=X` | `{ data: Alert[] }` |
| `/api/alerts` | POST | `{ chatId, label, filters }` | `{ token: string }` |
| `/api/alerts/:token` | DELETE | — | `{ success: boolean }` |

### Admin & Scrape
| Endpoint | Method | Body | Returns |
|----------|--------|------|---------|
| `/api/scrape/session` | GET | — | `{ authenticated: boolean }` |
| `/api/scrape/login` | POST | `{ password }` | `{ token: string }` |
| `/api/scrape/logout` | POST | — | `{ success: boolean }` |
| `/api/scrape/runs` | GET | — | `{ data: ScrapeRun[] }` |
| `/api/scrape/run` | POST | — | `{ ok: boolean }` |

### Health
| Endpoint | Method | Returns |
|----------|--------|---------|
| `/health` | GET | `{ status, timestamp, properties: number }` |

---

## UI Component Library (frontend/ui/)

Reusable components:

| Component | File | Purpose |
|-----------|------|---------|
| `Button` | button.ts | Styled button (variants: base, outline, ghost) |
| `Input` | input.ts | Text input with label |
| `Select` | select.ts | Dropdown select |
| `MultiSelect` | multi-select.ts | Multi-select dropdown |
| `Range` | range.ts | Slider input |
| `Chip` | chip.ts | Removable tag |
| `Dialog` | dialog.ts | Modal dialog |
| `Tooltip` | tooltip.ts | Hover tooltip |
| `Gallery` | gallery.ts | Image carousel |
| `Sparkline` | sparkline.ts | Mini chart |
| `Tier` | tier.ts | Deal tier badge |
| `Product` | product.ts | Property card |
| `EmptyState` | empty-state.ts | No results placeholder |
| `Skeleton` | skeleton.ts | Loading placeholder |
| `Icons` | icons.ts | SVG icon library |
| `MapBase` | map-base.ts | Leaflet map wrapper |

---

## Filter Types & Constants

### Numeric Filters (frontend/features/search/constants.ts)
```typescript
[
  { id: "minPrice", label: "Min Price", placeholder: "₼" },
  { id: "maxPrice", label: "Max Price", placeholder: "₼" },
  { id: "minPriceSqm", label: "Min Price/m²", placeholder: "₼/m²" },
  { id: "maxPriceSqm", label: "Max Price/m²", placeholder: "₼/m²" },
  { id: "minArea", label: "Min Area", placeholder: "m²" },
  { id: "maxArea", label: "Max Area", placeholder: "m²" },
  { id: "minRooms", label: "Min Rooms", placeholder: "#" },
  { id: "maxRooms", label: "Max Rooms", placeholder: "#" },
  { id: "minFloor", label: "Min Floor", placeholder: "#" },
  { id: "maxFloor", label: "Max Floor", placeholder: "#" },
  { id: "minTotalFloors", label: "Min Total Floors", placeholder: "#" },
  { id: "maxTotalFloors", label: "Max Total Floors", placeholder: "#" },
]
```

### Boolean Filters
```typescript
[
  { id: "hasRepair", label: "Has Repair" },
  { id: "hasDocument", label: "Has Document" },
  { id: "hasMortgage", label: "Has Mortgage" },
  { id: "isUrgent", label: "Is Urgent" },
  { id: "notLastFloor", label: "Not Last Floor" },
  { id: "hasActiveMortgage", label: "Has Active Mortgage" },
]
```

### Sort Options
```typescript
[
  { value: "disc", label: "Discount %" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "ppsm-asc", label: "Price/m² (Low to High)" },
  { value: "ppsm-desc", label: "Price/m² (High to Low)" },
  { value: "posted", label: "Posted (Newest)" },
]
```

---

## Tier Classification

Deal scoring in `src/modules/deals/deals.service.ts` and `src/utils/deals.ts`:

```typescript
discount_percent = (location_avg_price_per_sqm - property_price_per_sqm) / location_avg_price_per_sqm * 100

if (discount_percent > 15) → "High Value Deal" (green)
else if (discount_percent > 5) → "Good Deal" (blue)
else if (discount_percent > -5) → "Fair Price" (yellow)
else → "Overpriced" (red)
```

---

## Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `ArrowLeft` | Grid/List | Previous card |
| `ArrowRight` | Grid/List | Next card |
| `ArrowUp` | Grid/List | Card above |
| `ArrowDown` | Grid/List | Card below |
| `Enter` | Search input | Execute search |
| `Escape` | Modal open | Close modal |
| `ArrowLeft` | Property detail | Previous image |
| `ArrowRight` | Property detail | Next image |
| `Tab` | Any | Focus next element |
| `Shift+Tab` | Any | Focus previous element |

---

## localStorage Keys

| Key | Type | Example |
|-----|------|---------|
| `re-bookmarks` | JSON Set | `["url1","url2"]` |
| `re-hidden` | JSON Set | `["url3"]` |
| `re-view` | String | `"grid"` \| `"list"` \| `"map"` |
| `re-sort` | String | `"disc"` |
| `re-lang` | String | `"en"` \| `"az"` |
| `re-chatid` | String | `"123456789"` |

---

## Common Workflows

### Add a New Filter
1. Add to `AlertFilters` type in `core/types.ts`
2. Add to `getNumericFilters()` or `getBooleanFilters()` in `search/constants.ts`
3. Add UI input in `search/filters.ts`
4. Backend automatically includes in query params
5. Backend filters in `deals.controller.ts`

### Add a New Sort Option
1. Add to sort dropdown in `products/bar.ts`
2. Add sort logic in `products/logic.ts` `sortDeals()`
3. Pass sort param to API in `search/index.ts`

### Add a New View Mode
1. Add case in `setView()` in `products/index.ts`
2. Create feature module (e.g., `features/new-view/index.ts`)
3. Lazy load in `setView()`
4. Emit `DEALS_UPDATED` to trigger render

### Create a New Alert
1. User fills filters + chat ID in modal
2. POST `/api/alerts` with `{ chatId, label, filters }`
3. Backend stores in DB
4. Telegram bot listens for new deals matching filters
5. Bot sends message to chat ID

### Add a New API Endpoint
1. Create controller in `src/modules/*/controller.ts`
2. Add route in `src/routes.ts`
3. Wrap with `br()` for brotli compression
4. Frontend calls via `fetch()`

---

## Performance Tips

### Frontend
- Use `debounce()` for filter changes (500ms)
- Lazy load heavy features (gallery, heatmap, map)
- Use `IntersectionObserver` for infinite scroll
- Cache API responses in state
- Minimize re-renders (check `renderedSet`)

### Backend
- Use Prisma indexes (district, location_name, price_per_sqm)
- Cache health check (5-min TTL)
- Compress responses (brotli)
- Paginate results (20 per page)
- Use connection pooling (Prisma default)

### Database
- Index frequently filtered columns
- Use composite indexes for common filter combos
- Vacuum/analyze regularly
- Monitor slow queries

---

## Debugging Checklist

- [ ] Check console for errors
- [ ] Check Network tab for failed requests
- [ ] Check localStorage for corrupted state
- [ ] Verify API response format matches types
- [ ] Check event bus for missed emissions
- [ ] Verify feature cleanup functions called
- [ ] Check for memory leaks (DevTools Memory tab)
- [ ] Verify CSS classes applied correctly
- [ ] Check for race conditions (concurrent API calls)
- [ ] Verify localStorage quota not exceeded

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Results not updating | Event not emitted | Check `bus.emit(EVENTS.DEALS_UPDATED)` |
| Filters not applied | State not synced | Check `state.getFilters()` |
| Modal not closing | Focus trap issue | Check `dialog.close()` called |
| Images not loading | CORS or 404 | Check image URLs in API response |
| Slow pagination | Large result set | Implement clustering or virtual scroll |
| localStorage full | Too many bookmarks | Implement cleanup or compression |
| Map not rendering | Leaflet not loaded | Check lazy load triggered |
| Alerts not sending | Chat ID invalid | Verify Telegram bot token + chat ID |

---

## File Size Reference

| File | Size | Purpose |
|------|------|---------|
| `main.ts` | ~4KB | Entry point |
| `products/index.ts` | ~13KB | Grid/List/Map view |
| `search/index.ts` | ~9KB | Filters + search |
| `property-detail/index.ts` | ~5KB | Property modal |
| `alerts/index.ts` | ~3KB | Alert modal |
| `map-view/index.ts` | ~3KB | Map view |
| `heatmap/index.ts` | ~6KB | Heatmap |
| `core/state.ts` | ~2KB | Global state |
| `core/utils.ts` | ~8KB | Utilities |

**Total frontend:** ~150KB (uncompressed), ~40KB (brotli)

---

## Testing Priorities

1. **Critical:** Search, filters, results display
2. **High:** Bookmarks, alerts, property detail
3. **Medium:** Map view, heatmap, trend
4. **Low:** Language toggle, admin panel

See `TESTING.md` for full manual testing path.
