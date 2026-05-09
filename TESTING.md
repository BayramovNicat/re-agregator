# Manual Testing Path - Redeal Frontend

Complete testing checklist for all frontend functionality. Test in order; each section builds on prior state.

---

## 1. INITIAL LOAD & HEALTH CHECK

**Setup:** Start dev server: `bun run dev`

- [ ] Page loads without errors (check console)
- [ ] Header renders with logo, language toggle, alerts icon
- [ ] Welcome state visible: "Welcome to Redeal" message
- [ ] Health status shows property count (bottom right or status area)
- [ ] Service Worker registers (check console: "SW registered")
- [ ] No 404s or failed API calls in Network tab

---

## 2. SEARCH & FILTER BASICS

**Goal:** Test core search flow with location selection.

### 2.1 Location Selection
- [ ] Click location dropdown
- [ ] "All Locations" option visible
- [ ] Scroll and select a single location (e.g., "Nəsimi")
- [ ] Dropdown closes, location chip appears below
- [ ] Search auto-triggers (results load)

### 2.2 Results Display
- [ ] Results appear in grid view (default)
- [ ] Each card shows: image, price, area, price/m², tier badge, location
- [ ] Results count displays: "X results" with tier breakdown
- [ ] Welcome state hidden, results bar visible
- [ ] Pagination "Load More" button appears if results > 20

### 2.3 Discount Range Filter
- [ ] Discount slider visible (default 10%)
- [ ] Drag slider left/right
- [ ] Results update on release
- [ ] Discount value display updates in real-time

### 2.4 Advanced Filters Toggle
- [ ] Click "Advanced" button
- [ ] Panel expands showing: price range, area, rooms, floor, category, mortgage, repair, urgent, document
- [ ] All inputs are empty/unchecked initially
- [ ] "Clear All" button visible

### 2.5 Numeric Filters
- [ ] Enter min price (e.g., 50000)
- [ ] Enter max price (e.g., 150000)
- [ ] Results filter immediately
- [ ] Try area range, rooms, floor filters
- [ ] Each filter narrows results correctly

### 2.6 Boolean Filters
- [ ] Check "Has Repair"
- [ ] Results update to show only repair properties
- [ ] Check "Is Urgent"
- [ ] Results narrow further
- [ ] Uncheck both, results expand

### 2.7 Category & Mortgage Filters
- [ ] Select category dropdown (if options exist)
- [ ] Results filter by category
- [ ] Select mortgage option ("Active Mortgage" / "No Mortgage")
- [ ] Results update

### 2.8 Description Search
- [ ] Type keyword in description field (e.g., "renovated")
- [ ] Results filter by description text
- [ ] Clear field, results expand

### 2.9 Active Filter Chips
- [ ] Multiple filters applied show as chips below search
- [ ] Each chip shows filter name and value
- [ ] Click X on chip to remove that filter
- [ ] Results update on chip removal
- [ ] "Clear All" button removes all chips at once

---

## 3. SORTING & VIEW MODES

**Setup:** Keep location selected, apply a few filters.

### 3.1 Sort Options
- [ ] Sort dropdown visible (default "Discount %")
- [ ] Change to "Price (Low to High)"
- [ ] Cards re-order by price ascending
- [ ] Change to "Price (High to Low)"
- [ ] Cards re-order by price descending
- [ ] Change to "Price/m² (Low to High)"
- [ ] Change to "Price/m² (High to Low)"
- [ ] Change to "Posted (Newest)"
- [ ] Sort persists in localStorage (reload page, sort stays)

### 3.2 Grid View
- [ ] Grid view button active (highlighted)
- [ ] Cards display in responsive grid (2-4 columns depending on screen)
- [ ] Cards are equal height, images fill container

### 3.3 List View
- [ ] Click list view button
- [ ] Cards switch to compact row layout
- [ ] Each row shows: image thumbnail, location, price, area, price/m², tier
- [ ] Rows are compact and scannable
- [ ] Sorting still works in list view

### 3.4 Map View
- [ ] Click map view button
- [ ] Map loads (Leaflet map visible)
- [ ] Pins appear for each property
- [ ] Pins colored by tier (green/blue/yellow/red)
- [ ] Hover pin shows tooltip: price, area, price/m²
- [ ] Click pin opens property detail modal
- [ ] Map bounds fit to all pins
- [ ] Zoom/pan works
- [ ] Switch back to grid/list, map hides

---

## 4. PAGINATION & INFINITE SCROLL

**Setup:** Grid view, single location, no filters.

- [ ] Initial load shows ~20 cards
- [ ] "Load More" button visible at bottom
- [ ] Click "Load More"
- [ ] Next batch loads (skeleton loaders appear briefly)
- [ ] New cards append to grid
- [ ] Results count updates
- [ ] Repeat until no more results
- [ ] "Load More" button disappears when all results loaded
- [ ] Scroll to top button appears after scrolling down 450px
- [ ] Click scroll-to-top button, page scrolls to top instantly

---

## 5. SAVED DEALS (BOOKMARKS)

**Setup:** Grid view with results visible.

### 5.1 Bookmark Individual Cards
- [ ] Hover over card, bookmark icon visible (heart/star)
- [ ] Click bookmark icon
- [ ] Icon fills/highlights (bookmarked state)
- [ ] Saved badge appears in results bar (e.g., "Saved: 3")
- [ ] Bookmark another card
- [ ] Badge count increments
- [ ] Click bookmark again to unbookmark
- [ ] Icon unfills, badge decrements

### 5.2 Saved View
- [ ] Click "Saved" button in results bar
- [ ] Button highlights (active state)
- [ ] Results filter to only bookmarked cards
- [ ] Results count shows only saved items
- [ ] Sort still works on saved items
- [ ] Click "Saved" again to return to all results
- [ ] Bookmarks persist in localStorage (reload page, bookmarks remain)

### 5.3 Saved Data Sync
- [ ] With saved view active, click "Saved" button
- [ ] API call `/api/deals/by-urls` fires (check Network tab)
- [ ] Fresh data loads for bookmarked URLs
- [ ] Cached data shown while loading

---

## 6. PROPERTY DETAIL MODAL

**Setup:** Grid view with results.

### 6.1 Open Detail
- [ ] Click on any card
- [ ] Modal opens with property details
- [ ] Modal shows: full images, location, price, area, rooms, floor, tier, discount %
- [ ] Price history chart visible (if data exists)
- [ ] Description text visible
- [ ] Market average price/m² shown
- [ ] Discount bar shows visual comparison

### 6.2 Gallery Navigation
- [ ] Multiple images visible in gallery
- [ ] Left/right arrows navigate images
- [ ] Arrow keys (← →) navigate images
- [ ] Image counter shows current/total
- [ ] Click "Expand Gallery" button
- [ ] Full-screen gallery opens

### 6.3 Property Actions
- [ ] Bookmark button toggles (heart icon)
- [ ] Share button copies URL to clipboard (or uses native share)
- [ ] "Hide" button removes property from results and closes modal
- [ ] After hide, property no longer appears in results

### 6.4 Map in Detail
- [ ] Small map visible showing property location
- [ ] Pin centered on property
- [ ] Map is interactive (zoom/pan works)

### 6.5 Close Modal
- [ ] Click X button closes modal
- [ ] Click outside modal closes it
- [ ] Press Escape closes modal
- [ ] Results grid still visible behind modal

---

## 7. GALLERY (FULL-SCREEN)

**Setup:** Open property detail, click "Expand Gallery".

- [ ] Full-screen gallery opens
- [ ] Images fill viewport
- [ ] Left/right arrows navigate
- [ ] Arrow keys navigate
- [ ] Image counter visible
- [ ] Close button (X) exits gallery
- [ ] Escape key exits gallery
- [ ] Thumbnail strip visible (if implemented)
- [ ] Click thumbnail jumps to image

---

## 8. TREND PANEL

**Setup:** Select a single location.

- [ ] Trend panel appears below search
- [ ] Shows location name
- [ ] Current price/m² displayed
- [ ] Price change % shown with color (red=up, green=down, gray=flat)
- [ ] Sparkline chart visible showing 12-week trend
- [ ] Hover chart shows tooltip with week and price
- [ ] Change location, trend updates
- [ ] Select "All Locations", trend hides

---

## 9. HEATMAP (PRICE MAP)

**Setup:** Search results visible.

### 9.1 Open Heatmap
- [ ] Click "Price Map" button in advanced filters
- [ ] Heatmap modal opens
- [ ] Map loads with district circles
- [ ] Circles sized by listing count
- [ ] Circles colored by price/m² (gradient)

### 9.2 Heatmap Interaction
- [ ] Hover circle shows tooltip: location, avg price/m², count, trend
- [ ] Click circle toggles selection (white border appears)
- [ ] Selected circles add to location filter
- [ ] "Select All" button selects all circles
- [ ] "Clear" button deselects all
- [ ] Close modal, location filter updated with selected districts

### 9.3 Heatmap Trends
- [ ] Circles show trend indicator (up/down/flat)
- [ ] Color intensity reflects price level
- [ ] Recent vs prior average shown in tooltip

---

## 10. ALERTS (TELEGRAM)

**Setup:** Search results with filters applied.

### 10.1 Open Alerts
- [ ] Click alerts icon (bell) in header
- [ ] Alerts modal opens
- [ ] Filter preview shows current search filters
- [ ] Chat ID input field visible
- [ ] Label input field visible

### 10.2 Create Alert
- [ ] Enter Telegram chat ID (or bot token)
- [ ] Enter optional label (e.g., "My Nəsimi Alert")
- [ ] Click "Save Alert"
- [ ] Alert saves (API call `/api/alerts` POST)
- [ ] Chat ID persists in localStorage
- [ ] Modal closes

### 10.3 List Alerts
- [ ] Alerts list shows saved alerts
- [ ] Each alert shows: label, filters, delete button
- [ ] Delete button removes alert (API call `/api/alerts/:token` DELETE)
- [ ] Alert removed from list

### 10.4 Alert Updates
- [ ] Change search filters
- [ ] Open alerts modal
- [ ] Filter preview updates to show new filters
- [ ] Existing alerts still show old filters

---

## 11. KEYBOARD NAVIGATION

**Setup:** Grid view with results.

### 11.1 Arrow Keys in Grid
- [ ] Focus first card (Tab or click)
- [ ] Press ArrowRight, next card focuses
- [ ] Press ArrowLeft, previous card focuses
- [ ] Press ArrowDown, card below focuses
- [ ] Press ArrowUp, card above focuses
- [ ] Navigation wraps at grid edges (optional)

### 11.2 Enter Key Search
- [ ] Focus location input
- [ ] Type location name
- [ ] Press Enter
- [ ] Search executes (same as clicking search)

### 11.3 Escape Key
- [ ] Open property detail modal
- [ ] Press Escape
- [ ] Modal closes

---

## 12. RESPONSIVE DESIGN

**Setup:** Test on multiple screen sizes.

### 12.1 Desktop (1920px)
- [ ] Grid shows 4 columns
- [ ] All UI elements visible
- [ ] No horizontal scroll

### 12.2 Laptop (1366px)
- [ ] Grid shows 3 columns
- [ ] Layout adapts
- [ ] No overflow

### 12.3 Tablet (768px)
- [ ] Grid shows 2 columns
- [ ] Search filters stack vertically
- [ ] Modal fits viewport
- [ ] Touch interactions work

### 12.4 Mobile (375px)
- [ ] Grid shows 1 column
- [ ] All filters accessible (scroll/collapse)
- [ ] Modal full-screen or near full-screen
- [ ] Buttons large enough to tap
- [ ] No horizontal scroll

---

## 13. PERFORMANCE & CACHING

**Setup:** Dev tools Network tab open.

### 13.1 Brotli Compression
- [ ] API responses show `Content-Encoding: br`
- [ ] Response size significantly smaller than uncompressed

### 13.2 Lazy Loading
- [ ] Gallery module not loaded until first property opened
- [ ] Heatmap module not loaded until "Price Map" clicked
- [ ] Map view module not loaded until map view activated
- [ ] Check Network tab for lazy-loaded chunks

### 13.3 Caching
- [ ] Reload page, same location selected
- [ ] Results load faster (cached)
- [ ] Trend data cached (check Network tab, 304 or cached response)

---

## 14. ADMIN PANEL

**Setup:** Navigate to `/admin`.

### 14.1 Admin Login
- [ ] Admin page loads
- [ ] "Sign in" form visible
- [ ] Password input field
- [ ] Enter admin password
- [ ] Click "Sign in"
- [ ] Redirects to home page (if correct)
- [ ] Or shows error (if incorrect)

### 14.2 Admin Session
- [ ] After login, navigate back to `/admin`
- [ ] "Signed in" status shown
- [ ] "Log out" button visible
- [ ] Click "Log out"
- [ ] Session cleared, redirects to login

### 14.3 Scrape Ops (if admin)
- [ ] Scrape runs list visible
- [ ] Each run shows: timestamp, status, properties scraped
- [ ] "Run Scrape" button triggers manual scrape
- [ ] Scrape progress updates in real-time (SSE)

---

## 15. LANGUAGE & LOCALIZATION

**Setup:** Header visible.

- [ ] Language toggle visible (flag icon or dropdown)
- [ ] Click toggle
- [ ] Language switches (e.g., English ↔ Azerbaijani)
- [ ] All UI text updates:
  - [ ] Button labels
  - [ ] Filter names
  - [ ] Placeholder text
  - [ ] Error messages
  - [ ] Empty states
- [ ] Language persists in localStorage (reload page, language stays)

---

## 16. ERROR HANDLING

**Setup:** Simulate network issues.

### 16.1 API Failures
- [ ] Disconnect network, try search
- [ ] Error toast appears with message
- [ ] Results don't update
- [ ] Reconnect, search works again

### 16.2 Empty Results
- [ ] Apply filters that return 0 results
- [ ] Empty state displays: "No results found"
- [ ] Suggestion to adjust filters shown

### 16.3 Invalid Input
- [ ] Try to create alert without chat ID
- [ ] Error message shown
- [ ] Form doesn't submit

---

## 17. ACCESSIBILITY

**Setup:** Screen reader (NVDA/JAWS) or accessibility inspector.

- [ ] All buttons have `aria-label` or visible text
- [ ] Form inputs have associated labels
- [ ] Images have alt text (or are decorative)
- [ ] Color not sole indicator (icons/text used)
- [ ] Focus visible on all interactive elements
- [ ] Modal has focus trap (Tab cycles within modal)
- [ ] Escape closes modal
- [ ] Semantic HTML used (button, input, select, etc.)

---

## 18. DARK/LIGHT MODE (if implemented)

**Setup:** Theme toggle in header.

- [ ] Click theme toggle
- [ ] UI switches to dark mode
- [ ] All colors readable
- [ ] Images/charts visible
- [ ] Theme persists in localStorage
- [ ] Click again, switches to light mode

---

## 19. EDGE CASES & STRESS TESTS

### 19.1 Large Result Sets
- [ ] Search returns 1000+ results
- [ ] Pagination works smoothly
- [ ] No lag when loading more
- [ ] Memory usage reasonable (check DevTools)

### 19.2 Many Bookmarks
- [ ] Bookmark 50+ properties
- [ ] Saved view loads all bookmarks
- [ ] No performance degradation
- [ ] localStorage size reasonable

### 19.3 Rapid Filter Changes
- [ ] Quickly toggle filters on/off
- [ ] Debounce prevents excessive API calls
- [ ] Results eventually settle to correct state

### 19.4 Concurrent Operations
- [ ] Open property detail while search loading
- [ ] Switch views while pagination in progress
- [ ] No race conditions or broken state

---

## 20. BROWSER COMPATIBILITY

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

For each:
- [ ] Page loads without errors
- [ ] All features work
- [ ] No console errors
- [ ] Layout responsive

---

## 21. FINAL SMOKE TEST

**Setup:** Fresh browser session, no cache.

1. [ ] Load homepage
2. [ ] Select location
3. [ ] Apply filters
4. [ ] View results in grid/list/map
5. [ ] Open property detail
6. [ ] Bookmark property
7. [ ] View saved deals
8. [ ] Create alert
9. [ ] Switch language
10. [ ] Reload page, state persists
11. [ ] No console errors
12. [ ] All API calls successful

---

## Notes

- **Timing:** Each section takes ~5-10 minutes. Full suite ~2-3 hours.
- **Regression:** After each code change, run sections 1-5 + 21 (smoke test).
- **Bugs:** Log with: browser, steps to reproduce, expected vs actual, screenshot.
- **Performance:** Monitor Network tab for slow requests (>1s), large payloads (>500KB).
