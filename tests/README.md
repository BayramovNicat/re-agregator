# Redeal Testing Guide

## Goal

Build automated test coverage that exercises Redeal across backend APIs, representative mocked frontend user flows, seeded real database behavior, and release checks.

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
  - `test:e2e`
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
- Seeded tests, active when fixture data is present:
  - location filter correctness.
  - category + boolean filter correctness.
  - numeric filter correctness.
  - price per square meter and area filter correctness.
  - floor and total floors filter correctness.
  - mortgage and active mortgage true/false filter correctness.
  - urgency and not-last-floor filter correctness.
  - description search and multiple-location correctness.
  - pagination duplicate-prevention and invalid pagination validation.
  - price ascending sort correctness.
  - price drops endpoint correctness and validation.
  - heatmap seeded metrics shape.
  - trend weekly row shape.
  - map-pin threshold and location filtering.
  - alert create/list/delete and validation.
  - scrape-run list and validation.
  - Telegram webhook malformed/unknown/no-message handling.

Behavior:

- API tests skip gracefully if no server is running at `TEST_BASE_URL` or `http://localhost:3000`.
- Seed-specific tests skip gracefully if seeded fixture data is not present.

#### Playwright browser tests with mocked APIs

Files: `tests/e2e/app.pw.ts`, `search.pw.ts`, `dialogs.pw.ts`, `map.pw.ts`, `errors.pw.ts`, `mobile.pw.ts`

Covered UI behavior with mocked API responses:

- Homepage renders first result.
- Advanced filters open, clear, update URL params, render removable chips, and cover category/mortgage/description/boolean filters.
- Location selector changes search API params and resets to all locations.
- Threshold slider changes label and search API params.
- Grid/list view switch.
- Language switcher persists selected language.
- Bookmark persists after reload, saved view opens, no-saved state is hidden, and saved view survives refresh failure via cached data.
- Card opens property detail dialog.
- Detail save, share, source link, and hide actions.
- Hide removes listing.
- Alerts dialog saves chat ID, shows API failure, lists active alerts, and deletes an alert.
- Gallery opens from card photo button, navigates, and closes with keyboard.
- District stats dialog opens and renders heatmap data.
- District stats search, avg-price sort aria state, and retry after API failure.
- Scrape ops dialog opens, renders runs, starts scrape, and handles unauthorized run.
- Heatmap dialog opens from Location Map and selects location.
- Trend panel renders for selected location and search remains usable after trend API failure.
- Map view loads pins, switches back, and opens detail from a pin.
- Empty search, search API error, and locations API failure states.
- Mobile filters, detail, stats, and overflow coverage.

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
TEST_BASE_URL=http://localhost:3000 bun test tests/api
```

### Seeded real DB validation

Only safe if `DATABASE_URL` points to test/local DB. This pushes schema, seeds deterministic fixtures, starts the app, runs API tests, then stops the app.

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
- Scripts and tests via `tsconfig.tests.json`.

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
- Scrape runs.
- Telegram webhook.
- Brotli compression headers.

Selected API coverage:

- Numeric deal filters, floor filters, boolean filters, description search, multiple locations.
- Pagination duplicate-prevention and invalid limit/offset validation.
- Price drops success and `minDrops` validation.
- Heatmap seeded metrics shape.
- Trend weekly row shape.
- Map-pin threshold and location filtering.
- Alert create/list/delete, chat ID validation, missing filters/location, label truncation, double-delete 404.
- Scrape run list and limit validation.
- Telegram malformed/unknown/no-message update handling.
- Brotli compression response headers.

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
- `/api/scrape/run` in scrape-ops tests
- `/health`

Selected mocked browser coverage:

- Location selector selection/reset and search params.
- Threshold slider label and search params.
- Advanced filter params, active chips, chip removal, category, active mortgage, description, and boolean filters.
- Sort order and localStorage persistence.
- Language switcher localStorage persistence.
- Saved view persistence, empty state, and cached fallback after `/api/deals/by-urls` failure.
- Detail save, hide, share, and source link actions.
- Alert create, API failure, list, and delete flows.
- Gallery next button, keyboard navigation, and Escape close.
- Heatmap circle selection and search refetch.
- Trend panel render and trend failure resilience.
- District stats render, search, sort aria state, failure, and retry.
- Admin sign-in, scrape ops visibility, rows, run-now request, and unauthorized password prompt.
- Map view pin load, grid switch, and pin-to-detail flow.
- Empty search, search API error, and locations API failure.
- Mobile filters/detail flow and horizontal overflow check.

Remaining E2E limitations:

- Browser tests mock API responses, so they do not prove real frontend/backend/database integration.
- CI does not currently run a real-stack browser suite against seeded Postgres.
- Real scraper execution and Telegram network delivery are intentionally not automated.
- Browser coverage is representative, not exhaustive for every route or visual branch.

## Layer 4: Seeded real database tests

Purpose:

Test true backend SQL, Prisma model shape, database constraints, and real filtering logic.

Use:

```sh
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal_test bun run verify:db
```

Important rules:

- Never run seed against production.
- Never run seed against shared staging unless explicitly intended.
- Seed script deletes all rows in test DB tables.
- Use separate `redeal_test` database.

`scripts/verify-db.ts` pushes schema, seeds fixtures, starts `src/index.ts` against the test database, waits for `/health`, runs `bun test tests/api`, and stops the server.

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

DB CI job:

- Starts Postgres 16 service.
- Sets `DATABASE_URL` to `redeal_test`.
- Runs `bun run verify:db`.

## File organization

Current:

```txt
.github/workflows/verify.yml
playwright.config.ts
scripts/seed-test-db.ts
scripts/verify-db.ts
tests/api/deals.test.ts
tests/e2e/app.pw.ts
tests/e2e/search.pw.ts
tests/e2e/dialogs.pw.ts
tests/e2e/map.pw.ts
tests/e2e/errors.pw.ts
tests/e2e/mobile.pw.ts
tests/e2e/fixtures.ts
```

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

Seed fixtures include:

- First-floor and last-floor outliers to verify excluded location averages.
- Listing with null lat/lng to verify map pins omit it.
- Listing with null optional fields to verify API handles nulls.
- Description keyword variants.
- Active mortgage false and true listings.

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

Centralized in `tests/e2e/fixtures.ts`:

- `deal`
- `heatmapData`
- `trendData`
- `activeAlert`
- `mockApi(page)`

`mockApi(page)` supports overrides:

```ts
await mockApi(page, {
  undervalued: { data: [] },
  heatmapStatus: 500,
  byUrlsStatus: 500,
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
- Leaflet tile URLs are mocked in `mockApi(page)` to avoid CI network noise.

## Release checklist using automated tests

Before PR:

```sh
bun run verify
```

If backend filters/API changed and local test Postgres is available:

```sh
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal_test bun run verify:db
```

If UI changed:

```sh
bun run test:e2e
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

Status: done.

Files:

- `tests/api/deals.test.ts`

Acceptance:

```sh
bun test
```

passes without server by skipping seeded tests.

With seeded database:

```sh
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal_test bun run verify:db
```

runs all seeded assertions.

### Phase 3: UI interaction depth

Status: baseline done; coverage expansion ongoing.

Files:

- `tests/e2e/app.pw.ts`
- `tests/e2e/search.pw.ts`
- `tests/e2e/dialogs.pw.ts`
- `tests/e2e/map.pw.ts`
- `tests/e2e/errors.pw.ts`
- `tests/e2e/mobile.pw.ts`

Acceptance:

```sh
bun run test:e2e
```

passes reliably locally.

### Phase 4: CI

Status: done.

Includes:

- Safe verify workflow.
- Playwright browser install step.
- Postgres service for seeded API workflow.
- `bun run verify:db` DB job.

Acceptance:

- PR shows green check for `bun run verify`.
- DB job runs seeded API checks against Postgres service.

### Phase 5: Maintenance

Status: ongoing.

Applied:

- E2E fixtures extracted into `tests/e2e/fixtures.ts`.
- E2E tests split by user-flow area.
- Seed data kept deterministic and representative.

Ongoing rules:

- Keep test names user-flow focused.
- Add regression test for every fixed bug.
- Run `bun run verify` before each PR.

## Known limitations

- Current Playwright tests mock API responses, so they prove UI wiring but not real frontend/backend/database integration.
- Seeded real database validation is API-level, not browser-level.
- Telegram real bot delivery/network behavior is not automated.
- Real scraper execution against bina.az is not automated, by design.
- Browser tests cover representative high-value routes and user flows, not every route or visual branch.

## Recommended next concrete tasks

- Add a small real-stack Playwright smoke suite against seeded Postgres if UI/backend contract risk becomes high.
- Add focused regression tests as bugs are fixed or features change.
- Keep mocked browser coverage representative rather than exhaustive unless a flow is release-critical.
