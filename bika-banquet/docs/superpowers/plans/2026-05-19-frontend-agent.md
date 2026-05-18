# Frontend Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 50,000-row data waterfall on dashboard load, fix navigation remount, replace JS-driven hover with CSS, fix font mismatch, restore micro-transitions, and extract inline styles from the layout file.

**Architecture:** Dashboard page drops `fetchAllBookings` and `limit:5000` — it already calls `api.getDashboardSummary` which hits `/api/analytics/dashboard`. All KPI numbers come from that one call. The layout shell stops remounting on route change by removing `key={pathname}`. Sidebar hover moves to pure CSS. Root layout loads one font (Inter via `next/font/google`). `globals.css` gets targeted transitions instead of blanket `transition: none`.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, `next/font/google`

**This plan is independent of the Database and Backend Agent plans** — all changes are in `client/src/`. Run in parallel with both backend plans.

**Run all commands from:** `/Users/harshitgoyal/Downloads/files/bika-banquet/client`

---

## Task 1: Wire dashboard to analytics endpoint (remove `fetchAllBookings` + `limit:5000`)

**Problem:**
- `dashboard/page.tsx:222-244` — `fetchAllBookings` paginates up to 100 pages × 500 rows to compute 5 numbers client-side.
- `dashboard/page.tsx:465` — `api.getEnquiries({ page: 1, limit: 5000 })` fetches all enquiries to count pencil bookings.
- `api.getDashboardSummary()` already exists and returns `summary`, `trends`, `breakdown` from the server — but `fetchAllBookings` runs alongside it anyway.

**Fix:** Delete `fetchAllBookings`. Remove the `limit:5000` enquiries call. Derive all KPI values from `analytics` (already fetched). For pencil bookings count, add a server-side count query (see sub-step below).

**Files:**
- Modify: `client/src/app/dashboard/page.tsx`

- [ ] **Step 1: Understand what `fetchAllBookings` results are used for**

Open `client/src/app/dashboard/page.tsx` and search for every usage of the `bookings` variable (the result of `fetchAllBookings`). List what each usage computes:

```bash
grep -n "bookings\b" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/dashboard/page.tsx | head -40
```

The usages are:
- `buildHallRevenue(bookings)` — computes hall revenue breakdown
- `activeBookings.filter(...)` — totalBookedValue, totalCollected
- `upcomingThirtyDays` — next 30 days bookings
- `recentBookings` — last 6 bookings for the "Recent Bookings" card

All of these except `recentBookings` are server-aggregatable. The `analytics` object from `getDashboardSummary` already provides `summary.totalRevenue`, `breakdown.hallPerformance`, and `trends.monthly`. `recentBookings` needs only `limit: 6`.

- [ ] **Step 2: Check what `allEnquiries` is used for**

```bash
grep -n "enquir\|pencil" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/dashboard/page.tsx | head -20
```

Expected: used only to count `pencilBookings` (enquiries in range where `isPencilBooked === true`). This is a simple server-side `COUNT` — add it to the analytics endpoint or use a separate `/api/enquiries/count?isPencilBooked=true` call.

- [ ] **Step 3: Add `pencilCount` to the analytics API call**

Check what `api.getDashboardSummary` returns (it already includes `summary`, `trends`, `breakdown`). For pencil bookings, make a lightweight count call:

```typescript
// Replace: api.getEnquiries({ page: 1, limit: 5000 })
// With:
api.getEnquiries({ page: 1, limit: 1, isPencilBooked: 'true' })
```

This returns `pagination.total` which is the count — no data rows needed. Update the pencilBookings line:

```typescript
const pencilBookings = (enquiriesRes.data?.data?.pagination?.total || 0) as number;
```

- [ ] **Step 4: Add recent bookings fetch (limit: 6)**

Replace `fetchAllBookings(...)` with:

```typescript
api.getBookings({ page: 1, limit: 6, fromDate: normalizedStart || undefined, toDate: normalizedEnd || undefined })
```

Store result as `recentBookingsRes` and use `recentBookingsRes.data?.data?.bookings || []` for the recent bookings card.

- [ ] **Step 5: Remove `fetchAllBookings` and client-side KPI computations**

Delete the entire `fetchAllBookings` function (lines 222-244).

Remove `buildHallRevenue` call and derive hall revenue from `analytics.breakdown.hallPerformance` instead:

```typescript
const hallsByRevenue = (analytics.breakdown.hallPerformance || []).map((h) => ({
  hallId: h.hallId,
  hallName: h.hallName,
  revenue: h.revenue ?? 0,
  bookings: h.bookings ?? 0,
  share: analytics.summary.totalRevenue > 0
    ? ((h.revenue ?? 0) / analytics.summary.totalRevenue) * 100
    : 0,
}));
```

Remove `totalBookedValue`, `totalCollected`, `upcomingThirtyDays` computations that came from the full bookings array — these should come from `analytics.summary` instead, or be removed if not displayed. Check which KPI cards display these values and map them:

```typescript
// Use analytics.summary values directly
const totalRevenue = analytics.summary.totalRevenue;
const totalBookings = analytics.summary.bookingsInRange;
const cancelledBookings = analytics.summary.cancelledBookings;
```

- [ ] **Step 6: Remove `BookingRow`, `EnquiryRow` interfaces if no longer used**

```bash
grep -n "BookingRow\|EnquiryRow" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/dashboard/page.tsx
```

Delete unused interface declarations.

- [ ] **Step 7: Verify the page compiles**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors. Fix any type errors from removed variables.

- [ ] **Step 8: Manual test — open dashboard in browser**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client
npm run dev
```

Open `http://localhost:3000/dashboard`. Open Network tab in DevTools. Verify:
- No request to `/api/bookings` with `limit=500` in a loop
- One request to `/api/analytics/dashboard`
- One request to `/api/enquiries?limit=1&isPencilBooked=true`
- One request to `/api/bookings?limit=6`
- KPI cards show numbers (not zeros or NaN)

- [ ] **Step 9: Commit**

```bash
git add client/src/app/dashboard/page.tsx
git commit -m "perf: replace 50k-row fetchAllBookings waterfall with analytics endpoint + limit:6 recent bookings"
```

---

## Task 2: Remove `key={pathname}` remount from dashboard layout

**Problem:** `dashboard/layout.tsx:1293` — `<div key={pathname} className="page-enter">` causes React to fully unmount and remount the page content on every navigation. The sidebar, header, and all shared state also re-render unnecessarily. Every route change feels like a page reload.

**Files:**
- Modify: `client/src/app/dashboard/layout.tsx:1293`

- [ ] **Step 1: Locate the exact line**

```bash
grep -n 'key={pathname}' /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/dashboard/layout.tsx
```

- [ ] **Step 2: Remove `key={pathname}`, keep the className**

Change:
```tsx
<div key={pathname} className="page-enter">
  {children}
</div>
```

To:
```tsx
<div className="page-content">
  {children}
</div>
```

- [ ] **Step 3: Update the CSS class**

In `globals.css`, find the `.page-enter` animation block (around line 1250-1264). Add `.page-content` as a stable wrapper with no animation:

```css
.page-content {
  min-height: 0;
  flex: 1;
}
```

Keep `.page-enter` class in CSS (it may be used elsewhere) but don't apply it to the shell wrapper.

- [ ] **Step 4: Compile check**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Manual test — navigate between routes**

```bash
npm run dev
```

Navigate between Dashboard → Bookings → Customers → Calendar. Verify the sidebar does NOT flicker or re-render on each transition. Verify page content updates correctly.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/dashboard/layout.tsx client/src/app/globals.css
git commit -m "perf: remove key={pathname} remount — shell stays mounted across route changes"
```

---

## Task 3: Replace JS-driven sidebar hover with CSS

**Problem:** `dashboard/layout.tsx:321,325` and 6 more locations — `onMouseOver`/`onMouseOut` event handlers mutate `event.currentTarget.style` directly to simulate hover. This fires on the JS thread, bypasses the browser's compositor, and causes layout thrashing.

**Files:**
- Modify: `client/src/app/dashboard/layout.tsx` (remove all onMouseOver/onMouseOut handlers)
- Modify: `client/src/app/globals.css` (add hover CSS for the affected elements)

- [ ] **Step 1: Find all hover handler locations**

```bash
grep -n "onMouseOver\|onMouseOut" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/dashboard/layout.tsx
```

Note each element's purpose (theme toggle button, nav items, etc.) and its current hover target colors:
- `color: var(--text-1)` on hover, `color: var(--text-3)` on out
- `borderColor: var(--border-2)` on hover, `borderColor: var(--border)` on out

- [ ] **Step 2: Add CSS classes for each hovered element**

In `client/src/app/globals.css`, add:

```css
/* Sidebar / layout hover states — replaces JS onMouseOver handlers */
.sidebar-icon-btn {
  color: var(--text-3);
  border-color: var(--border);
  transition: color 150ms ease, border-color 150ms ease, background-color 150ms ease;
}

.sidebar-icon-btn:hover {
  color: var(--text-1);
  border-color: var(--border-2);
}

.nav-item-hover {
  transition: background-color 150ms ease, color 150ms ease;
}

.nav-item-hover:hover {
  background-color: var(--teal-50);
  color: var(--text-1);
}
```

- [ ] **Step 3: Apply CSS classes and remove JS handlers**

For each element with `onMouseOver`/`onMouseOut` in `layout.tsx`:
1. Remove `onMouseOver={...}` and `onMouseOut={...}` props.
2. Remove any `style={{ color: ..., borderColor: ... }}` that was being controlled by those handlers.
3. Add the appropriate CSS class (`sidebar-icon-btn` or `nav-item-hover`).

For example, the theme toggle button (line ~315-328):

Before:
```tsx
<button
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s, background 0.15s',
  }}
  onMouseOver={(event) => {
    event.currentTarget.style.color = 'var(--text-1)';
    event.currentTarget.style.borderColor = 'var(--border-2)';
  }}
  onMouseOut={(event) => {
    event.currentTarget.style.color = 'var(--text-3)';
    event.currentTarget.style.borderColor = 'var(--border)';
  }}
>
```

After:
```tsx
<button className="sidebar-icon-btn inline-flex items-center justify-center cursor-pointer">
```

Repeat for all 4 pairs of onMouseOver/onMouseOut.

- [ ] **Step 4: Compile check**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Manual test — hover over sidebar items**

```bash
npm run dev
```

Hover over the theme toggle and sidebar nav items. Verify:
- Color transitions still occur on hover
- No flicker or jump
- Transition feels smooth (150ms)

- [ ] **Step 6: Commit**

```bash
git add client/src/app/dashboard/layout.tsx client/src/app/globals.css
git commit -m "perf: replace JS onMouseOver/Out handlers with CSS :hover transitions in sidebar"
```

---

## Task 4: Fix font mismatch — load Inter via next/font

**Problem:** `layout.tsx:44-46` sets `--font-manrope` to an Inter fallback string and `--font-display` to Georgia. No font is actually loaded via `next/font`. Product UI ends up with mixed system fonts and Georgia on login.

**Files:**
- Modify: `client/src/app/layout.tsx`
- Modify: `client/src/app/globals.css` (update font variable usage)

- [ ] **Step 1: Replace inline font strings with `next/font/google`**

In `client/src/app/layout.tsx`, replace:

```typescript
import type { Metadata, Viewport } from 'next';
import type { CSSProperties } from 'react';
import './globals.css';
```

With:

```typescript
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
```

Replace the `<body>` tag:

```tsx
// Before:
<body
  style={
    {
      '--font-manrope': 'Inter, ui-sans-serif, ...',
      '--font-display': '"Georgia", ...',
    } as CSSProperties
  }
>

// After:
<body className={inter.variable}>
```

Remove the `CSSProperties` import if no longer needed.

- [ ] **Step 2: Update CSS variable references in globals.css**

```bash
grep -n "font-manrope\|font-display\|var(--font" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/globals.css | head -20
```

Replace any `var(--font-manrope)` with `var(--font-inter)` and remove any `var(--font-display)` (Georgia) from product UI. In `:root` or `body`, ensure:

```css
body {
  font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}
```

Check `tailwind.config.js` for font family config:

```bash
grep -n "fontFamily\|manrope\|display" /Users/harshitgoyal/Downloads/files/bika-banquet/client/tailwind.config.js
```

Update to match:
```javascript
fontFamily: {
  sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
},
```

- [ ] **Step 3: Check login page for Georgia usage**

```bash
grep -rn "font-display\|Georgia\|serif" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/login/ 2>/dev/null | head -10
```

If any login component uses `var(--font-display)` or `font-serif`, replace with the Inter variable or `font-sans`.

- [ ] **Step 4: Compile check**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Manual test — check font rendering**

```bash
npm run dev
```

Open `http://localhost:3000/login` and `http://localhost:3000/dashboard`. In DevTools → Elements → Computed → font-family. Verify `Inter` is applied, not Georgia or system-ui fallback.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/layout.tsx client/src/app/globals.css client/tailwind.config.js
git commit -m "fix: load Inter via next/font, remove Georgia from product UI, consistent type system"
```

---

## Task 5: Restore micro-transitions on interactive elements

**Problem:** `globals.css:175,207,285,1151` — `transition: none` overrides on buttons, inputs, and table rows make hover/focus feel abrupt. Replace with targeted short transitions.

**Files:**
- Modify: `client/src/app/globals.css`

- [ ] **Step 1: Find all `transition: none` occurrences with context**

```bash
grep -n "transition" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/globals.css | head -30
```

Note which selectors have `transition: none` and what their hover/focus states look like.

- [ ] **Step 2: Replace `transition: none` on buttons**

Find the button selectors (likely `.btn-primary`, `.btn-secondary`, `button` base). Replace:

```css
/* Before */
transition: none;

/* After — on .btn-primary, .btn-secondary, button[type="submit"] */
transition: background-color 120ms ease, box-shadow 120ms ease, border-color 120ms ease, opacity 120ms ease;
```

- [ ] **Step 3: Replace `transition: none` on inputs**

Find `input`, `select`, `textarea` selectors. Replace:

```css
/* After — on input, select, textarea */
transition: border-color 120ms ease, box-shadow 120ms ease;
```

- [ ] **Step 4: Replace `transition: none` on table rows**

Find `tbody tr` or similar selectors. The `@apply transition-colors` at line 175 is correct — check if any overriding `transition: none` exists below it and remove it.

- [ ] **Step 5: Check for `transition: none` on any remaining selectors**

```bash
grep -n "transition: none" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/globals.css
```

Expected: 0 results. If any remain, evaluate case by case — only keep `transition: none` for elements inside `@media (prefers-reduced-motion: reduce)` blocks.

- [ ] **Step 6: Add `prefers-reduced-motion` wrapper**

At the bottom of `globals.css`, add:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 7: Manual test — button and input hover**

```bash
npm run dev
```

Open dashboard. Hover over primary buttons, click into inputs. Verify smooth color/shadow transition (~120ms). Verify table rows still highlight on hover.

- [ ] **Step 8: Commit**

```bash
git add client/src/app/globals.css
git commit -m "fix: restore 120ms micro-transitions on buttons, inputs, table rows; add prefers-reduced-motion"
```

---

## Task 6: Extract inline styles from dashboard layout

**Problem:** `dashboard/layout.tsx` has ~64 `style={{}}` blocks. Inline styles bypass browser caching, can't be optimized by the CSS engine, and make the file hard to read at 42KB.

**Files:**
- Modify: `client/src/app/dashboard/layout.tsx`
- Modify: `client/src/app/globals.css`

- [ ] **Step 1: Identify the highest-frequency inline style patterns**

```bash
grep -c "style={{" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/dashboard/layout.tsx
grep -n "style={{" /Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app/dashboard/layout.tsx | head -30
```

Categorize by type: sidebar width/transition styles, main content padding styles, icon styles, flex/positioning styles.

- [ ] **Step 2: Extract sidebar container styles**

Find the sidebar `<aside>` or `<div>` element that has dynamic width styles. If the width is truly dynamic (depends on state like `isExpanded`), keep it inline but move the static parts to a class.

Example pattern — static parts go to CSS, dynamic part stays inline:

```tsx
// Before:
<div style={{
  width: isExpanded ? '240px' : '64px',
  transition: 'width 200ms ease',
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100vh',
  overflow: 'hidden',
  zIndex: 40,
}}>

// After:
<div className="sidebar-shell" style={{ width: isExpanded ? '240px' : '64px' }}>
```

In `globals.css`:
```css
.sidebar-shell {
  transition: width 200ms ease;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  overflow: hidden;
  z-index: 40;
}
```

- [ ] **Step 3: Extract main content padding styles**

The `<main>` element has inline padding from `pathname`. Move static padding to a class; keep only the dynamic `paddingRight` computed from `pathname`:

```tsx
// Before:
<main style={{
  paddingTop: 'clamp(16px, 2.5vw, 28px)',
  paddingLeft: 'clamp(16px, 2.5vw, 28px)',
  paddingRight: pathname.startsWith('/dashboard/calendar') ? '0' : 'clamp(16px, 2.5vw, 28px)',
}}>

// After:
<main
  className="dashboard-main"
  style={{ paddingRight: pathname.startsWith('/dashboard/calendar') ? '0' : 'clamp(16px, 2.5vw, 28px)' }}
>
```

In `globals.css`:
```css
.dashboard-main {
  padding-top: clamp(16px, 2.5vw, 28px);
  padding-left: clamp(16px, 2.5vw, 28px);
}
```

- [ ] **Step 4: Extract remaining static inline styles across layout**

Go through the remaining `style={{}}` occurrences. For each:
- If ALL values are static → move entirely to a CSS class
- If ANY value is dynamic → keep only the dynamic property inline, move static properties to a class

Focus on the top 20 highest-frequency patterns. Don't need to get to 0 inline styles — dynamic values should stay inline.

- [ ] **Step 5: Compile check**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Manual test — layout renders correctly**

```bash
npm run dev
```

Open dashboard. Navigate to Calendar (check `paddingRight: 0` applies). Check sidebar expands/collapses correctly. Inspect sidebar in DevTools to confirm CSS class applies transitions.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/dashboard/layout.tsx client/src/app/globals.css
git commit -m "refactor: extract static inline styles from dashboard layout into CSS classes"
```

---

## Task 7: Final verification

- [ ] **Check TypeScript**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Check Next.js build**

```bash
npm run build 2>&1 | tail -30
```

Expected: successful build, no warnings about missing exports or type errors.

- [ ] **Manual golden path test**

1. Open dashboard — verify KPI cards load from one analytics API call (Network tab)
2. Navigate Dashboard → Bookings → Customers → Calendar — verify no full remount (sidebar stays rendered, no flash)
3. Hover buttons and inputs — verify smooth 120ms transitions
4. Check sidebar hover — verify CSS-driven color change (not JS)
5. Check font — Inter loaded via DevTools → Network → Fonts
6. Sidebar expand/collapse — verify CSS transition (width animates)

---

## Edge Cases to Verify

1. **Dashboard with empty data** — analytics endpoint returns zeros. Verify KPI cards show 0, not NaN or undefined.
2. **Date range filter** — changing the date range on dashboard should still trigger a new analytics fetch, not re-run `fetchAllBookings`.
3. **Sidebar on mobile** — CSS hover states don't apply on touch. Verify touch targets still work (active state via `:active` pseudo-class).
4. **Font fallback** — if Inter fails to load (offline), verify fallback to `ui-sans-serif` renders acceptably.
5. **Calendar page** — `paddingRight: 0` must still apply when navigating to `/dashboard/calendar`.
6. **Prefers-reduced-motion** — enable in OS accessibility settings, verify animations and transitions are effectively disabled in the app.
