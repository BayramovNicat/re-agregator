# Redeal Testing Implementation Plan

## Goal

Build automated test coverage that proves Redeal works across backend APIs, frontend user flows, seeded real database behavior, and release checks.

Testing stack:

- Bun test for API/integration checks.
- Playwright for browser E2E checks.
- Deterministic test seed for real database validation.
- `verify` script for CI-safe validation.
- Optional `verify:db` for destructive seeded database validation.

## Current implemented baseline

### Tooling

- Added `@playwright/test` as dev dependency.
- Added `playwright.config.ts`.
- Added Playwright service worker blocking to avoid cached API data interfering with mocked browser tests.
- Added package scripts:
  - `test`
  - `test:api`
  - `test:seed`
  - `test:e2e`
  - `test:e2e:ui`
  - `verify`
  - `verify:db`

### Existing automated tests

#### Bun API tests

File: `tests/api/deals.test.ts`

Covered:

- `/health` shape.
- `/api/deals/locations` shape.
- `/api/deals/undervalued` happy path shape.
- Missing `location` validation.
- Invalid `threshold` validation.
- Invalid `sort` validation.
- `/api/deals/map-pins` shape.
- `/api/deals/trend` missing location validation.
- `/api/deals/by-urls` empty URL validation.
- Seeded tests, only active after `bun run test:seed`:
  - location filter correctness.
  - category + boolean filter correctness.
  - numeric filter correctness.
  - price per square meter and area filter correctness.
  - floor and total floors filter correctness.
  - mortgage true/false filter correctness.
  - active mortgage, urgency, and not-last-floor filter correctness.
  - description search and multiple-location correctness.
  - pagination duplicate-prevention.
  - price ascending sort correctness.
  - price drops endpoint correctness.
  - heatmap seeded metrics shape.
  - trend weekly row shape.
  - map-pin threshold and location filtering.
  - alert create/list/delete.

Behavior:

- API tests skip gracefully if no server is running at `TEST_BASE_URL` or `http://localhost:3000`.
- Seed-specific tests skip gracefully if seeded fixture data is not present.

#### Playwright E2E tests

File: `tests/e2e/app.pw.ts`

Covered with mocked API:

- Homepage renders first result.
- Advanced filters open and clear.
- Location selector changes search API params and resets to all locations.
- Threshold slider changes label and search API params.
- Grid/list view switch.
- Bookmark persists after reload and saved view opens.
- Card opens property detail dialog.
- Hide removes listing.
- Alerts dialog saves chat ID.
- Gallery opens from card photo button.
- District stats dialog opens and renders heatmap data.
- District stats search, avg-price sort aria state, and retry after API failure.
- Scrape ops dialog opens and shows empty runs.
- Heatmap dialog opens from Location Map.
- Mobile layout smoke.

#### Seed script

File: `scripts/seed-test-db.ts`

Creates deterministic fixtures:

- Yasamal listings.
- Nərimanov listings.
- Deal listing with price history.
- Alert fixture.
- Scrape run fixture.

Safety:

- Requires `DATABASE_URL`.
- Refuses to reset DB unless URL looks local/test, or `TEST_SEED_ALLOW_RESET=1` is explicitly set.

## How to run tests

### Safe local verification

```sh
bun run verify
```

Runs:

```sh
bun run typecheck
bun test
bun run test:e2e
```

Use this before commits and PRs.

### API tests against running app

Terminal 1:

```sh
bun run dev
```

Terminal 2:

```sh
TEST_BASE_URL=http://localhost:3000 bun run test:api
```

### Seeded real DB validation

Use only against test/local database.

```sh
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal_test bun run test:seed
bun run dev
TEST_BASE_URL=http://localhost:3000 bun run test:api
```

### Full DB verify

Only safe if `DATABASE_URL` points to test DB:

```sh
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal_test bun run verify:db
```

## Testing layers

## Layer 1: Static validation

Purpose:

Catch TypeScript and frontend compile issues before runtime tests.

Command:

```sh
bun run typecheck
```

Includes:

- Backend TypeScript project.
- Frontend TypeScript project.

Next improvements:

- Add explicit typecheck for `scripts/**/*.ts` and `tests/**/*.ts`, because current `tsconfig.json` includes only `src/**/*`.
- Option A: create `tsconfig.tests.json`.
- Option B: add `bun --check` style checks if project standardizes on Bun checking.

Recommended future script:

```json
"typecheck:tests": "tsc -p tsconfig.tests.json --noEmit"
```

## Layer 2: API tests with Bun

Purpose:

Verify backend routes, validation, response shape, filter logic, and persistence flows.

Framework:

```ts
import { describe, expect, test } from "bun:test";
```

Test style:

- Tests call real HTTP server via `fetch`.
- Generic API tests run against any running app.
- Seed-specific tests require fixture data.
- Tests avoid direct Prisma access except seed script.

Current API areas:

- Health.
- Deals.
- Map pins.
- Trend validation.
- By URLs validation.
- Alerts.

API coverage to add next:

### Deals filters

Add seeded tests for:

- `minPriceSqm` / `maxPriceSqm`.
- `minArea` / `maxArea`.
- `minFloor` / `maxFloor`.
- `minTotalFloors` / `maxTotalFloors`.
- `hasMortgage=true`.
- `hasMortgage=false` if backend supports false parsing.
- `isUrgent=true`.
- `notLastFloor=true`.
- `hasActiveMortgage=true`.
- `hasActiveMortgage=false`.
- `descriptionSearch`.
- multiple locations comma-separated.

Expected test pattern:

```ts
test("seeded description search returns matching listing", async () => {
  if (skipIfNoSeed()) return;

  const { res, body } = await getJson(
    "/api/deals/undervalued?location=__all__&threshold=0&descriptionSearch=corner",
  );

  expect(res.status).toBe(200);
  const data = (body as { data: Array<{ description: string | null }> }).data;
  expect(data.length).toBeGreaterThan(0);
  expect(data.every((deal) => deal.description?.toLowerCase().includes("corner"))).toBe(true);
});
```

### Pagination

Add tests:

- `limit=1&offset=0` returns one result.
- `limit=1&offset=1` returns next result.
- no duplicate source URLs across page 1 and page 2.
- invalid limit `0`, `1001`, `abc` returns 400.
- invalid offset `-1`, `abc` returns 400.

### Price drops

Add tests:

- `/api/deals/price-drops?location=__all__&minDrops=1` returns seeded deal.
- `minDrops=0` returns 400.
- `minDrops=abc` returns 400.

### Heatmap

Add tests:

- `/api/heatmap` returns seeded locations.
- every row has `location_name`, `avg_price_per_sqm`, `count`, `lat`, `lng`, `trend`.
- seeded `Yasamal` and `Nərimanov` appear.

### Trend

Add tests:

- `/api/deals/trend?location=Yasamal` returns data array.
- each item has `week`, `avg_ppsm`, `listing_count`.
- missing location returns 400 already covered.

### Map pins

Add tests:

- seeded pins include only listings with lat/lng.
- threshold filters pins.
- location filter limits pins to chosen location.

### Alerts

Add tests:

- invalid chat ID returns 400.
- invalid JSON returns 400.
- missing filters returns 400.
- missing `filters.location` returns 400.
- label longer than 80 chars is truncated.
- deleting same token twice returns 404 second time.

### Scrape runs

Add tests:

- `/api/scrape/runs?limit=20` returns seeded scrape run.
- invalid `limit=0`, `limit=101`, `limit=abc` returns 400.

### Telegram webhook

Add tests:

- malformed body does not crash.
- unknown message returns ok.
- update without message returns ok.

Avoid real Telegram network calls in automated tests unless Telegram service can be mocked or disabled.

## Layer 3: Browser E2E tests with Playwright

Purpose:

Verify real browser behavior, DOM wiring, lazy imports, localStorage, dialogs, and UI state.

Test style:

- Browser tests mock API responses with `page.route()`.
- This makes E2E tests fast and independent from DB.
- Use accessible selectors first:
  - `getByRole`
  - `getByLabel`
  - `getByText` scoped under `dialog` or `.product-card`
- Avoid brittle CSS selectors except for app-specific elements like `.product-card` and dialog IDs.

Current mocked API routes:

- `/api/deals/locations`
- `/api/deals/undervalued`
- `/api/deals/by-urls`
- `/api/deals/trend`
- `/api/deals/map-pins`
- `/api/heatmap`
- `/api/alerts`
- `/api/scrape/runs`
- `/health`

E2E coverage to add next:

### Location selector

Add tests:

- open location selector.
- select `Yasamal`.
- assert search API receives `location=Yasamal`.
- select `All locations`.
- assert location resets to `__all__`.

Need inspect `MultiSelect` DOM before writing selectors.

### Threshold slider

Add tests:

- change slider to 0.
- assert label changes to `All`.
- assert API request uses `threshold=0`.
- change to 20.
- assert label `20%`.

### Advanced filters API params

Add tests:

- fill min/max price.
- check request URL contains `minPrice` and `maxPrice`.
- check active chip appears.
- click chip remove.
- assert input clears.

### Sort behavior

Add mocked data with at least 2 properties.

Tests:

- select price ascending.
- verify order in DOM.
- reload.
- verify selected sort persists from localStorage.

### Detail dialog actions

Tests:

- detail bookmark updates card saved state.
- detail hide removes card.
- detail source link points to `source_url`.
- detail share copies or falls back with toast.

### Gallery behavior

Current only opens gallery.

Add:

- next photo button changes counter from `1 / 2` to `2 / 2`.
- keyboard ArrowRight changes image.
- Escape closes dialog.

### Heatmap behavior

Current only opens heatmap dialog.

Add:

- circle click selects location and closes dialog.
- search results refetch after click.
- active location styles update on reopen.

### District stats behavior

Covered:

- opens and renders data.
- search filters district rows.
- sort avg price column toggles `aria-sort`.
- API failure shows retry button.
- retry after restored mock loads table.

### Scrape ops behavior

Current opens empty runs.

Add:

- mocked successful run row renders status, trigger, totals.
- Run Now button calls `/api/scrape/run`.
- unauthorized response prompts token path or shows error.

### Map view

Add tests:

- click Map view.
- assert `/api/deals/map-pins` called.
- assert map container appears.
- assert marker/pin elements exist.
- switch map to grid and back.

### Empty and error states

Add tests:

- empty search response shows no-results state.
- search API 500 shows toast/error and no crash.
- locations API failure shows failed location option.
- alerts API failure shows error toast.

### Mobile-specific flow

Current only smoke-tests mobile size.

Add:

- open advanced filters on mobile.
- open detail dialog on mobile.
- open stats dialog on mobile.
- verify no horizontal overflow:

```ts
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
expect(overflow).toBe(false);
```

## Layer 4: Seeded real database tests

Purpose:

Test true backend SQL, Prisma model shape, database constraints, and real filtering logic.

Use:

```sh
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal_test bun run test:seed
bun run dev
TEST_BASE_URL=http://localhost:3000 bun run test:api
```

Important rules:

- Never run seed against production.
- Never run seed against shared staging unless explicitly intended.
- Seed script deletes all rows in test DB tables.
- Use separate `redeal_test` database.

Future improvement:

Create a script that starts server against test DB automatically, waits for `/health`, runs seeded API tests, then shuts server down.

Possible script:

```json
"verify:db:local": "DATABASE_URL=postgresql://... bun run test:seed && TEST_BASE_URL=http://localhost:3000 bun run test:api"
```

Better implementation:

- `scripts/run-api-tests.ts`
- starts `bun src/index.ts` as child process with test env.
- waits for `/health`.
- runs `bun test tests/api`.
- kills child process.

This avoids requiring user to manually run `bun run dev` in another terminal.

## Layer 5: CI integration

Goal:

Run safe checks on every PR.

Recommended CI command:

```sh
bun install --frozen-lockfile
bun run verify
```

CI requirements:

- Bun installed.
- Playwright browser installed.

If GitHub Actions:

```yaml
name: Verify

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx playwright install --with-deps chromium
      - run: bun run verify
```

Optional DB CI job:

- Start Postgres service.
- Set `DATABASE_URL` to test DB.
- Run `bun run db:push`.
- Run `bun run test:seed`.
- Start app or use a helper script.
- Run `bun run test:api`.

DB CI sketch:

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_USER: redeal
      POSTGRES_PASSWORD: redeal
      POSTGRES_DB: redeal_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

## File organization

Current:

```txt
playwright.config.ts
scripts/seed-test-db.ts
tests/api/deals.test.ts
tests/e2e/app.pw.ts
```

Recommended future split:

```txt
tests/
  api/
    deals.test.ts
    alerts.test.ts
    scrape.test.ts
    telegram.test.ts
  e2e/
    app.pw.ts
    search.pw.ts
    dialogs.pw.ts
    map.pw.ts
    errors.pw.ts
  fixtures/
    deal.ts
    api-mocks.ts
```

Refactor when `app.pw.ts` grows past ~300 lines.

## Test data strategy

### Mocked E2E fixture data

Purpose:

- Fast deterministic UI tests.
- No DB needed.
- No scraper needed.

Keep fixtures small:

- 1 high-value deal.
- 1 normal/overpriced deal for sort tests.
- 1 no-image deal.
- 1 active mortgage deal.

### Seeded DB fixture data

Purpose:

- Real SQL and Prisma validation.
- Data correctness.

Need enough rows per location because average calculation requires `HAVING COUNT(*) >= 3`.

Current seed already creates at least 4 listings per location.

Future seed additions:

- First-floor listing, to verify excluded from location averages.
- Last-floor listing, to verify excluded from location averages.
- Listing with null lat/lng, to verify map pins omit it.
- Listing with null optional fields, to verify API handles nulls.
- Listing with description keyword variants.
- Listing with active mortgage false and true.

## Selector strategy

Preferred selectors:

1. `getByRole()` with accessible name.
2. `getByLabel()` for inputs.
3. Scoped `getByText()` under stable container.
4. Stable IDs only when UI has no accessible role.
5. CSS classes only for app-specific render targets like `.product-card`.

Avoid:

- Unscoped `getByText()` when duplicate tooltip/options/dialog text exists.
- Pixel/layout assertions unless testing responsive overflow.
- Waiting with fixed timeouts.

Use:

```ts
await expect(page.locator(".product-card")).toHaveCount(1);
await expect(page.getByRole("dialog").getByText("Telegram alerts")).toBeVisible();
```

## Mocking strategy for E2E

Centralize later into `tests/e2e/fixtures.ts`:

- `deal`
- `heatmapData`
- `mockApi(page)`

Current `mockApi(page)` should eventually support overrides:

```ts
await mockApi(page, {
  undervalued: { data: [] },
  heatmapStatus: 500,
});
```

This enables empty/error state tests without duplicating route code.

## Flake prevention

Rules:

- Block service workers in Playwright.
- Mock all APIs used by page.
- Avoid external network dependencies.
- Do not rely on real scraper or Telegram in E2E.
- Avoid `waitForTimeout`.
- Use `expect(locator).toBeVisible()` or `toHaveCount()`.
- Scope duplicate text selectors.

Already applied:

- `serviceWorkers: "block"` in Playwright config.
- API route mocks for current page flows.

Future:

- Mock Leaflet tile URLs if tile network causes CI noise.

Example:

```ts
await page.route("https://*.basemaps.cartocdn.com/**", async (route) => {
  await route.fulfill({ status: 204, body: "" });
});
```

## Release checklist using automated tests

Before PR:

```sh
bun run verify
```

If backend filters/API changed:

```sh
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal_test bun run test:seed
bun run dev
TEST_BASE_URL=http://localhost:3000 bun run test:api
```

If UI changed:

```sh
bun run test:e2e
```

If investigating UI interactively:

```sh
bun run test:e2e:ui
```

## Implementation roadmap

### Phase 1: Baseline coverage

Status: done.

Includes:

- Playwright install/config.
- API test scaffolding.
- E2E test scaffolding.
- Seed script.
- Verify scripts.
- Lazy dialog E2E coverage.

### Phase 2: Real API filter depth

Add tests for every supported filter and pagination validation.

Files:

- `tests/api/deals.test.ts`

Actions:

1. Add seeded tests for all numeric filters.
2. Add boolean true/false filter tests.
3. Add description search test.
4. Add multiple-location test.
5. Add pagination duplicate-prevention test.
6. Add price drops tests.
7. Add heatmap/trend map-pins seeded tests.

Acceptance:

```sh
bun test
```

passes without server by skipping seeded tests.

With seeded server:

```sh
TEST_BASE_URL=http://localhost:3000 bun run test:api
```

runs all seeded assertions.

### Phase 3: UI interaction depth

Add E2E tests for user actions not yet covered.

Files:

- `tests/e2e/app.pw.ts`
- later split into `search.pw.ts`, `dialogs.pw.ts`, `map.pw.ts`

Actions:

1. Location selector test.
2. Threshold slider test.
3. Search param assertion tests.
4. Sort order test with 2+ mocked deals.
5. Gallery next/keyboard/close tests.
6. Heatmap circle selection test.
7. District stats search/sort/error tests. Done.
8. Scrape ops run-now/error tests.
9. Empty search/error search tests.

Acceptance:

```sh
bun run test:e2e
```

passes reliably under 10 seconds locally.

### Phase 4: CI

Add GitHub Actions or equivalent CI config.

Actions:

1. Add safe verify workflow.
2. Add Playwright browser install step.
3. Optionally add Postgres service for seeded API workflow.
4. Cache Bun install if needed.

Acceptance:

- PR shows green check for `bun run verify`.
- Optional DB job green if configured.

### Phase 5: Maintenance

Actions:

1. Extract fixtures once tests grow.
2. Keep test names user-flow focused.
3. Keep seed data minimal but representative.
4. Add regression test for every fixed bug.
5. Run `bun run verify` before each PR.

## Known limitations

- Current API tests do not start the server automatically.
- Current `verify:db` assumes test DB env and server/test flow are managed manually or externally.
- Current E2E tests mock API, so they prove UI wiring but not real backend data.
- Current seeded tests require app server running separately.
- Telegram real bot behavior is not automated.
- Real scraper against bina.az is not automated, by design.

## Recommended next concrete tasks

1. Add `tsconfig.tests.json` to typecheck tests and scripts.
2. Extract Playwright fixtures into `tests/e2e/fixtures.ts`.
3. Add E2E tests for advanced filter params, sort behavior, and dialog actions.
4. Add CI workflow for `bun run verify`.
5. Later add DB-backed CI job with Postgres service.
