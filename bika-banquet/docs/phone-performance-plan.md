# Bika Banquet — Phone / Mobile UI Performance Plan

Owner: phone/mobile UI performance. Branch: `claude/serene-darwin-33jtn`.

## How to read this doc

The web client in `client/` is a single Next.js 14 app that renders identically on:
desktop browser, mobile browser, the Capacitor wrapper (`client/capacitor.config.ts`
loads the **remote** `https://banquet.bikafood.com` via `server.url`), and the
`native-client/` React Native bare `WebView` (`native-client/src/screens/DashboardWebScreen.tsx`,
also loads the same remote URL). **Therefore every web-client change here affects desktop too.**
Each item below flags desktop impact explicitly.

Verified facts (spot-checked, not re-derived):
- `client/capacitor.config.ts:9-13` — `server.url` points at the remote site; `webDir: 'public'` is unused for content.
- `native-client/src/screens/DashboardWebScreen.tsx:5,18` — bare `WebView source={{ uri }}` to the same remote URL, no auth bridge.
- Test infra: `client/vitest.config.ts` (environment `node`, include limited to `src/lib/**/__tests__` + `src/lib/booking-form/**/__tests__`). Playwright e2e in `client/e2e/` (`booking-form`, `capacitor-mobile`) with `playwright.*.config.ts`. `npm install` + `npx vitest run` confirmed working (32 tests pass).
- **Caveat on existing tests:** `client/src/__tests__/useSSE.test.ts` and `dashboardDebounce.test.ts` are NOT in the vitest include globs and reference an `eventSource.onopen` handler that **no longer exists** in `useSSE.ts`. Their "source check" assertions are stale. New calendar tests will be added under the included `src/lib/**/__tests__` path as pure-logic tests so they actually run in CI.

Priority tags preserved from the brief: 🔴 Critical/Architectural, 🟠 High/Med, 🟡 Med.

---

## ITEM A — 🔴 Architectural: remote-loaded WebView + double login

### A. Current state
- `client/capacitor.config.ts:9-13`: `server: { url: 'https://banquet.bikafood.com', cleartext: true }`. The Capacitor app loads the live site over the network; `webDir: 'public'` is ignored. No local shell → blank/native-spinner until the remote HTML+JS downloads on every cold start.
- `native-client/src/screens/DashboardWebScreen.tsx:5,18`: `<WebView source={{ uri: 'https://banquet.bikafood.com' }} />`. The WebView keeps its own cookie/localStorage jar; any RN-side session is not shared, so the user logs in again inside the WebView → **double login**.
- Auth lives in `client/src/store/authStore` and is restored from `localStorage` by `client/src/components/AuthBootstrap.tsx`.

### Option A1 — Bundle assets locally in Capacitor (`webDir` instead of `server.url`)
- **Proposed change:** `next build` with static export (or a Capacitor-served build) into `webDir`; remove `server.url` so the shell loads instantly from the bundle and only the API/SSE calls hit the network. API base stays remote via `NEXT_PUBLIC_API_URL`.
- **Workflow-impact analysis:** YES — changes the **deploy model**. Today a frontend change is live the moment `banquet.bikafood.com` redeploys. With local bundling, **every frontend change requires a new app-store/APK release** and users on old binaries run old UI against the same API (version-skew risk). No user-facing screen changes, but the operational contract changes materially.
- **Operational tradeoff (called out per brief):** instant first paint + offline shell vs. losing instant web-style frontend rollouts; needs an API-versioning / min-supported-client policy.
- **Test strategy:** Playwright `capacitor.config` smoke (`client/e2e/capacitor-mobile`) against the bundled build; cold-start paint timing; a deliberate API-version-skew test.
- **Risk:** HIGH. **Rollback:** restore `server.url`, ship a hotfix binary. **Desktop:** none (Capacitor-only config).
- **STATUS: DEFERRED — needs human approval (changes deploy model).**

### Option B — Double-login fix (share auth into the WebView, native-client)
- **Proposed change:** add an auth bridge in `native-client`. RN performs/holds the token, then injects it into the WebView before first paint via `injectedJavaScriptBeforeContentLoaded` writing the same `localStorage` key `authStore`/`AuthBootstrap` reads, plus `sharedCookiesEnabled`/`injectedJavaScript` for cookie-based sessions. WebView reads existing session → no second login.
- **Workflow-impact analysis:** YES (intended improvement) — the **login flow on `native-client`** changes: user authenticates once (native or web) instead of twice. User-visible outcome is *fewer* steps; must preserve logout (clearing RN token must clear WebView session) and token-refresh/expiry parity.
- **Test strategy:** RN integration test mocking the injected token; e2e: launch → assert dashboard renders without a login screen; logout clears both sides; expired token still routes to login.
- **Risk:** MED (token injection timing / storage-key drift with web `authStore`). **Rollback:** remove injection, revert to current double login. **Desktop:** none (native-client only); web `authStore` key contract must not change.
- **STATUS: DEFERRED — needs human approval (touches auth/login workflow).**

---

## ITEM B — 🔴 Critical: `limit: 5000` mega-fetches → server-side pagination (HYBRID by list size)

### Current state (file:line evidence)
- `client/src/lib/query/keys.ts:6` default list params `{ page: 1, limit: 5000 }`.
- `client/src/lib/query/hooks.ts:9` `BOOKINGS_LIST_PARAMS = { page: 1, limit: 5000 }` → `useBookingsListQuery` fetches all bookings at once.
- `client/src/app/dashboard/menu/page.tsx:494-500` — **6 parallel `limit:5000` fetches** (item-types, items, template-menus w/ items, ingredients, vendors).
- `client/src/app/dashboard/menu/ingredients/page.tsx:119-120`, `menu/vendors/page.tsx:149-151`, `halls/page.tsx:295-296`, `settings/page.tsx:539` — more `limit:5000`.
- `client/src/app/dashboard/bookings/page.tsx:1175,1717` — `getItems({limit:5000})`; the bookings *list itself* is fetched at 5000 then **paginated client-side** (`BOOKINGS_PAGE_SIZE = 75`, `paginatedBookings` slice at `:721-724`).
- Calendar already range-fetches with `limit:500` paging (`calendar-helpers.ts:407,430`) — leave as-is; it is date-bounded.

### Inventory + hybrid decision (approx. row counts to be confirmed against prod DB)
| List / endpoint | Approx rows / growth | Decision |
|---|---|---|
| bookings | large, grows forever | **Server-paginate** + server search/sort |
| customers | large, grows | **Server-paginate** + server search; typeahead search endpoint |
| enquiries | medium-large, grows | **Server-paginate** + server filter |
| payments / ledger | large, grows | **Server-paginate** |
| menu items | medium, grows slowly | Server-paginate **or** keep client w/ search endpoint for typeahead |
| menu templates | small-medium | Keep client-side (used as pickers) |
| ingredients / vendors | small-medium | Keep client-side; add search endpoint if dropdowns lag |
| item-types | small, stable | **Keep fully client-side** |
| halls | small, stable | **Keep fully client-side** |
| users | small | **Keep fully client-side** |
| banquets | small | **Keep fully client-side** |

### Proposed change
For each "server-paginate" list: drive `page`/`pageSize` from UI state into the query key; move **search** and **sort** into query params consumed by `server/` (Prisma `where`/`orderBy` + `skip`/`take`). Typeahead dropdowns (referrer customer at `customers/page.tsx:1065`, menu-item pickers in `bookings/page.tsx`) get a dedicated `?search=` endpoint returning a small capped set.

### Workflow-impact analysis (the feature-level change)
- **YES — changes UX on BOTH desktop and phone:** instant client-side filtering becomes **debounced server-side search** (network latency + spinner) on bookings, customers, enquiries, payments.
  - Bookings global/column search: `bookings/page.tsx` (`globalSearch`, `columnSearch`, `filterAndSortRows`).
  - Customers search: `customers/page.tsx:209` `filterAndSortRows(...)`.
- **Preserve the user-visible outcome:** same result set, same sort order, just fetched in pages. Search must remain case-insensitive across the same fields. Sort direction toggles must map 1:1 to server `orderBy`. Pagination boundary counts must match today's totals.
- **Risk if mishandled:** results differ from client filtering (collation, partial-match semantics, multi-field OR), lost "select-all-across-pages", export-all expectations.

### Test strategy
- Server: unit tests for pagination params, search `where` building, sort `orderBy`, zero-results, all-results, boundary pages (page 1, last page, page beyond last).
- Client: query-key includes page/search/sort; debounced search fires once; empty/zero/all-results render.
- Edge cases: empty list, single item, search with zero and with all matches, page-size boundaries, special characters in search.

### Risk / rollback / desktop
- **Risk:** HIGH (feature/UX + server changes). **Rollback:** feature-flag the server-paginated path; fall back to `limit:5000`. **Desktop:** YES — same client code.
- **STATUS: DEFERRED — needs human approval (alters search/sort workflow).**

---

## ITEM C — 🔴 High: list virtualization + `React.memo` + stable handlers

### Current state
- `client/src/components/BookingCard.tsx` and `MobileBookingCard.tsx` are plain (non-memoized) components.
- `client/src/app/dashboard/bookings/page.tsx:4896,4932,5008` render cards from `paginatedBookings` with **inline arrow props** (`onEdit={(id) => openEditBooking(id)}`, `onDelete`, `onExportPdf`, …) → new function identity every render → memo would be defeated anyway.
- Bookings list is already client-paginated to `BOOKINGS_PAGE_SIZE = 75` (`:450`), so each render is bounded to ~75 cards (≤3 lists). Customers (`customers/page.tsx`) uses a `DataTable`/`filterAndSortRows` table.

### Proposed change (behavior-preserving)
1. Wrap `BookingCard` and `MobileBookingCard` in `React.memo`.
2. Stabilize the handlers in `bookings/page.tsx` with `useCallback` that take the booking/id (already-stable callbacks: `openEditBooking`, `handleDeleteBooking`, `openMenuPdfModal`, `handleDownloadBookingPdf`), passing `booking`/`id` instead of closing over them inline.
3. Virtualization: **only where a single render exceeds a few hundred rows.** Since bookings render ≤75/page, prefer raising memo coverage over react-window there. Re-evaluate the customers table and any non-paginated long list; virtualize with `@tanstack/react-virtual` (preferred — fewer caveats than `react-window`) **only** after confirming caveats below.

### Virtualization caveats — checked per list (per brief)
- **Ctrl-F / browser find:** virtualization unmounts off-screen rows → in-page find breaks. Bookings/customers rely on *their own* search box, not Ctrl-F → acceptable, but documented.
- **Select-all:** customers/bookings export use `.slice(0, N)` of the full data array (`bookings/page.tsx:1371` slice(0,20), `customers/page.tsx:234` slice(0,40)), **not** DOM selection → unaffected by virtualization.
- **Print / export:** print/export read from the data arrays, not the DOM (`handlePrintDay` fetches details by id; PDF export uses data) → unaffected. Confirm no `window.print()` of the list DOM before virtualizing each list.

### Workflow-impact analysis
- **NO behavior change** for memo + stable handlers: identical render output, identical click results; purely fewer re-renders. Justification: same props in → same JSX out; handlers already call the same stable functions.
- Virtualization: **NO** intended change *if* caveats hold (search box, data-array export/print preserved). Any list that fails a caveat check is **excluded** from virtualization.

### Test strategy
- Render test: card receives stable handler identity across parent re-renders (memo not busted).
- Snapshot/behavior parity: edit/delete/export callbacks still fire with the correct id.
- Edge cases: empty list, single item, multi-hall booking card.
- Virtualized list (if applied): scroll to last item, item present; empty list renders empty state.

### Risk / rollback / desktop
- **Risk:** LOW (memo/handlers), MED (virtualization). **Rollback:** drop `memo`/virtual wrapper. **Desktop:** YES — same components.
- **STATUS: IMPLEMENT NOW (memo + stable handlers; virtualization only where caveat-safe).**

---

## ITEM D — 🟠 High: filter/sort of large arrays per keystroke

### Current state
- `client/src/lib/tableUtils.ts:70` `filterAndSortRows` filters then sorts the **entire** array on every call; comparators rebuilt each invocation. Driven on each keystroke via `globalSearch`/`columnSearch` (used by customers `:209`, bookings).

### Proposed change (behavior-preserving)
- Memoize the comparator (hoist `localeCompare`/number compare out of the row loop), short-circuit when search is empty, and keep callers wrapping the result in `useMemo` keyed on `[rows, search, sort]` (customers already does at `:209`).
- Where a list becomes server-paginated (Item B), filtering/sorting moves server-side and this path is bypassed — but that is the **deferred** change; the memoization here is independent and safe now.

### Workflow-impact analysis
- **NO behavior change:** identical filtered+sorted output; only fewer allocations/comparator rebuilds. Server-side move is **not** part of this safe step.

### Test strategy
- Add `tableUtils` unit tests (fits `src/lib/__tests__`): same output as before for global search, column search, ascending/descending sort, empty search, zero results, single row, stable sort tie-break. Edge: mixed-type accessors, empty string vs undefined.

### Risk / rollback / desktop
- **Risk:** LOW. **Rollback:** revert `tableUtils.ts`. **Desktop:** YES.
- **STATUS: IMPLEMENT NOW (memoize comparators only).**

---

## ITEM E — 🟠 High: auth blocks first paint + dashboard waterfall

### Current state
- `client/src/app/layout.tsx:54` renders `<AuthBootstrap />` (`components/AuthBootstrap.tsx`) which calls `loadUser()` in an effect; routes wait on `user` before rendering authed UI.
- `client/src/app/dashboard/page.tsx` issues ~10 `api.get*`/`useQuery` calls (grep count 10) — a near-waterfall on first load.

### Proposed change
- Render the static shell/skeleton immediately; resolve auth in parallel; parallelize/prefetch the dashboard queries (they are already `Promise.all`-ish in places — ensure no serial awaits and use TanStack `prefetchQuery`).
- **Ensure no flash of authed UI before auth resolves:** gate only the *content* on `user`, not the shell; keep the redirect-to-login decision after `loadUser()` settles.

### Workflow-impact analysis
- **NO behavior change** if done carefully: same screens, same redirect rules; only ordering/parallelism changes. Risk to avoid: a flash of authed content for an unauthenticated user (must keep the auth gate before rendering protected data).

### Test strategy
- e2e: cold load shows skeleton, then dashboard; unauthenticated user never sees authed content (no flash) and lands on `/login`; authed user sees no login flash.
- Edge: auth-not-ready (loadUser pending) renders shell, not protected data.

### Risk / rollback / desktop
- **Risk:** MED (flash-of-auth regressions). **Rollback:** restore current gating. **Desktop:** YES.
- **STATUS: Partially safe.** The shell-first / no-flash change touches the auth gate (workflow-adjacent) → **the auth-gating reorder is DEFERRED** for human review; only pure query-parallelization/prefetch (no gate change) may be done as a safe step if low-risk.

---

## ITEM F — 🟠 Med: TanStack Query cache + SSE backoff + optimistic CRUD

### Current state
- `client/src/lib/query/client.ts`: `staleTime: STALE_TIME_MS` (30s, `keys.ts:1`), `retry: 1`, `refetchOnWindowFocus: false`, **no `gcTime`**.
- `client/src/hooks/useSSE.ts`: on token-fetch/connection error there is **no reconnect/backoff** (connection just dies silently); and the effect re-runs on `onEvent` change (see Item H) → reconnect storms on navigation.

### Proposed change (behavior-preserving)
- Set an explicit `gcTime` (e.g. 5 min) so cached lists survive brief unmounts (faster back-navigation on phone). Keep `staleTime` 30s. Consider `retry` with backoff for transient network (phone). 
- Add SSE **reconnect with exponential backoff + jitter** and a cap; reconnect on `onerror`/close while `enabled`. Combine with the Item H ref fix so navigation no longer tears down/recreates the connection.
- Broaden optimistic updates on CRUD where safe (already present in `hooks.ts` invalidations) — scope conservatively.

### Workflow-impact analysis
- **NO user-visible behavior change:** same data, same freshness rules; `gcTime`/backoff only affect caching/reconnection timing. Optimistic CRUD must still reconcile with server truth (no divergent state).

### Test strategy
- Unit: backoff schedule (delays grow, capped, jittered); reconnect only while `enabled`; no reconnect after cleanup.
- Query: `gcTime` set; cached list reused on remount within window.
- Edge: rapid connect/disconnect, server 401 (stop, don't storm).

### Risk / rollback / desktop
- **Risk:** LOW–MED. **Rollback:** revert `client.ts` / `useSSE.ts`. **Desktop:** YES.
- **STATUS: IMPLEMENT NOW (gcTime tuning + SSE backoff).** Optimistic-CRUD broadening kept minimal/safe.

---

## ITEM G — 🟡 Med: client bundle (`'use client'` everywhere, heavy imports)

### Current state
- `'use client'` at the top of most dashboard pages and `lib/query/*`. Heavy named imports from `lucide-react` (per-icon, already named so tree-shakeable) and `date-fns`.

### Proposed change (behavior-preserving)
- Verify `lucide-react` imports are named (they are — e.g. `BookingCard.tsx:3-12`) so tree-shaking works; replace any wildcard/barrel imports; prefer `date-fns` submodule imports (`date-fns/format`) over barrel; ensure `next.config.mjs` `optimizePackageImports` covers `lucide-react`/`date-fns`.
- No component splitting that changes behavior in this pass.

### Workflow-impact analysis
- **NO behavior change:** identical output; only smaller JS shipped → faster phone load.

### Test strategy
- Build succeeds; bundle-size diff recorded (before/after `next build`); visual smoke unchanged.

### Risk / rollback / desktop
- **Risk:** LOW. **Rollback:** revert import changes / `next.config.mjs`. **Desktop:** YES.
- **STATUS: IMPLEMENT NOW (tree-shaking config + import hygiene), low-risk only.**

---

## ITEM H — DUPLICATION BUG: bookings replicate on calendar day A → B → A (phone)

Three independent root causes; all three must be fixed. Tests reproduce day→day→day.

### H1 — `client/src/hooks/useSSE.ts`: re-subscribe on every navigation + open/close race
- **Current:** `useEffect(..., [enabled, onEvent])` (`useSSE.ts:54`). `onEvent` (here `debouncedLoadCalendar`, which depends on `loadCalendarData` → `viewDate, viewMode`) changes on **every** navigation, so the effect tears down and re-opens the `EventSource`. The open is async (`await api.getSseToken()`); the sync cleanup runs first, but a slow token fetch can resolve **after** cleanup and assign a fresh `eventSource` that the (already-run) cleanup never closes → **leaked EventSource connections**, each firing `onEvent` → repeated refetches that append/duplicate.
- **Fix:** hold `onEvent` in a ref (like the existing `prefixesRef`) and **remove `onEvent` from deps** (`[enabled]` only). Guard the open/close race: track a local `cancelled` flag *and* close any `eventSource` created after cancellation (`if (cancelled) { es.close(); return; }`). 
- **Workflow-impact:** NO — real-time refresh still fires on `booking:`/`enquiry:` events; only stops leaking connections. Behavior-preserving.

### H2 — `calendar/page.tsx` `loadCalendarData`: no AbortController / latest-wins
- **Current:** `loadCalendarData` (`page.tsx:146-199`) `await Promise.all([...])` then unconditionally `setBookings(...)`. Navigating A→B→A fires three loads; an earlier wider-range response can resolve **last** and overwrite the current view → stale/duplicated entries for the visible day.
- **Fix:** add an `AbortController` per call (abort the previous) **and** a monotonically increasing request-id "latest-wins" guard so only the most recent response commits state; pass `signal` into `fetchBookings/fetchEnquiries/fetchGoogleCalendarEvents` (thread through `api`).
- **Workflow-impact:** NO — same data for the current view; just discards out-of-order/aborted responses. Behavior-preserving.

### H3 — multi-hall / unmatched-hall bookings render once per hall row (no dedupe)
- **Current:** `hallBoardRows` (`page.tsx:494-561`) iterates `entry.halls` and pushes a slot **per hall row** into per-hall lists. In `VenueTimelineBoard.tsx`, day-view grouped venue rows flatten across halls (`vSlots = assignLanes(g.halls.flatMap(h => h.slots...))` at `:338`) and `Bar` keys fall back to `s.functionName+s.date` when `bookingId` collides (`:347,363`) → a multi-hall booking shows multiple times and keys can collide.
- **Fix:** (a) keep per-hall slots for the hall grid, but in the grouped/venue aggregate **dedupe by `bookingId`** before `assignLanes`; (b) make `Bar`/slot keys uniquely include hall context (`hallId`-qualified) so React keys never collide; (c) ensure `bookingsByDate`/day-panel list dedupes by `bookingId` (it already buckets per booking, but add a guard for defensive dedupe). 
- **Workflow-impact:** NO intended change to the hall grid (a booking still appears in each hall it occupies); the venue-aggregate view stops showing the **same** booking N times. Edge: a genuine multi-hall booking should appear once in the aggregate row, once per occupied hall in the grid — verified by test.

### Test strategy (reproduce day→day→day)
- Pure-logic tests under `src/lib/__tests__` (so they run in vitest `node` env) extracting:
  - **latest-wins reducer**: given out-of-order responses (req1 wide resolves after req3 narrow), only req3 commits.
  - **SSE subscription manager logic**: changing `onEvent` does not create a new connection; a connection created after cancel is closed; one event → one `onEvent`.
  - **dedupe-by-bookingId** for the venue-aggregate builder: multi-hall booking yields exactly one aggregate slot and N grid slots; empty list, single booking, unmatched-hall booking, two bookings same day.
  - **date-key timezone boundary**: `dateToKey`/`formatDateKey` produce the same key across local-midnight edges (no off-by-one duplicate buckets).
- Optional Playwright `capacitor-mobile` e2e: navigate day A→B→A, assert each booking renders exactly once.

### Risk / rollback / desktop
- **Risk:** LOW (behavior-preserving, highest user pain). **Rollback:** revert the three diffs independently. **Desktop:** YES — same calendar code (desktop benefits from the leak/race fix too).
- **STATUS: IMPLEMENT FIRST (step 1).**

---

## Implementation order (per HARD CONSTRAINTS)

1. **Step 1 — Calendar duplication fix (H1+H2+H3)**, test-first. Highest pain, lowest risk, behavior-preserving.
2. **Step 2 — Safe behavior-preserving perf fixes:** Item C (memo + stable handlers + caveat-safe virtualization), Item D (memoized comparators), Item F (gcTime + SSE backoff), Item G (tree-shaking). Then STOP and summarize.

**DEFERRED for explicit human approval (NOT implemented):**
- Item A (A1 local bundling — changes deploy model).
- Item B (server-side pagination + server search/sort — changes search/sort UX on desktop+phone).
- Item B Option B / native-client auth bridge (changes login workflow).
- Item E auth-gating reorder (workflow-adjacent flash-of-auth risk) — only pure prefetch/parallelization without gate changes is safe.

## Test execution reality
- `npm install` + `npx vitest run --config vitest.config.ts` confirmed working (32 existing tests pass). New unit tests are written as pure-logic modules placed under the included globs so they actually execute.
- React-component/hook tests (jsdom + testing-library) and Playwright e2e require additional setup / a live backend / a device and may not be runnable in this environment; those will be reported honestly as "added but not executed here" where applicable.
