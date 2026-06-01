# Bika Banquet — Server-Side Pagination Plan (HYBRID) — Item B

Owner: phone-performance. Branch: `claude/serene-darwin-33jtn`.
Status: **PLANNING ONLY. No code changed. Nothing implemented. Needs human approval before any work.**

This doc expands ITEM B of `docs/phone-performance-plan.md` into an exhaustive, behavior-preserving migration plan for moving the BIG lists to server-side pagination, with search and sort moved server-side. The guiding constraint: **do not silently change existing SEARCH, SORT, or DROPDOWN/typeahead behavior.** Every place behavior could change is flagged as a question below.

The calendar (`client/src/app/dashboard/calendar/_lib/calendar-helpers.ts`) already range-fetches bookings/enquiries with `fromDate`/`toDate` at `limit:500` paging. **It is NOT part of this change and must stay untouched.** (Confirmed: `fetchBookings(start, end)` passes `fromDate`/`toDate`; `fetchEnquiries` similar.)

---

## 0. QUESTIONS FOR THE USER (read first — answer these before any implementation)

These are the decisions I am not certain about, and every place where user-visible behavior could change. Numbered for easy reply.

1. **Search latency on desktop.** Today, typing in the search box filters instantly (data is already in memory). After the change, every keystroke (debounced) hits the server and shows a brief spinner. This affects **desktop too**, not just phone. Is a ~250–400ms debounced server round-trip per search acceptable on desktop? (The whole point of Item B is to stop the 5000-row mega-fetch, so we cannot keep instant in-memory filtering for the big lists.)

2. **Debounce interval.** Bookings/customers/enquiries currently debounce the search box at **150ms** (`useDebounce(globalSearch, 150)`); the Combobox typeahead debounces at **250ms**. For server search I propose **300ms** to reduce request volume on slow phone networks. OK to change 150ms → ~300ms for these lists? (Slightly laggier feel, far fewer requests.)

3. **Finding MORE results than before.** Today the bookings list is fetched at `limit:5000` and the customers picker via `fetchAllCustomers` pages up to 100×500 = **50,000 cap**. Client search only searches what was loaded. With server search, a query will find matches **beyond** the old in-memory cap (e.g. a customer that was the 6,000th record). This is strictly *more* correct, but the result count for a given search may go *up* vs today. Is "search now finds records it previously missed" desired and not surprising? (I believe yes, but flagging because totals will change.)

4. **Default sort + tie-breakers must match exactly.** Current defaults: bookings `functionDate desc`, customers `name asc`, enquiries `functionName asc`, payments `booking asc`. The DB currently only does `orderBy: { functionDate: 'desc' }` (bookings/enquiries) / `createdAt: 'desc'` (customers) with **no secondary tie-breaker**, so rows with equal sort keys can come back in arbitrary order across pages. Do you want me to add a stable secondary tie-breaker (e.g. `id`) on every sortable column so ordering is deterministic across pages? (Strongly recommended — without it, paginated rows can shuffle/duplicate-look on the boundary.)

5. **Locale/collation difference (RISK).** Client sort uses `Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })` — locale-aware, accent-insensitive, numeric-aware. The DB (Postgres via Prisma `orderBy`) sorts by the column's collation, which is typically byte/ICU order and is **not guaranteed identical** to `Intl.Collator` for accented Indian names, mixed case, or "numeric strings" (e.g. "Hall 2" vs "Hall 10"). Sort order of *some* rows **will differ** from today. Is a small, documented difference in alphabetical ordering of accented/mixed-case names acceptable? (See §2 RISK-SORT for the exact cases.)

6. **Payments sort by computed columns (RISK).** The payments page sorts by `received` and `balance`, which are computed in JS via `resolvePaymentReceivedGross()` / `resolveDueAmount()` from `@bika/booking-core`. The DB has `paymentReceivedAmountValue` and `dueAmountValue` columns, but I have NOT verified they are always kept in sync with the JS resolver for every booking (legacy rows, partial payments, settlement discounts). If they can diverge, server-side sort by balance/received could order rows differently than the page does today. Do you want me to (a) treat the DB `*Value` columns as the source of truth and accept any divergence, or (b) keep payments client-side for now (it shares the bookings fetch)? See §1 verdict note.

7. **Infinite-scroll vs numbered pages.** Today every list uses **numbered pages** (`Pagination` component, page size 75/100). Keep numbered pages (lowest-change, preserves "page X of Y" and jump-to-page), or switch to infinite-scroll (nicer on phone but loses page numbers and "go to last page")? I recommend **keeping numbered pages** to minimize behavior change. Confirm?

8. **Total count display.** Pages currently show "Showing 1–100 of N" where N is the filtered in-memory length. With server pagination, N becomes the server's `pagination.total` (already returned). For an active search this total reflects ALL matches (see Q3), which may be larger than what desktop users "expect". OK?

9. **Customer typeahead in the booking form (RISK — biggest workflow risk).** The booking form's customer picker (primary / second / referred-by) currently runs `getCustomerSuggestions()` over the in-memory `customers` array loaded via `fetchAllCustomers` (up to 50k). Mid-booking, a user can find ANY customer. If we stop pre-loading all customers and switch to a server `?search=` endpoint, the user must **type at least N characters** before results appear, and an empty dropdown will no longer show "all customers alphabetically". Acceptable to require a **minimum of 2 characters** before the dropdown searches, and to no longer show the full alphabetical list when the box is empty? (This is the single most disruptive change to the create/edit-booking workflow.)

10. **Referred-by picker on the customers page** uses a `Combobox` over the same in-memory `referrerOptions` (all customers, sorted by name). Same question as #9: switch it to server `?search=` with min-2-chars? (The `Combobox` already supports an async `onSearch` with 250ms debounce, so this is low-effort, but it changes the "scroll through everyone" behavior.)

11. **Which lists to actually paginate now?** My verdict table (§1) marks bookings, customers, payments as PAGINATE and enquiries as PARTIAL (already 200-capped). Do you agree with leaving menu items / templates / ingredients / vendors / halls / item-types / users / banquets fully client-side? Any list you specifically want paginated or specifically want left alone?

12. **Rollout order + feature flag.** I propose doing **customers first** (simplest, server already supports search), behind a per-list feature flag so it can be reverted without touching bookings/payments. Agree with customers-first, and do you want a runtime flag (env/localStorage) or a compile-time constant?

13. **"Select-all / export-all" expectations.** Export/print today read from the in-memory arrays and are already capped (`bookings.slice(0,20)`, `customers.slice(0,40)`). After pagination the in-memory array is only the current page. Do those export buttons need to export ACROSS all pages (requiring a separate fetch), or is exporting the current page / current cap acceptable? (Need to confirm intended scope per button.)

14. **Offline / error during a page fetch.** Today, once loaded, paging is instant and never fails. After the change, paging/searching can fail on a flaky phone network. Is a toast + "retry"/keep-previous-page behavior acceptable (vs today's never-fails)?

---

## 1. List inventory & decision table

Row counts are estimates to be confirmed against the prod DB before implementation (flagged).

| List / page | Endpoint | Current client fetch | Typical rows / growth | Verdict | Justification |
|---|---|---|---|---|---|
| **Bookings** (`bookings/page.tsx`) | `GET /bookings` via `useBookingsListQuery` | `limit:5000`, then client filter/sort, client-paginate 75 (`BOOKINGS_PAGE_SIZE`) | Large, **grows forever** | **PAGINATE** + server search + server sort | Core growing table; 5000 cap will be hit; biggest payload on phone. |
| **Customers** (`customers/page.tsx`) | `GET /customers` via `useCustomersListQuery` → `fetchAllCustomers` (pages 500×up-to-100 = **50k cap**) | All pages loaded, client filter/sort, client-paginate 100 | Large, **grows** | **PAGINATE** + server search + server sort | Already pages internally to 50k; server already supports `search`. Lowest-risk to migrate first. |
| **Payments** (`payments/page.tsx`) | `GET /bookings` via `useBookingsListQuery` (same 5000 fetch as bookings) | Shares bookings fetch; client filter/sort, paginate 100 | Large, grows | **PAGINATE** *(with caveat)* | Same dataset as bookings. **RISK Q6**: sorts by computed `received`/`balance`. Either trust DB `*Value` cols or defer payments. |
| **Enquiries** (`enquiries/page.tsx`) | `GET /enquiries` via `useEnquiriesListQuery` | **Already `limit:200`**, server-side `status` filter; client filter/sort/paginate 75 | Medium-large, grows | **PARTIAL / PAGINATE** | Already capped at 200 + server status filter. Promote `search`/`sort`/`page` to server to remove the 200 cap; lower urgency than bookings. |
| Menu items (`menu/page.tsx`) | `GET /items` `limit:5000` | All loaded | Medium, grows slowly | LEAVE-AS-IS (client) *(add `?search=` endpoint only if item pickers lag)* | Used as in-form pickers; needs whole set in memory for menu builder. Not the perf hotspot. |
| Template menus (`menu/page.tsx`) | `GET /template-menus` `limit:5000` | All loaded | Small-medium | LEAVE-AS-IS | Used as pickers in booking/enquiry forms; small. |
| Ingredients (`menu/ingredients`, `menu/vendors`) | `GET /ingredients` `limit:5000` | All loaded | Small-medium | LEAVE-AS-IS | Admin-only; small; used in recipe pickers. |
| Vendors (`menu/vendors`) | `GET /vendors` `limit:5000` | All loaded | Small-medium | LEAVE-AS-IS | Admin-only; small. |
| Item-types (`menu/page.tsx`) | `GET /item-types` `limit:5000` | All loaded | Small, stable | LEAVE-AS-IS | Categories; tiny and stable. |
| Halls (`halls/page.tsx`, pickers) | `GET /halls` `limit:5000` | All loaded | Small, stable | LEAVE-AS-IS | Dozens at most; used as hall pickers everywhere. |
| Banquets (`halls/page.tsx`) | `GET /banquets` `limit:5000` | All loaded | Small, stable | LEAVE-AS-IS | A handful; used for scoping. |
| Users (`settings/page.tsx`) | `GET /users` `limit:5000` | All loaded | Small | LEAVE-AS-IS | Admin staff list; tiny. |

**Verdict summary:** PAGINATE → **Bookings, Customers, Payments (caveat Q6), Enquiries (promote)**. LEAVE-AS-IS → menu items, templates, ingredients, vendors, item-types, halls, banquets, users. Calendar → **untouched** (already range-bounded).

---

## 2. Per-list specs (lists marked PAGINATE)

### Shared backend reality (already verified)
- `server/src/controllers/booking.read.ts#getBookings`: supports `page`, `limit` (default 20, **max 200** via `parsePagination`), `status`, `search` (10-field OR), `fromDate`, `toDate`, banquet scoping. **`orderBy` is hard-coded `{ functionDate: 'desc' }` — NO sort param, NO tie-breaker.**
- `server/src/controllers/customer.controller.ts#getCustomers`: supports `page`, `limit` (default 20, **max 5000**), `search` (10-field OR). **`orderBy` hard-coded `{ createdAt: 'desc' }` — NO sort param.** Note: customers page default UI sort is `name asc`, which differs from the server's `createdAt desc` — see RISK.
- `server/src/controllers/enquiry.controller.ts#getEnquiries`: supports `page`, `limit` (default 20, **max 200**), `status`, `search` (4-field OR). **`orderBy` hard-coded `{ functionDate: 'desc' }` — NO sort param.**
- `server/src/utils/pagination.ts`: caps `limit` at `max(maxLimit, PAGINATION_MAX_LIMIT env || 5000)`. So `limit` can be raised by env, but per-endpoint default `maxLimit` is 200 (bookings/enquiries) / 5000 (customers).
- `server/src/utils/search.ts#sanitizeSearchTerm`: trims, **escapes `%` and `_`**, truncates to 200 chars. Returns `null` for empty. Search is `contains` (substring), `mode:'insensitive'` for text fields, plain `contains` for phone fields.

**MISSING on the backend for all three:** a `sort`/`order` query param and a stable secondary tie-breaker. Every PAGINATE list needs the controller extended to accept `sort=<field>&order=asc|desc` mapped to a whitelisted Prisma `orderBy`, always appending `, { id: 'asc' }` (or similar) as a deterministic tie-breaker. This is the main backend work.

---

### 2A. Customers (migrate FIRST)

**Fetch change.** Replace `useCustomersListQuery`→`fetchAllCustomers` (loads all pages) with a query keyed on `{ page, limit, search, sort, order }`. `limit` = `CUSTOMERS_PAGE_SIZE` (100, keep). Drive `page` from `currentPage`, `search` from `debouncedGlobalSearch`, `sort`/`order` from `sort` state. Use TanStack `placeholderData: keepPreviousData` so the table doesn't blank between pages. Numbered pages retained (Q7).

**Search → server.** Param `?search=`. Debounced (Q2, propose 300ms). Server searches: `name` (insensitive), `phone`, `phoneE164`, `alterPhone`, `alternatePhone`, `alternatePhoneE164`, `whatsapp`, `whatsappNumber`, `whatsappE164`, `email` (insensitive). 
- Today's client search (`filterAndSortRows` over `tableColumns`) searches: name+countryCode+phone, phone+email, city+state, counts, createdAt — i.e. ALSO **city/state** and the stats counts. **MISMATCH:** server OR does NOT include `city`/`state`. To be a strict superset, add `{ city: { contains, insensitive } }` and `{ state: { contains, insensitive } }` to the server OR. **Flag Q3 / behavior-change:** without that, server search would find FEWER results for a city/state query than today → must add those fields. (Counts/createdAt are not meaningfully searched today and can be dropped.)
- Column search (`columnSearch`) currently allows per-column substring (contact, location, stats). Per-column server search would need per-field params; simplest is to fold the active column query into the same `?search=` OR (slightly broader) OR send `searchField`. **Flag as behavior change** if column-scoped search must remain strictly column-scoped.

**Sort → server.** Sortable columns today: `name`, `contact`, `location`, `stats`, `createdAt`. Map to DB:
- `name` → `orderBy: { name }` (+ `{ id }` tiebreak).
- `createdAt` → `orderBy: { createdAt }` (matches server's current default).
- `contact` (accessor = countryCode+phone+email) and `location` (city+state) and `stats` (counts) are **composite/computed** accessors with no single DB column. **RISK-SORT:** these cannot map 1:1 to a DB `orderBy`. Options: (a) map `contact`→`phone`, `location`→`city` then `state`, `stats`→`_count` (Prisma supports `orderBy: { bookings: { _count } }` for relations) — approximate, NOT identical to the concatenated-string sort; (b) disable server sort on these composite columns (keep only name/createdAt sortable) and flag. **Question implied by Q5.**
- Default UI sort `name asc`; server default is `createdAt desc`. The query must send `sort=name&order=asc` explicitly so the default matches today.
- **RISK-SORT (collation):** `name asc` via Postgres collation ≠ `Intl.Collator` for accented Indian names / mixed case → some rows reorder (Q5).

**Typeahead / referred-by picker (`referrerOptions`, Combobox).** Switch from in-memory `[...customers].sort(name)` to `Combobox onSearch={(q) => api.getCustomers({search:q, limit:50})}` with **min-2-chars** (Q10). Empty box no longer lists everyone alphabetically.

**Backend changes:** add `sort`/`order` param + `id` tiebreak; add `city`/`state` to search OR. `limit` max already 5000 (fine for 100).

---

### 2B. Bookings (migrate SECOND)

**Fetch change.** `useBookingsListQuery` currently `BOOKINGS_LIST_PARAMS = {page:1, limit:5000}`. Re-key on `{ page, limit, search, sort, order, status?, fromDate?, toDate? }`. `limit` = `BOOKINGS_PAGE_SIZE` (75, keep). **BLOCKER:** server `getBookings` caps `limit` at **200** (`parsePagination(...,20,200)`). 75 is fine, but the current 5000 fetch only works because `PAGINATION_MAX_LIMIT` env raises the cap — confirm the env value in prod, or the migration to small pages is independent of it. Numbered pages retained.
- `useAddPaymentMutation` and other code optimistically update `queryKeys.bookings.list(BOOKINGS_LIST_PARAMS)` — the key MUST change to the new paginated key or optimistic updates silently stop applying. **Flag: update `hooks.ts` optimistic cache writes to the new key shape.**

**Search → server.** Param `?search=`. Server OR already covers functionName, functionType, customer.name (insensitive) + 8 phone variants. 
- Today's client `tableColumns` search covers: functionName+functionType, customer name+phone+email, functionDate, status. **MISMATCH:** server OR does NOT search `customer.email` or `status` text or `functionDate`. To be a strict superset, add `{ customer: { email: { contains, insensitive } } }`. `status`/`functionDate` are normally filtered, not free-text searched — confirm whether typing a status word in the global box should match (today it does via the status column accessor). **Flag Q3.**

**Sort → server.** Sortable columns today: `functionName` (accessor functionName+functionType), `customer` (name+phone+email composite), `functionDate`, `expectedGuests`, `status`, `grandTotal`. Map:
- `functionDate` → `{ functionDate }` (matches current server default; default UI sort is `functionDate desc` ✓).
- `expectedGuests` → `{ expectedGuests }`; `grandTotal` → `{ grandTotal }`; `status` → `{ status }`.
- `functionName` accessor is `functionName + functionType` (composite) — map to `{ functionName }` then `{ functionType }`, approximate.
- `customer` composite (name+phone+email) → `{ customer: { name } }`, approximate. **RISK-SORT.**
- Always append `{ id }` tiebreak. **RISK-SORT (collation)** on text columns (Q5). **RISK:** `grandTotal` numeric in DB vs `toComparable` numeric in JS should match; verify `grandTotal` is a real numeric column (not a stringified money field) — `toComparable` strips commas and parses, DB compares numerically; if `grandTotal` is stored as Decimal/number these agree.

**Customer typeahead in booking form (PRIMARY RISK — Q9).** Today `getCustomerSuggestions(field)` filters in-memory `customers` (loaded via `loadCustomerOptions`→`fetchAllCustomers`) on name + phone (digit-aware), scores (startsWith/includes), sorts by score then name, slices to 80, and always prepends the currently-selected customer. To move server-side:
- New endpoint usage: `api.getCustomers({ search: q, limit: 80 })`, min-2-chars, 300ms debounce.
- **Must preserve:** (a) the digit-normalized phone match (`query.replace(/\D/g,'')`) — the server already does `phone contains` but does NOT strip non-digits from the query; a user typing "98765 43210" with a space would fail server-side. **Flag:** either strip non-digits client-side before sending, or add server-side normalization. (b) The selected-customer-prepend so the chosen customer still shows when editing a booking whose customer is beyond the first 80 — fetch the selected customer by id separately and prepend. (c) Empty-query behavior: today empty shows ALL sorted by name; server min-2-chars shows nothing until typing (Q9).
- This is wired through the existing `Combobox onSearch` plumbing (async, 250ms) so the mechanism exists.

**Backend changes:** add `sort`/`order` + `id` tiebreak; add `customer.email` to search OR; confirm/normalize phone-digit search; confirm `limit` cap handling.

---

### 2C. Payments (migrate with bookings, or DEFER — Q6)

**Fetch change.** Payments uses the SAME `useBookingsListQuery` fetch. If bookings becomes paginated, payments automatically gets only the current page unless given its own query. Payments needs its own paginated query keyed on its own `{page, search, sort, order}` (page size 100).

**Search → server.** Accessor = functionName + customer.name + customer.phone. Maps cleanly to the existing bookings search OR (already covers those). No email/status needed here. Lower mismatch risk than the bookings list.

**Sort → server (RISK-SORT, Q6).** Sortable: `booking` (composite name+customer), `eventDate`→`functionDate`, `total`→`grandTotal`, `received`→`resolvePaymentReceivedGross()`, `balance`→`resolveDueAmount()`, `entries`→`_count.payments`.
- `received`/`balance` are **JS-computed**. DB has `paymentReceivedAmountValue` / `dueAmountValue`. Server sort must use those columns. **RISK:** if the JS resolver and the DB `*Value` columns ever diverge (settlement discounts, legacy rows), the sorted order differs from what the page shows. **This is Q6.** Recommendation: if not confident the columns are authoritative, **DEFER payments** (keep it client-side on its own smaller fetch, e.g. only `status in [confirmed,pending]` + `dueAmountValue>0` outstanding set, which is far smaller than all bookings) until verified.
- `entries` → `orderBy: { payments: { _count } }`.
- Default UI sort `booking asc` → `orderBy: { functionName: 'asc' }` + tiebreak.

**Backend:** reuse bookings `sort`/`order`; ensure `paymentReceivedAmountValue`/`dueAmountValue`/`_count` are sortable; consider a dedicated `?outstanding=true` filter to shrink the payments dataset.

---

### 2D. Enquiries (promote — lower urgency)

Already `limit:200` + server `status`. Promote `search`, `sort`, `order`, `page` to server (remove the 200 client cap; keep page size 75). Server search OR currently: functionName, functionType, customer.name, customer.phone. Client `tableColumns` likely searches more (confirm against the page's columns) — add any missing fields to be a superset. Sortable default `functionName asc` → `{ functionName }` + tiebreak. Same collation RISK-SORT.

---

## 3. Workflow-impact analysis

| Workflow | Preserved? | Where the user notices |
|---|---|---|
| **Browse bookings list (scroll pages)** | Behavior preserved (numbered pages kept) | Page change now triggers a network fetch + brief spinner instead of instant slice. (FLAG: latency, Q1.) |
| **Search bookings (global box)** | Result *set* preserved IF server OR is made a superset (add customer.email); otherwise FEWER results | Debounced spinner per keystroke; may find MORE matches beyond old 5000 cap (Q3). Status/date free-text in global box may stop matching (FLAG). |
| **Sort bookings by date/amount/name** | Date/amount/guests preserved; name/customer composite + collation may reorder some rows | Accented/mixed-case name ordering can differ (RISK-SORT, Q5). Equal-key rows now deterministic IF tiebreak added (Q4). |
| **Filter bookings by status / date range** | Preserved (server already supports status/fromDate/toDate) | Becomes a server param; combined with search+sort+page in one query. Must verify all combine correctly (edge cases §4). |
| **Create booking → pick customer (typeahead)** | **CHANGES** (Q9) | Must type ≥2 chars; empty box no longer lists everyone; phone-with-spaces needs digit-normalization; selected customer prepended via id fetch. **Biggest workflow change.** |
| **Edit booking whose customer is record #6000** | Preserved only if selected-customer-by-id prepend implemented | Otherwise the customer field could render blank. (FLAG.) |
| **Customers list browse/search/sort** | Preserved if city/state added to server OR + name/createdAt sort mapped | Latency; composite contact/location/stats sort may be disabled or approximate (RISK-SORT). |
| **Referred-by picker (customers + booking form)** | **CHANGES** (Q9/Q10) | Min-2-chars; no full alphabetical browse. |
| **Payments reconciliation (sort by balance/received)** | **AT RISK** (Q6) | Order may differ if DB `*Value` cols diverge from JS resolver. May be deferred. |
| **Export / print list** | Preserved only if export reads from a full fetch, not the current page | Today capped slices read in-memory; after pagination only current page is in memory (FLAG Q13). |
| **Real-time SSE update inserts/removes a row** | Preserved via query invalidation | Invalidation now refetches the current page from server (not the whole 5000). Must invalidate the new paginated keys. |
| **Calendar (day/week/month)** | **Untouched** | No change — already range-bounded. |
| **Menu builder / halls / users / vendors** | Untouched | Still fully client-side. |

---

## 4. Edge cases to test (exhaustive)

1. Empty results (search matches nothing) → empty state, total 0, no crash, page resets to 1.
2. Single result → one row, pagination hidden/disabled.
3. Exact page boundary: exactly 75 / 100 rows (one full page, no page 2), 76 / 101 (page 2 has 1 row), 150 / 200.
4. `limit` cap: server caps at 200 (bookings/enquiries) — never request more.
5. Search special chars: `%`, `_` (escaped by `sanitizeSearchTerm`), `'` (D'Souza), `.` (S.K.), `-`, spaces, leading/trailing spaces, >200 chars (truncated).
6. Case-insensitivity parity: "SHARMA" vs "sharma" return same set as today.
7. Accented / Devanagari / Bengali names: search match AND sort order vs `Intl.Collator` (RISK-SORT).
8. Phone search: with spaces "98765 43210", with country code "+91...", digits-only, partial. Verify digit-normalization (booking-form typeahead).
9. Very fast typing → debounce fires once; latest-wins (TanStack handles via query key, but verify no stale page shows committed).
10. Slow network out-of-order responses (page 2 resolves after page 3) → only latest committed (keepPreviousData + query key correctness).
11. Pagination + active filter combined (status=confirmed + page 3): correct slice, correct total.
12. Sort + search combined: search then change sort → page resets to 1, correct order.
13. Sort stability / ties: many rows with identical `functionDate` → deterministic order across pages (requires tiebreak, Q4); no row appears on two pages, none missing.
14. Delete a row while on page 3 → invalidate → refetch; page count may shrink; current page clamps.
15. Add a row (or SSE insert) while paginated → appears per current sort; totals update.
16. Back-navigation preserving scroll/page → does returning to the list restore page N and scroll? (TanStack cache + gcTime; verify.)
17. Offline / error during a page or search fetch → toast + keep previous page, retry (Q14).
18. A record beyond the old 5000 cap: search for the 6,000th booking/customer → **now found** (proves the fix; Q3).
19. Dropdown picking a customer not on the first page of suggestions: type narrow query → appears; edit booking whose customer is far down → prepended via id fetch.
20. `columnSearch` per-column vs global search parity (if column search retained server-side).
21. Banquet-scoped user: paginated counts/totals respect `banquetIds` scope (server already applies it to `where`, but verify `total` count uses the scoped `where`).
22. Default sort matches today exactly on first load (bookings functionDate desc, customers name asc, enquiries functionName asc, payments booking asc).

---

## 5. Test plan (test-first)

Existing infra: `client/vitest.config.ts` (env `node`, include `src/lib/__tests__/**` + `src/lib/booking-form/__tests__/**`). Playwright in `client/e2e/` (`booking-form`, `capacitor-mobile`).

### Pure-logic unit tests (vitest, runnable in current CI — place under `src/lib/__tests__/`)
- **Query-key builder**: a new `buildListParams({page,limit,search,sort,order,status,fromDate,toDate})` helper → asserts param shape, omits empties, clamps limit ≤200. (EC 4, 11, 12)
- **Search-param normalization**: digit-strip for phone queries, trim, map UI sort key → server `sort`/`order`, default-sort mapping per list. (EC 5, 8, 22)
- **Sort-key → Prisma orderBy whitelist mapper** (a pure function shared conceptually with server): name→name+id, functionDate→functionDate+id, composite→approx/disabled. Asserts tiebreak always appended. (EC 13)
- **Latest-wins / page-commit reducer** (if a manual guard is added beyond TanStack): out-of-order responses commit only latest. (EC 9, 10)
- **Server-side (server vitest/jest, runnable in server CI, not in client CI here)**: `getBookings`/`getCustomers`/`getEnquiries` where-builder for search OR fields (incl. newly added city/state, customer.email), `orderBy` mapping + tiebreak, pagination math (`skip`, `totalPages`), zero/all/boundary pages, `sanitizeSearchTerm` escaping. (EC 1–7, 13, 21)

### Browser / live-backend tests (Playwright — **cannot be verified in this environment**; need a device/live API)
- e2e bookings: search debounced → one request; results render; clear → reset. (EC 1, 6, 9)
- e2e pagination: next/prev/jump page fetches correct slice; boundary counts. (EC 2, 3, 11)
- e2e sort: toggle each sortable header → correct order + page reset; ties deterministic. (EC 12, 13)
- e2e booking-form customer typeahead: type ≥2 chars → server results; pick customer not on first page; edit booking with far-down customer → field populated. (EC 18, 19)
- e2e offline: throttle/kill network mid-fetch → toast + previous page retained. (EC 17)
- e2e "beyond 5000": seed a record past the old cap → search finds it. (EC 18)

**Honesty note:** Only the pure-logic vitest units run in the current client CI (node env). All React-component, hook, Playwright e2e, and server DB-integration tests require jsdom/testing-library setup, a live backend, or a device and **cannot be executed in this environment** — they would be authored but reported as "not executed here".

---

## 6. Rollout & rollback

**Incremental order (one list at a time, each independently revertible):**
1. **Customers first** — server already supports `search`; only needs `sort`/`order`+tiebreak+city/state. Lowest risk. Migrate list, then the referred-by picker.
2. **Bookings** — list, then optimistic-cache keys in `hooks.ts`, then the booking-form customer typeahead (the risky part) last.
3. **Payments** — only after Q6 resolved; else keep client-side on a shrunken (outstanding-only) fetch.
4. **Enquiries** — promote search/sort/page server-side (remove 200 cap).

**Feature-flag / safety:** gate each list behind a per-list flag (compile-time `const USE_SERVER_PAGINATION_CUSTOMERS = true` or runtime env/localStorage per Q12). When OFF, the list keeps the current `limit:5000`/`fetchAllCustomers` + `filterAndSortRows` path verbatim. This lets any single list be reverted without touching the others, and keeps a fast rollback if search/sort parity is wrong in the field.

**Keep desktop behaviorally unaffected beyond the documented search/sort pause:** the client is one codebase for desktop + phone (per Item A), so the *only* desktop behavior change is the documented search/sort latency + min-chars typeahead (Q1, Q2, Q9). Numbered pages, page sizes, default sorts, and result sets are preserved (modulo the flagged RISK-SORT collation and the Q3 "finds more" superset). No desktop-only screen changes.

**Rollback path:** flip the per-list flag OFF (instant, no deploy if runtime flag); server changes (`sort`/`order` param, extra search fields, tiebreak) are additive and backward-compatible, so they can stay deployed even when the client flag is OFF.

---

## 7. Cannot-verify-here disclosure

- Exact prod row counts per list (estimates only) — confirm before sizing.
- Whether `PAGINATION_MAX_LIMIT` env is set in prod (affects current 5000 fetch and the 200 cap).
- Whether `paymentReceivedAmountValue` / `dueAmountValue` DB columns are always consistent with the JS `@bika/booking-core` resolvers (Q6 RISK).
- Postgres collation vs `Intl.Collator` exact divergence on the real name data (Q5 RISK).
- All Playwright e2e, React-hook, and server-DB integration tests require a browser/device/live backend and were not executed here.
