# Backend API Reference & Architecture

## API Endpoints (Complete Reference)

### Health & Status

#### GET /health
Returns server status and property count.

**Query Params:** None

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-09T13:42:00.462Z",
  "properties": 12847
}
```

**Cache:** 5 minutes (TTL)

**Compression:** Brotli

---

### Deals & Search

#### GET /api/deals/locations
Returns distinct location names for dropdown.

**Query Params:** None

**Response:**
```json
{
  "data": [
    "Nəsimi",
    "Səbail",
    "Xətai",
    "Binəqədi",
    "Suraxanı",
    "Yasamal",
    "Abşeron",
    "Gəncə"
  ]
}
```

**Compression:** Brotli

---

#### GET /api/deals/undervalued
Main search endpoint. Returns filtered, scored properties.

**Query Params:**
```
location=Nəsimi                    // Required: location name or "__all__"
threshold=10                       // Required: discount % threshold
limit=20                          // Optional: results per page (default 20)
offset=0                          // Optional: pagination offset (default 0)
sort=disc                         // Optional: sort key (disc|price-asc|price-desc|ppsm-asc|ppsm-desc|posted)
minPrice=50000                    // Optional: min price (₼)
maxPrice=150000                   // Optional: max price (₼)
minPriceSqm=1000                  // Optional: min price/m² (₼/m²)
maxPriceSqm=3000                  // Optional: max price/m² (₼/m²)
minArea=50                        // Optional: min area (m²)
maxArea=200                       // Optional: max area (m²)
minRooms=1                        // Optional: min rooms
maxRooms=4                        // Optional: max rooms
minFloor=1                        // Optional: min floor
maxFloor=10                       // Optional: max floor
minTotalFloors=5                  // Optional: min total floors
maxTotalFloors=20                 // Optional: max total floors
category=apartment                // Optional: category (apartment|house|land|etc)
hasRepair=true                    // Optional: has repair (true|false)
hasDocument=true                  // Optional: has document (true|false)
hasMortgage=true                  // Optional: has mortgage (true|false)
isUrgent=true                     // Optional: is urgent (true|false)
notLastFloor=true                 // Optional: not last floor (true|false)
hasActiveMortgage=true            // Optional: has active mortgage (true|false)
descriptionSearch=renovated       // Optional: search in description
```

**Response:**
```json
{
  "data": [
    {
      "source_url": "https://bina.az/...",
      "price": 125000,
      "area_sqm": 85,
      "price_per_sqm": 1470,
      "location_avg_price_per_sqm": 1650,
      "discount_percent": 11.0,
      "tier": "Good Deal",
      "district": "Nəsimi",
      "location_name": "Nəsimi, Baku",
      "rooms": 2,
      "floor": 5,
      "total_floors": 9,
      "is_urgent": false,
      "has_document": true,
      "has_repair": true,
      "has_mortgage": false,
      "has_active_mortgage": false,
      "price_drop_count": 2,
      "posted_date": "2026-05-08T10:30:00Z",
      "description": "Renovated 2-room apartment...",
      "image_urls": ["https://...", "https://..."],
      "latitude": 40.3855,
      "longitude": 49.8671
    }
  ],
  "total": 342
}
```

**Sorting:**
- `disc` — Discount % (descending)
- `price-asc` — Price (ascending)
- `price-desc` — Price (descending)
- `ppsm-asc` — Price/m² (ascending)
- `ppsm-desc` — Price/m² (descending)
- `posted` — Posted date (newest first)

**Compression:** Brotli

---

#### GET /api/deals/trend
Returns 12-week price trend for a location.

**Query Params:**
```
location=Nəsimi  // Required: location name
```

**Response:**
```json
{
  "data": [
    {
      "week": "2026-02-16",
      "avg_ppsm": 1520,
      "listing_count": 45
    },
    {
      "week": "2026-02-23",
      "avg_ppsm": 1540,
      "listing_count": 48
    },
    {
      "week": "2026-03-02",
      "avg_ppsm": 1580,
      "listing_count": 52
    }
  ]
}
```

**Compression:** Brotli

---

#### GET /api/deals/map-pins
Returns lat/lng pins for map view (filtered by current search).

**Query Params:**
```
location=Nəsimi              // Optional: location filter
minPrice=50000               // Optional: price filters
maxPrice=150000
minPriceSqm=1000
maxPriceSqm=3000
// ... other filters same as /api/deals/undervalued
```

**Response:**
```json
{
  "data": [
    {
      "source_url": "https://bina.az/...",
      "lat": 40.3855,
      "lng": 49.8671,
      "price": 125000,
      "price_per_sqm": 1470,
      "area_sqm": 85,
      "floor": 5,
      "total_floors": 9,
      "rooms": 2,
      "location_name": "Nəsimi",
      "image_url": "https://...",
      "discount_percent": 11.0,
      "tier": "Good Deal"
    }
  ]
}
```

**Compression:** Brotli

---

#### GET /api/deals/price-drops
Returns properties with recent price drops.

**Query Params:** None

**Response:**
```json
{
  "data": [
    {
      "source_url": "https://bina.az/...",
      "price": 125000,
      "price_drop_count": 3,
      "price_history": [
        { "price": "135000", "recorded_at": "2026-05-07T10:00:00Z" },
        { "price": "130000", "recorded_at": "2026-05-06T10:00:00Z" },
        { "price": "125000", "recorded_at": "2026-05-05T10:00:00Z" }
      ]
      // ... other property fields
    }
  ]
}
```

**Compression:** Brotli

---

#### POST /api/deals/by-urls
Fetch properties by specific URLs (for bookmarks).

**Body:**
```json
{
  "urls": [
    "https://bina.az/...",
    "https://bina.az/..."
  ]
}
```

**Response:**
```json
{
  "data": [
    {
      "source_url": "https://bina.az/...",
      // ... full property object
    }
  ]
}
```

**Compression:** Brotli

---

#### GET /api/heatmap
Returns district-level heatmap data (price circles).

**Query Params:** None

**Response:**
```json
{
  "data": [
    {
      "location_name": "Nəsimi",
      "avg_price_per_sqm": 1650,
      "count": 342,
      "lat": 40.3855,
      "lng": 49.8671,
      "recent_avg": 1680,
      "prior_avg": 1620,
      "trend": "up"
    },
    {
      "location_name": "Səbail",
      "avg_price_per_sqm": 1420,
      "count": 287,
      "lat": 40.3705,
      "lng": 49.8505,
      "recent_avg": 1400,
      "prior_avg": 1450,
      "trend": "down"
    }
  ]
}
```

**Compression:** Brotli

---

### Alerts (Telegram)

#### GET /api/alerts
List alerts for a chat ID.

**Query Params:**
```
chat_id=123456789  // Required: Telegram chat ID
```

**Response:**
```json
{
  "data": [
    {
      "token": "abc123def456",
      "label": "My Nəsimi Alert",
      "filters": {
        "location": "Nəsimi",
        "threshold": 10,
        "minPrice": 50000,
        "maxPrice": 150000,
        "minPriceSqm": 1000,
        "maxPriceSqm": 3000,
        "hasRepair": true
      }
    }
  ]
}
```

**Compression:** Brotli

---

#### POST /api/alerts
Create a new alert.

**Body:**
```json
{
  "chatId": "123456789",
  "label": "My Nəsimi Alert",
  "filters": {
    "location": "Nəsimi",
    "threshold": 10,
    "minPrice": 50000,
    "maxPrice": 150000,
    "minPriceSqm": 1000,
    "maxPriceSqm": 3000,
    "hasRepair": true
  }
}
```

**Response:**
```json
{
  "token": "abc123def456",
  "success": true
}
```

**Compression:** Brotli

---

#### DELETE /api/alerts/:token
Deactivate an alert.

**URL Params:**
```
token=abc123def456  // Alert token
```

**Response:**
```json
{
  "success": true
}
```

**Compression:** Brotli

---

### Scrape Operations (Admin)

#### GET /api/scrape/session
Check admin session status.

**Query Params:** None

**Response:**
```json
{
  "authenticated": true
}
```

**Compression:** Brotli

---

#### POST /api/scrape/login
Admin login with password.

**Body:**
```json
{
  "password": "admin_password"
}
```

**Response:**
```json
{
  "token": "session_token",
  "success": true
}
```

**Compression:** Brotli

---

#### POST /api/scrape/logout
Admin logout.

**Body:** None

**Response:**
```json
{
  "success": true
}
```

**Compression:** Brotli

---

#### GET /api/scrape/runs
List recent scrape runs.

**Query Params:** None

**Response:**
```json
{
  "data": [
    {
      "id": "run_123",
      "started_at": "2026-05-09T12:00:00Z",
      "completed_at": "2026-05-09T12:15:30Z",
      "status": "completed",
      "properties_scraped": 847,
      "properties_new": 23,
      "properties_updated": 156,
      "errors": 0
    }
  ]
}
```

**Compression:** Brotli

---

#### POST /api/scrape/run
Trigger manual scrape (admin only).

**Body:** None

**Response:** Server-Sent Events (SSE) stream

```
data: {"status":"starting","message":"Initializing scraper..."}
data: {"status":"scraping","page":1,"total_pages":40,"properties":23}
data: {"status":"scraping","page":2,"total_pages":40,"properties":45}
...
data: {"status":"completed","total_properties":847,"new":23,"updated":156}
```

**Compression:** Not applicable (SSE)

---

### Telegram Webhook

#### POST /api/telegram/webhook
Telegram bot webhook (called by Telegram servers).

**Body:** Telegram Update object (JSON)

**Response:**
```json
{
  "ok": true
}
```

**Compression:** Brotli

---

## Backend Architecture

### Directory Structure

```
src/
├── index.ts                    # Server entry point (Bun.serve)
├── routes.ts                   # Route definitions
├── middleware/
│   └── brotli.js              # Response compression middleware
├── modules/
│   ├── deals/
│   │   ├── deals.controller.ts # Search, trend, heatmap handlers
│   │   ├── deals.service.ts    # Query building, filtering
│   │   └── deals.repository.ts # DB queries
│   ├── alerts/
│   │   ├── alerts.controller.ts
│   │   ├── alerts.service.ts
│   │   └── alerts.repository.ts
│   ├── scrape/
│   │   ├── scrape.controller.ts
│   │   └── scrape.service.ts
│   └── telegram/
│       ├── telegram.controller.ts
│       └── telegram.service.ts
├── services/
│   ├── analytics.service.ts    # Deal scoring, tier classification
│   ├── telegram.service.ts     # Telegram bot integration
│   └── alert.service.ts        # Alert matching logic
├── scrapers/
│   ├── base.scraper.ts         # Abstract scraper interface
│   └── bina.scraper.ts         # bina.az implementation
├── utils/
│   ├── prisma.ts               # Prisma client singleton
│   ├── district-normalizer.ts  # Location name normalization
│   └── logger.ts               # Logging utility
└── types/
    └── index.ts                # TypeScript types
```

### Request Flow

```
HTTP Request
    ↓
routes.ts (route matching)
    ↓
middleware/brotli.js (compression wrapper)
    ↓
Controller (request parsing, validation)
    ↓
Service (business logic)
    ↓
Repository (DB queries via Prisma)
    ↓
Database (PostgreSQL)
    ↓
Response (JSON, brotli compressed)
```

### Data Flow: Search

```
Frontend: fetch(/api/deals/undervalued?location=X&filters=Y)
    ↓
deals.controller.ts: getUndervaluedDeals()
    ↓
deals.service.ts: buildSearchQuery()
    ├─ Parse filters
    ├─ Build Prisma where clause
    └─ Apply sorting
    ↓
deals.repository.ts: findProperties()
    ├─ Query DB with filters
    ├─ Calculate discount_percent
    ├─ Classify tier
    └─ Return paginated results
    ↓
Response: { data: Property[], total: number }
    ↓
middleware/brotli.js: Compress response
    ↓
Frontend: Render results
```

### Data Flow: Alert Creation

```
Frontend: POST /api/alerts { chatId, label, filters }
    ↓
alerts.controller.ts: createAlert()
    ↓
alerts.service.ts: validateAndSave()
    ├─ Validate chat ID
    ├─ Validate filters
    └─ Generate token
    ↓
alerts.repository.ts: saveAlert()
    ├─ Insert into DB
    └─ Return token
    ↓
Response: { token, success: true }
    ↓
Frontend: Store token, show in list
```

### Data Flow: Scrape & Alert Matching

```
Hourly Cron / Manual Trigger
    ↓
scrape.service.ts: runScrape()
    ├─ Initialize bina.scraper
    ├─ Fetch 40 pages (800ms delay)
    ├─ Parse listings
    ├─ Normalize locations
    ├─ Score properties (analytics.service)
    └─ Upsert into DB
    ↓
alert.service.ts: matchAlerts()
    ├─ For each new property
    ├─ Check against all alerts
    ├─ If matches, queue message
    └─ Send via Telegram bot
    ↓
telegram.service.ts: sendMessage()
    ├─ Format message
    ├─ Call Telegram API
    └─ Log result
```

### Database Schema (Prisma)

```prisma
model Property {
  id                    Int       @id @default(autoincrement())
  source_url            String    @unique
  price                 Int
  area_sqm              Float
  price_per_sqm         Float
  location_avg_price_per_sqm Float
  discount_percent      Float
  tier                  String    // "High Value Deal", "Good Deal", "Fair Price", "Overpriced"
  district              String?
  location_name         String?
  rooms                 Int?
  floor                 Int?
  total_floors          Int?
  is_urgent             Boolean   @default(false)
  has_document          Boolean   @default(false)
  has_repair            Boolean   @default(false)
  has_mortgage          Boolean   @default(false)
  has_active_mortgage   Boolean   @default(false)
  price_drop_count      Int       @default(0)
  posted_date           DateTime?
  description           String?
  image_urls            String[]  // JSON array
  latitude              Float?
  longitude             Float?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  @@index([district])
  @@index([location_name])
  @@index([is_urgent])
  @@index([price_per_sqm])
  @@index([location_name, price_per_sqm])
}

model Alert {
  id                    Int       @id @default(autoincrement())
  token                 String    @unique
  chat_id               String
  label                 String?
  filters               Json      // AlertFilters object
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  @@index([chat_id])
}

model ScrapeRun {
  id                    Int       @id @default(autoincrement())
  started_at            DateTime  @default(now())
  completed_at          DateTime?
  status                String    // "running", "completed", "failed"
  properties_scraped    Int       @default(0)
  properties_new        Int       @default(0)
  properties_updated    Int       @default(0)
  errors                Int       @default(0)
}
```

### Indexes

```sql
CREATE INDEX idx_property_district ON property(district);
CREATE INDEX idx_property_location_name ON property(location_name);
CREATE INDEX idx_property_is_urgent ON property(is_urgent);
CREATE INDEX idx_property_price_per_sqm ON property(price_per_sqm);
CREATE INDEX idx_property_location_price ON property(location_name, price_per_sqm);
CREATE INDEX idx_alert_chat_id ON alert(chat_id);
```

### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
ADMIN_PASSWORD=secure_password_here
NODE_ENV=production
PORT=3000
```

### Performance Optimizations

1. **Brotli Compression:** ~70% size reduction on JSON
2. **Health Cache:** 5-min TTL to avoid repeated DB counts
3. **Pagination:** 20 results per page (configurable)
4. **Indexes:** On frequently filtered columns
5. **Connection Pooling:** Prisma default (10 connections)
6. **Lazy Loading:** Frontend modules loaded on demand
7. **Debouncing:** 500ms on filter changes (frontend)
8. **Caching:** Trend data cached in frontend state

### Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INVALID_PARAMS` — Missing or invalid query params
- `NOT_FOUND` — Resource not found
- `UNAUTHORIZED` — Admin auth required
- `INTERNAL_ERROR` — Server error

### Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests/minute per IP for public endpoints
- 10 requests/minute for scrape endpoints
- 1000 requests/minute for internal endpoints

### Monitoring

Recommended metrics:
- Request latency (p50, p95, p99)
- Error rate by endpoint
- DB query time
- Scrape success rate
- Alert delivery rate
- API response size (pre/post compression)
