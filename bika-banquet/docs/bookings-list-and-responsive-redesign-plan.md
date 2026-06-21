# Bika Banquet — List/Grid, Filtering & Responsive Redesign Plan

Owner: frontend list-experience + responsive. Branch: `claude/vibrant-cori-1394g9`.
Status: **DESIGN — awaiting approval before any code.**

## How to read this doc

The web client in `client/` is a single Next.js 14 app. Per
`docs/phone-performance-plan.md`, the Capacitor app (`client/capacitor.config.ts`)
and the `native-client/` React Native shell both load the **same remote site**
through a WebView (`server.url`). **There is effectively one UI codebase for
desktop browser, mobile browser, and both native apps.** Every change here affects
all four surfaces. This is good news: responsive web work automatically ships to
the native apps, and we do not need a separate mobile component tree.

Priority tags: 🔴 Architectural, 🟠 High, 🟡 Medium.

### Decisions locked in (from product owner)

1. **Filters** → inline **column-header filters** (Excel/Airtable feel), not just a side panel.
2. **Mobile** → web-first responsive, but native apps remain a crucial surface. Since
   native is a WebView of the same site, we standardise on **one responsive web build**.
3. **Deliverable** → this written plan first; implementation follows approval.

---

## Verified facts (spot-checked, with file:line — not re-derived)

**Filters**
- `client/src/app/dashboard/bookings/page.tsx:475-500` — the Filters panel is six plain
  inputs. Date is a single `<input type="date">` (`:486`), not a range. Status (`:494`),
  Guests (`:490`), Amount (`:498`) are free-text boxes, not selects/ranges. **No Venue
  filter, no Hall filter** exist.
- `client/src/app/dashboard/bookings/page.tsx:72-96` — the client concatenates every
  per-field box into one `search` string and sends only `search`, `page`, `limit`,
  `sort`, `order`. Structured filters are never sent.
- `server/src/controllers/booking.read.ts:176-248` — the API **already accepts**
  `status` (exact), `fromDate`+`toDate` (real `functionDate.gte/lte` range), and
  `isQuotation`. These work today and the frontend discards them.
- The list endpoint does **not** yet accept hall/banquet/guest/amount filters
  (only the availability check at `booking.read.ts:45-136` takes `hallIds`).
- Table headers only sort (`BookingsListSection.tsx:343-376` via `SortableHeader`).
  There are no per-column header filters.

**Density / space**
- `client/src/app/styles/tokens.css:116-121` defines a compact density system
  (`--row-h: 30px; --cell-py: 5px`, labelled "Compact density (default)"). It is
  referenced **3 times total** in the codebase.
- The bookings table hard-codes `py-4 px-4` (16px) per cell across ~21 sites
  (`BookingsListSection.tsx:402-484`). Rows are ~3× taller than the design system intends.
- Three stacked padded containers render before the first data row: saved-views bar →
  controls `card` → table `card` (`BookingsListSection.tsx:99-212`).
- No sticky header, no virtualization, no column resize, no density toggle.

**Responsive / mobile**
- `BookingsListSection.tsx:273-499` mounts **both** the desktop `<table>`
  (`hidden md:block`) and the mobile card list (`md:hidden`) in the same React tree;
  CSS only hides one. Every device builds both DOM subtrees.
- `client/src/components/MobileBookingCard.tsx:8-24` redefines its own local `Booking`
  type instead of the shared one → silent drift risk between mobile and desktop.
- `@ionic/react` is imported by only 3 component files (`components/adaptive/AdaptiveButton.tsx`,
  `components/adaptive/AdaptiveCard.tsx`, `components/IonicProvider.tsx`) plus a CSS typedef.
  The `adaptive/` layer has **1 importer** total → effectively abandoned bundle weight.
- `@capacitor/*` (the native shell) is separate (`components/CapacitorNativeShell.tsx`,
  `lib/capacitor/nativeShell.ts`) and stays.

**Foundation gaps (from prior review)**
- No `cn()` / `tailwind-merge` / `class-variance-authority` anywhere → utility overrides
  on `.btn`/`.input` classes silently fail.
- The `components/ui/` primitive kit is imported by 1 file while 296 raw `<button>`s exist.

---

# Part 1 — Data grid, filtering & density 🔴

## 1.1 Target architecture

Replace the bespoke table + search-split-into-boxes with a **single reusable
DataTable primitive** built on:

- **@tanstack/react-table** — headless table engine: column defs, sorting, per-column
  filtering, column visibility, faceted (distinct-value) filters, pagination.
- **@tanstack/react-virtual** — row virtualization for large lists.
- **shadcn/ui** (Radix under the hood) for the controls that surround it: `Popover`,
  `Command` (faceted multiselect), `Select`, `Calendar`/date-range, `DropdownMenu`,
  `Checkbox`, `Badge`. These give correct keyboard/ARIA behaviour for free and fix the
  accessibility gaps noted in the prior review.
- **`cn()` + `tailwind-merge` + `cva`** added first so variants and overrides are reliable.

The DataTable lives at `client/src/components/data-table/` and is consumed by every list
screen (bookings, customers, enquiries, payments, halls, menu, vendors, ingredients, logs).

## 1.2 Structured filter model (single source of truth)

Replace the `columnSearch` string-bag with a typed model held in URL state (so filters
are shareable/bookmarkable and survive refresh):

```ts
// client/src/lib/booking-list/filters.ts
export interface BookingListFilters {
  search?: string;            // global full-text (kept)
  status?: BookingStatus[];   // multiselect: confirmed | pencil | quotation | enquiry | cancelled
  isQuotation?: boolean;
  banquetIds?: string[];      // Venue multiselect
  hallIds?: string[];         // Hall multiselect (depends on selected venues)
  dateFrom?: string;          // ISO — real range
  dateTo?: string;            // ISO
  guestsMin?: number;
  guestsMax?: number;
  amountMin?: number;
  amountMax?: number;
}
```

A `toQueryParams(filters)` helper maps this to the API. This is the abstraction that
makes every column header filter "just work" and stay in sync with the server.

## 1.3 Column-header filter UX (the chosen Excel/Airtable feel)

Each header carries a filter affordance appropriate to its data type. Active filters
show a dot/badge on the header and a removable chip in a thin filter bar above the table.

| Column            | Header filter control                         | Backend mapping |
|-------------------|-----------------------------------------------|-----------------|
| Function/Customer | text contains (debounced)                     | `search` (exists) |
| Date              | **date-range** picker (from / to + presets: This week, This month, Next 30d) | `fromDate`/`toDate` (exists) |
| Venue (banquet)   | **multiselect** (faceted from data)           | `banquetIds` (**new**) |
| Hall              | **multiselect**, scoped to chosen venues      | `hallIds` (**new**) |
| Guests            | **numeric range** (min/max)                   | `guestsMin`/`guestsMax` (**new**) |
| Grand total       | **numeric range** (min/max)                   | `amountMin`/`amountMax` (**new**) |
| Due               | preset toggle: All / Outstanding / Paid       | derived from `dueAmountValue` (**new**, pattern exists at `booking.read.ts:145-158`) |
| Status            | **multiselect** of real statuses              | `status` (exists; extend to accept CSV) |

Saved views (`BOOKING_SAVED_VIEWS`) are re-expressed as presets over this same filter
model, so views and manual filters stop being two parallel systems.

## 1.4 Backend changes required (small, additive)

All in `server/src/controllers/booking.read.ts:getBookings`, extending the existing
`where` builder (the date-range block at `:240-248` is the template):

- Accept `status` as comma-separated → `where.status = { in: [...] }`.
- `banquetIds` CSV → `where.halls = { some: { hall: { banquetId: { in: [...] } } } }`
  (compose with the existing venue-scope clause at `:191-193`).
- `hallIds` CSV → `where.halls = { some: { hallId: { in: [...] } } }`.
- `guestsMin`/`guestsMax` → `where.expectedGuests = { gte, lte }`.
- `amountMin`/`amountMax` → `where.grandTotalValue` (or equivalent numeric column) `{ gte, lte }`.
- `due=outstanding|paid` → reuse the `dueAmountValue` predicate already at `:152-156`.

Each gets a Zod-validated query schema (server already uses Zod). No schema/migration
changes — these are all existing columns/relations.

## 1.5 Density

- Switch the grid to the existing compact tokens (`--row-h`, `--cell-py`, `--cell-px`)
  with a **density toggle** (Comfortable / Compact) persisted per user, defaulting to Compact.
- Collapse the three stacked control containers into **one** sticky toolbar
  (search + active-filter chips + density/column menu + New booking).
- Sticky header + virtualization so density gains aren't lost on long lists.

---

# Part 2 — Responsive strategy 🟠

## 2.1 Problems being fixed

- Dual-DOM: desktop table and mobile cards both mounted (`BookingsListSection.tsx:273-499`).
- Type drift: `MobileBookingCard` has its own `Booking` shape.
- Oversized desktop forms on phones: `BookingFormModal` (1,151 LOC), `settings` (1,746),
  `menu` (2,646) don't restructure.
- Abandoned Ionic component layer adds bundle weight for ~1 importer.

## 2.2 Target

1. **One render path, breakpoint-gated, not dual-mounted.** The DataTable renders rows;
   a `useBreakpoint()`/container-query decides table-rows vs. stacked cards from **the same
   column definitions and the same `Booking` type**. Below `md`, columns marked
   `mobilePrimary`/`mobileSecondary` compose the card automatically. Delete the standalone
   `MobileBookingCard` duplicate.
2. **Container queries** for layout (forms, cards) so components adapt to their container,
   not just viewport — robust inside the modal/sheet and the WebView.
3. **Responsive forms.** Multi-column form grids collapse to single-column stacks below `md`;
   the modal is already a bottom-sheet on mobile (`FormPromptModal`), so only the inner
   content needs to stack. Start with `BookingFormModal`, then `settings`, then `menu`.

## 2.3 Ionic decision: remove the component layer, keep Capacitor 🔴

- **Remove** `@ionic/react` + `@ionic/core` and the `components/adaptive/*` + `IonicProvider`
  layer. Because native is a WebView of the same responsive site, dropping Ionic does **not**
  degrade native; it removes dead weight and a second styling system that fights the design tokens.
- **Keep** `@capacitor/*` and `CapacitorNativeShell`/`nativeShell.ts` (status bar, keyboard,
  haptics, safe-area insets) — these are the real native integration and are used.
- Net: one design system (tokens + shadcn), lighter bundle, faster cold WebView paint.

---

# Part 3 — Sequencing & rollout

Each phase is independently shippable and verifiable.

| Phase | Deliverable | Verify | Risk |
|-------|-------------|--------|------|
| 0 — Foundation | Add `cn`/`tailwind-merge`/`cva`; init shadcn (tokens mapped to existing CSS vars); add TanStack Table + Virtual. No UI change yet. | App builds; existing e2e green | 🟢 Low |
| 1 — Bookings reference | Rebuild Bookings list on DataTable: column-header filters (date-range, venue, hall, status multiselect, guest/amount range), compact density, single responsive path. Wire date-range + status to existing API now. | New Playwright filter/range tests; visual check desktop+phone | 🟠 Med |
| 2 — Backend filter params | Add `banquetIds`/`hallIds`/`guestsMin/Max`/`amountMin/Max`/`due` to `getBookings` + Zod. Wire remaining header filters. | Server unit tests on `where` builder; e2e faceted filters | 🟢 Low |
| 3 — Propagate | Move customers/enquiries/payments/halls/menu/vendors/ingredients/logs onto DataTable. Delete `MobileBookingCard` + per-screen table duplication. | Per-screen e2e smoke | 🟠 Med (breadth) |
| 4 — Responsive forms + Ionic removal | Stack heavy forms below `md`; remove `@ionic/react` + adaptive layer. | Bundle-size diff; phone checklist (`docs/phone-test-checklist.md`); native smoke | 🟠 Med |

## Rollback
- Phases 1/3 sit behind the existing `usesServerPagination`-style feature flag pattern
  (`lib/featureFlags`) so the old list can be restored per-screen.
- Phase 4 Ionic removal is a dependency change; revert by restoring the package + provider.

## Desktop/native impact
- Every phase affects desktop and both native WebViews identically (one codebase).
- Phase 4 reduces native bundle/paint cost; no native-specific regression expected since
  native already renders the web UI.

---

# Risks & tradeoffs

- **Breadth (Phase 3).** Nine screens share the bug patterns; the DataTable pays off only
  if all migrate. Budget for it or the codebase carries two table systems during transition.
- **shadcn + tokens.** shadcn theming maps to CSS variables — we reuse `tokens.css`, so dark
  mode and brand colours carry over. Low risk, but the variable mapping must be done in Phase 0.
- **URL-state filters** change the bookmark/share contract (filters now in the query string).
  Intended, but worth noting for any saved links.
- **Numeric range columns.** Confirm the persisted numeric columns for guests/total exist and
  are indexed for range queries before Phase 2 (avoid full scans on large datasets).

# Open questions / approvals needed

1. Approve the phased sequence, or do you want **Phase 1 (Bookings only)** delivered and
   reviewed before committing to Phase 3 breadth?
2. Confirm removing `@ionic/react` is acceptable (Phase 4) given native is a WebView wrapper.
3. Default density — Compact (more rows) vs Comfortable? Plan assumes **Compact default + toggle**.
4. Should saved-views be fully replaced by filter presets, or kept alongside?
