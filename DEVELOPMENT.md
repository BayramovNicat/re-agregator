# Development Guide & Troubleshooting

## Getting Started

### Prerequisites
- Bun 1.0+ (`bun --version`)
- PostgreSQL 14+ (`psql --version`)
- Node.js 18+ (for some tools, though Bun is primary)

### Initial Setup

```bash
# Clone repo
cd /Users/nicat/Desktop/side/re-agregator

# Install dependencies
bun install

# Setup database
bun run db:push          # Apply Prisma schema to DB

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@localhost:5432/redeal
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_PASSWORD=your_admin_password
NODE_ENV=development
PORT=3000
EOF

# Start dev server
bun run dev              # Hot reload on file changes
```

**Dev server runs on:** http://localhost:3000

---

## Development Commands

```bash
# Start dev server (hot reload)
bun run dev

# Type check
bun run typecheck

# Run tests (if any)
bun test

# Build frontend
bun build frontend/main.ts

# Database migrations
bun run db:migrate       # Apply Prisma migrations
bun run db:push          # Apply schema changes without migration
bun run db:studio        # Open Prisma Studio (GUI)

# Format code
bun run format

# Lint (if configured)
bun run lint
```

---

## Common Development Tasks

### Add a New Filter

**Goal:** Add "Has Balcony" boolean filter

**Steps:**

1. **Update Prisma schema** (`prisma/schema.prisma`):
```prisma
model Property {
  // ... existing fields
  has_balcony           Boolean   @default(false)
}
```

2. **Run migration:**
```bash
bun run db:push
```

3. **Add to types** (`frontend/core/types.ts`):
```typescript
export interface AlertFilters {
  // ... existing filters
  hasBalcony?: boolean;
}
```

4. **Add to constants** (`frontend/features/search/constants.ts`):
```typescript
export function getBooleanFilters() {
  return [
    // ... existing filters
    { id: "hasBalcony", label: "Has Balcony" },
  ];
}
```

5. **Add UI input** (`frontend/features/search/filters.ts`):
```typescript
// In renderSearchFilters(), add checkbox for hasBalcony
```

6. **Backend filtering** (`src/modules/deals/deals.service.ts`):
```typescript
if (filters.hasBalcony) {
  where.has_balcony = true;
}
```

7. **Test:**
```bash
bun run dev
# Search with "Has Balcony" checked
```

---

### Add a New Sort Option

**Goal:** Add "Area (Largest First)" sort

**Steps:**

1. **Add to sort dropdown** (`frontend/features/products/bar.ts`):
```typescript
const sortOptions = [
  // ... existing options
  { value: "area-desc", label: "Area (Largest First)" },
];
```

2. **Add sort logic** (`frontend/features/products/logic.ts`):
```typescript
export function sortDeals(deals: Property[], sortBy: string): Property[] {
  const sorted = [...deals];
  
  switch (sortBy) {
    // ... existing cases
    case "area-desc":
      return sorted.sort((a, b) => (b.area_sqm || 0) - (a.area_sqm || 0));
  }
  
  return sorted;
}
```

3. **Test:**
```bash
bun run dev
# Select "Area (Largest First)" from sort dropdown
```

---

### Add a New View Mode

**Goal:** Add "Compact View" (ultra-minimal cards)

**Steps:**

1. **Add view type** (`frontend/core/state.ts`):
```typescript
state.currentView: "grid" | "list" | "map" | "compact"
```

2. **Add button** (`frontend/features/products/bar.ts`):
```typescript
const viewCompactBtn = Button({
  content: Icons.compact(),
  ariaLabel: "Compact view",
  onclick: () => onViewChange("compact"),
});
```

3. **Create feature module** (`frontend/features/compact-view/index.ts`):
```typescript
export function initCompactView(container: HTMLElement): () => void {
  // Render ultra-minimal cards
  return () => {
    // Cleanup
  };
}
```

4. **Integrate** (`frontend/features/products/index.ts`):
```typescript
async function setView(view: "grid" | "list" | "map" | "compact") {
  if (view === "compact") {
    const { initCompactView } = await import("@/features/compact-view/index");
    // ... initialize
  }
}
```

5. **Test:**
```bash
bun run dev
# Click compact view button
```

---

### Add a New API Endpoint

**Goal:** Add `GET /api/deals/favorites` (admin-only endpoint)

**Steps:**

1. **Create controller** (`src/modules/deals/deals.controller.ts`):
```typescript
export async function getFavoriteDealsByAdmin(req: Request): Promise<Response> {
  // Check admin auth
  const isAdmin = req.headers.get("x-admin-token") === process.env.ADMIN_PASSWORD;
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Fetch favorite deals
  const deals = await prisma.property.findMany({
    where: { is_favorite: true },
    take: 50,
  });
  
  return Response.json({ data: deals });
}
```

2. **Add route** (`src/routes.ts`):
```typescript
export const routes = {
  // ... existing routes
  "/api/deals/favorites": { GET: br(getFavoriteDealsByAdmin) },
};
```

3. **Frontend call** (`frontend/features/products/logic.ts`):
```typescript
async function fetchFavorites() {
  const res = await fetch("/api/deals/favorites", {
    headers: { "x-admin-token": adminToken },
  });
  return res.json();
}
```

4. **Test:**
```bash
bun run dev
# Call endpoint from browser console
fetch("/api/deals/favorites").then(r => r.json()).then(console.log)
```

---

### Debug a Search Issue

**Scenario:** Search returns 0 results when it should return 10

**Debugging Steps:**

1. **Check Network tab:**
   - Open DevTools → Network
   - Perform search
   - Click `/api/deals/undervalued` request
   - Check response JSON
   - Verify `data` array and `total` count

2. **Check query params:**
   - Verify `location` is set
   - Verify `threshold` is reasonable (e.g., 10)
   - Check for typos in filter names

3. **Check backend logs:**
   - Look for errors in server console
   - Check Prisma query logs (set `DEBUG=prisma:*`)

4. **Check database:**
   ```bash
   bun run db:studio
   # Browse Property table
   # Verify properties exist for selected location
   ```

5. **Check filter logic:**
   - Add `console.log()` in `deals.service.ts`
   - Verify `where` clause is correct
   - Check if filters are too restrictive

6. **Check state:**
   - Open DevTools → Console
   - Type `state.allResults` to see results
   - Type `state.getFilters()` to see current filters

---

### Fix a Performance Issue

**Scenario:** Map view is slow with 500+ pins

**Optimization Steps:**

1. **Profile in DevTools:**
   - Open Performance tab
   - Record while switching to map view
   - Identify bottleneck (rendering, API, etc.)

2. **Check API response size:**
   - Network tab → `/api/deals/map-pins`
   - Look for large response (>5MB)
   - Consider pagination or filtering

3. **Implement clustering:**
   - Use Leaflet.markercluster plugin
   - Group nearby pins
   - Reduce DOM nodes

4. **Optimize rendering:**
   - Use virtual scrolling for large lists
   - Debounce zoom/pan events
   - Cache computed values

5. **Monitor memory:**
   - DevTools → Memory tab
   - Take heap snapshot
   - Look for memory leaks

---

## Debugging Tools

### Browser DevTools

**Console:**
```javascript
// Check global state
state.allResults.length
state.getFilters()
state.bookmarks
state.currentView

// Trigger events
bus.emit(EVENTS.SEARCH_STARTED, { more: false })

// Check localStorage
localStorage.getItem("re-bookmarks")
localStorage.getItem("re-sort")
```

**Network Tab:**
- Filter by XHR/Fetch
- Check response headers (Content-Encoding: br)
- Verify response format matches types
- Check for failed requests (4xx, 5xx)

**Performance Tab:**
- Record interactions
- Identify slow operations
- Check for jank (frame drops)

**Memory Tab:**
- Take heap snapshots
- Look for detached DOM nodes
- Check for memory leaks

### Server Debugging

**Enable Prisma logging:**
```bash
DEBUG=prisma:* bun run dev
```

**Add console logs:**
```typescript
console.log("Filters:", filters);
console.log("Query:", where);
console.log("Results:", results.length);
```

**Check database directly:**
```bash
bun run db:studio
# Browse tables, run queries
```

---

## Common Issues & Solutions

### Issue: "Root element #app not found"

**Cause:** HTML doesn't have `<div id="app"></div>`

**Fix:** Check `public/index.html` has app div

```html
<body>
  <div id="app"></div>
  <script type="module" src="/frontend/main.ts"></script>
</body>
```

---

### Issue: Search returns empty results

**Cause:** Location not selected or filters too restrictive

**Debug:**
```javascript
state.getFilters()  // Check filters
state.allResults    // Check results
```

**Fix:**
- Select location from dropdown
- Reduce filter restrictions
- Check database has properties for location

---

### Issue: Bookmarks not persisting

**Cause:** localStorage quota exceeded or corrupted

**Debug:**
```javascript
localStorage.getItem("re-bookmarks")
localStorage.getItem("re-hidden")
```

**Fix:**
```javascript
localStorage.clear()  // Clear all
// Or selectively:
localStorage.removeItem("re-bookmarks")
```

---

### Issue: Map view not loading

**Cause:** Leaflet not loaded or container not found

**Debug:**
```javascript
window.L  // Check Leaflet loaded
state.refs.mapContainer  // Check container exists
```

**Fix:**
- Check lazy loading triggered
- Verify map container has height
- Check for console errors

---

### Issue: Alerts not sending

**Cause:** Invalid chat ID or bot token

**Debug:**
```bash
# Check bot token in .env
echo $TELEGRAM_BOT_TOKEN

# Test bot API
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe
```

**Fix:**
- Verify chat ID is numeric
- Verify bot token is correct
- Check bot has permission to send messages

---

### Issue: Slow API responses

**Cause:** Large result set or missing indexes

**Debug:**
```bash
# Check query time
DEBUG=prisma:* bun run dev

# Check indexes
bun run db:studio
# Look at Property table indexes
```

**Fix:**
- Add missing indexes
- Implement pagination
- Optimize query filters

---

### Issue: TypeScript errors

**Cause:** Type mismatch or missing types

**Fix:**
```bash
bun run typecheck  # See all errors
# Fix each error by updating types or code
```

---

## Testing Checklist

### Before Committing

- [ ] `bun run typecheck` passes
- [ ] No console errors
- [ ] No Network tab errors
- [ ] Smoke test passes (Section 21 in TESTING.md)
- [ ] Feature works in grid/list/map views
- [ ] Bookmarks persist
- [ ] Filters work correctly
- [ ] Responsive on mobile

### Before Deploying

- [ ] All tests pass
- [ ] No console warnings
- [ ] Performance acceptable (API <1s, render <100ms)
- [ ] Accessibility check (keyboard nav, screen reader)
- [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] Mobile tested (iOS Safari, Chrome Mobile)
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Backups taken

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Initial load | <2s | ? |
| Search response | <500ms | ? |
| Grid render | <100ms | ? |
| Map load | <1s | ? |
| Pagination | <300ms | ? |
| API response size | <500KB | ? |
| Brotli compression | >60% | ~70% |

### Profiling Commands

```bash
# Measure API response time
time curl http://localhost:3000/api/deals/undervalued?location=Nəsimi

# Check response size
curl -I http://localhost:3000/api/deals/undervalued?location=Nəsimi

# Monitor memory usage
top -p $(pgrep -f "bun run dev")
```

---

## Git Workflow

### Branch Naming
```
feature/add-dark-mode
fix/search-not-working
refactor/simplify-state
docs/update-readme
```

### Commit Message Format
```
type: short description

Longer explanation if needed.

Fixes #123
```

**Types:** feat, fix, refactor, docs, test, chore, perf

### Before Push
```bash
bun run typecheck
bun run format
git status
git diff
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Database backed up
- [ ] Environment variables set
- [ ] Secrets not in code

### Deployment
```bash
# Build frontend
bun build frontend/main.ts

# Start server
bun run src/index.ts

# Or with PM2
pm2 start "bun run src/index.ts" --name redeal
```

### Post-Deployment
- [ ] Health check passes (`/health`)
- [ ] Search works
- [ ] Alerts working
- [ ] Monitor logs for errors
- [ ] Monitor performance metrics

---

## Resources

### Documentation
- Bun: https://bun.sh/docs
- Prisma: https://www.prisma.io/docs
- Leaflet: https://leafletjs.com/reference
- TypeScript: https://www.typescriptlang.org/docs

### Tools
- Prisma Studio: `bun run db:studio`
- DevTools: F12 in browser
- Network Monitor: DevTools → Network tab
- Performance Profiler: DevTools → Performance tab

### Useful Commands
```bash
# Check Bun version
bun --version

# List installed packages
bun pm list

# Update packages
bun update

# Clean cache
bun cache clean

# Run arbitrary command
bun run <script>
```

---

## Support & Troubleshooting

### Getting Help

1. **Check logs:**
   - Browser console (F12)
   - Server console (terminal)
   - Database logs (Prisma Studio)

2. **Search existing issues:**
   - GitHub issues
   - Stack Overflow
   - Bun/Prisma docs

3. **Reproduce issue:**
   - Fresh browser session
   - Clear cache/localStorage
   - Check on different browser

4. **Report issue:**
   - Include steps to reproduce
   - Include error message
   - Include browser/OS info
   - Include screenshot if UI issue

---

## Quick Reference

### File Locations
- Frontend entry: `frontend/main.ts`
- Backend entry: `src/index.ts`
- Routes: `src/routes.ts`
- Database schema: `prisma/schema.prisma`
- Environment: `.env`
- Public assets: `public/`

### Key Files by Feature
- Search: `frontend/features/search/`
- Products: `frontend/features/products/`
- Alerts: `frontend/features/alerts/`
- Map: `frontend/features/map-view/`
- Heatmap: `frontend/features/heatmap/`
- Admin: `frontend/features/admin.ts`

### Important Utilities
- State: `frontend/core/state.ts`
- Events: `frontend/core/events.ts`
- Types: `frontend/core/types.ts`
- Utils: `frontend/core/utils.ts`
- i18n: `frontend/core/i18n.ts`

### Database
- Client: `src/utils/prisma.ts`
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`

---

## Next Steps

1. **Read TESTING.md** for manual testing path
2. **Read FEATURE_MAP.md** for feature dependencies
3. **Read API_REFERENCE.md** for endpoint details
4. **Read PROJECT_ANALYSIS.md** for architecture overview
5. **Start dev server:** `bun run dev`
6. **Run smoke test:** Follow Section 21 in TESTING.md
