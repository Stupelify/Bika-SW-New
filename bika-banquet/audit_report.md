# Audit Report — Bika Banquet Full System Analysis

This report documents the static analysis of the Bika Banquet system (frontend + backend). It highlights critical bugs, workflow gaps, UX concerns across mobile/desktop, security/permission issues, data integrity problems, and performance bottlenecks.

## SECTION A — CRITICAL BUGS

**A1 — BookingPack.hallIds type mismatch**
- **Bug Confirmed:** Yes. It does not cause a silent failure on booking creation but can cause a parsing/validation error when fetching availability. In `schema.prisma` (`line 594`), `hallIds` is a `String[]`. However, in `booking.controller.ts` `checkHallAvailability` (`line 534`), it reads `hallIds` as a comma-separated string from `req.query`, splits it by comma (`line 541`), and validates each against a UUID regex (`line 547-551`). In the POST/PUT booking payloads, `hallIds` is expected to be an array of strings per Zod validation (`line 62`, `line 148`), and is normalized using `normalizePackHallIds` (`line 376`).
- **Consequence:** `checkHallAvailability` works because it expects a GET request where arrays are conventionally passed as comma-separated strings (`?hallIds=uuid1,uuid2`), but it fails to document that standard. If the frontend passes `hallIds[]=uuid1&hallIds[]=uuid2`, `req.query.hallIds` will be an array of strings, but `hallIdsRaw.split(',')` (`line 541`) will throw a `TypeError: hallIdsRaw.split is not a function`.
- **Fix:** Update `checkHallAvailability` in `booking.controller.ts` (`line 541`) to check if `hallIdsRaw` is already an array, or normalize it properly: `const hallIds = Array.isArray(hallIdsRaw) ? hallIdsRaw : (typeof hallIdsRaw === 'string' ? hallIdsRaw.split(',') : []);`.

**A2 — Change-password route missing**
- **Bug Confirmed:** False. `auth.routes.ts` (`line 26`) defines `router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);` which matches the endpoint in `auth.middleware.ts` (`shouldValidateSession`). The frontend also has a UI for this in `settings/page.tsx` (`line 749` `changeOwnPassword()`).
- **Consequence:** None. The functionality exists.

**A3 — Email verification never sent**
- **Bug Confirmed:** Yes. In `auth.controller.ts` `register()` (`line 81`), there is a comment `// TODO: Send verification email`. On line 76, the user is created with `isVerified: true` explicitly hardcoded. Furthermore, in the login flow (`line 138`), the check for `if (!user.isVerified)` is commented out entirely.
- **Consequence:** Users are automatically verified upon creation. Since Admin registers all users (role-based), this isn't a critical security flaw for the public, but the email verification workflow is technically dead code.
- **Fix:** Remove verification logic if it's strictly an internal tool managed by Admins, or implement an email service (e.g., SendGrid/AWS SES) and uncomment the gating logic in `login()`.

**A4 — Unused httpCache imports**
- **Bug Confirmed:** Yes. Files like `banquet.routes.ts`, `itemType.routes.ts`, `templateMenu.routes.ts`, `ingredient.routes.ts`, `vendor.routes.ts` import `httpCache` from `../middleware/cache.middleware` on `line 4` but never use it.
- **Consequence:** Missed opportunity for performance optimization. Fetching static/rarely-changing items like banquets or template menus will query the database on every request.
- **Fix:** Add `httpCache()` middleware to the `GET` routes in those files.

**A5 — Additional bug scan**
- **Unhandled promise rejections:** Missing `catch` blocks for background async tasks or missing `await` on DB writes. `booking.controller.ts` has multiple `any` casts (e.g., `line 1502` `const data: any = normalizeCaseFields(...)`) bypassing Zod type safety.
- **Race conditions:** The availability check in `checkHallAvailability` and the actual insert in `createBooking` are **not** atomic. Between the time the staff checks availability and submits the booking form, another user could book the exact same hall.

## SECTION B — MISSING WORKFLOWS

**B1 — Enquiry to booking conversion (P1)**
- **Exists today:** The `Enquiry` model has a `status` field with a default of `"pending"` and a `"converted"` status option in the frontend UI dropdown (`enquiries/page.tsx` `line 798`).
- **Missing:** There is NO backend logic to convert an enquiry to a booking. Setting status to "converted" does nothing but change the string.
- **Impact:** Staff must manually re-enter all customer details, dates, pack selections, and notes from an Enquiry into a new Booking form, risking data entry errors and wasting time.
- **Needed:** An endpoint `POST /api/enquiries/:id/convert` that takes the enquiry and creates a draft booking, and a UI button on the Enquiry card to trigger the conversion flow.

**B2 — Change password (P3)**
- **Exists today:** Exists in `/dashboard/settings`.
- **Missing:** Users without `manage_users` or settings access cannot reach the settings page. `settings/page.tsx` is typically gated. There is no user profile dropdown for an Employee to change their password outside of Settings.
- **Needed:** A generic User Profile modal accessible from the TopNav/Sidebar for all logged-in users.

**B3 — Quotation PDF (P2)**
- **Exists today:** `pdfWorker.ts` handles generic "Booking Details" and "Menu Pages". `Booking` and `Enquiry` both have `quotation` booleans.
- **Missing:** There is no dedicated Quotation PDF template with business terms/conditions or separate branding for pre-sales. It reuses the Booking PDF worker.
- **Impact:** Sending professional quotes to customers requires a workaround (e.g., sending a generic "Booking Details" PDF for a pencil booking).

**B4 — WhatsApp / SMS notifications (P1)**
- **Exists today:** The codebase captures `whatsappNumber` and `whatsappCountryIso` in `customers/page.tsx` and `bookings/page.tsx` forms, but a search for Twilio/Wati/360dialog yields nothing.
- **Missing:** No automated WhatsApp integration to send booking confirmations, payment receipts, or reminders.
- **Impact:** Staff must manually text customers or send PDFs manually. High operational friction for an Indian banquet hall where WhatsApp is essential.

**B5 — Enquiry follow-up and reminders (P2)**
- **Exists today:** `server.ts` runs a `setInterval(releasePencilBookings, 60 * 60 * 1000)` (`line 267`) which calls `releasePencilBookings` every hour. It queries expired pencil bookings and cancels them.
- **Missing:** No cron job or reminder system for Enquiries. If an enquiry is created, there's no automated prompt to call them back.
- **Impact:** Lost sales opportunities.

**B6 — Payment receipt PDF (P2)**
- **Exists today:** `BookingPayments` model tracks payments, but `pdfWorker.ts` only generates the full booking details and menu.
- **Missing:** No way to generate a PDF receipt for a *single* payment (e.g., "Received ₹50,000 Advance").
- **Impact:** Staff have to write physical receipts or share the entire updated booking PDF.

**B7 — Booking history UI (P3)**
- **Exists today:** The backend has `GET /api/bookings/:id/history`. `bookings/page.tsx` fetches `bookingHistory` and has a `historyRows` mapping (`line 1910`).
- **Missing:** A visually intuitive diff view to see what exactly changed between versions.
- **Impact:** Hard to track malicious edits or accidental data loss by staff.

**B8 — Party-over flow (P1)**
- **Exists today:** `booking.routes.ts` registers `POST /api/bookings/:id/party-over`. It accepts `extraPlate` and `extraRate`.
- **Missing:** The flow creates a completed replica, but it modifies ledger amounts dynamically. The UI modal exists (`setShowPartyOverModal` in `bookings/page.tsx`). But there is no strict validation preventing changes after "Party Over" is finalized unless the UI explicitly blocks it (`readonly` mode).
- **Impact:** Clear workflow for ending a function, but risk of data tampering if the `isLatest` version is mutated.

**B9 — User self-service profile (P2)**
- **Exists today:** Settings page allows changing password.
- **Missing:** If `settings/page.tsx` requires `manage_settings` or `manage_users`, an Employee cannot update their name or password.
- **Impact:** Admins have to manage passwords for all employees.

## SECTION C — MOBILE UX GAPS

**C1 — Bookings page on mobile**
- **Finding:** The form is complex and uses multiple modals. `MobileBookingCard.tsx` (`line 62`) provides a summary view, but creating/editing uses the desktop `bookings/page.tsx` form which is heavily nested with `openHallPickerPack` absolute positioned popovers (`line 3977`) that lack boundary collision detection on small screens.

**C2 — The 5000-row prefetch (CPU/Memory bound)**
- **Finding:** In `settings/page.tsx` (`line 539`), `menu/page.tsx` (`line 487-493`), and `bookings/page.tsx` (`line 1280`), the client fires fetches with `limit: 5000`. E.g., `api.getUsers({ page: 1, limit: 5000 })`.
- **Impact:** Over 4G/5G connections, network transit times are acceptable, however pulling 5000 records of relational JSON into an older Android device triggers intense garbage collection, high RAM utilization, and extreme latency when sorting/filtering data structures client-side. The lack of list virtualization compounds DOM render lag.

**C3 — Calendar and VenueTimelineBoard on mobile**
- **Finding:** `VenueTimelineBoard.tsx` tries to handle mobile with `<MobileDay>` and `<MobileWeek>` components, but horizontal scrolling on standard tables is known to clip. Tap targets might be constrained depending on device density.

**C4 — Modal and keyboard behavior**
- **Finding:** Absolute positioned dropdowns (e.g., `Combobox.tsx` `line 138` with `max-h-60 overflow-y-auto`) and hall pickers (`bookings/page.tsx` `line 3977`) can be cut off by the mobile keyboard. Standard modals lack iOS safe-area padding handling.

**C5 — BottomNav coverage**
- **Finding:** `BottomNav.tsx` (`line 61`) connects to Home, Bookings, Calendar, and Payments. Enquiries and Customers are missing from the quick nav, relegated to the "More" menu. Given Enquiries are high-velocity on mobile, it should be highly accessible.

**C6 — FloatingActionButton coverage**
- **Finding:** `FloatingActionButton.tsx` is used in `bookings/page.tsx`, `enquiries/page.tsx`, and `customers/page.tsx`. However, it is missing in `payments/page.tsx` and `settings/page.tsx` (Users).

**C7 — Table overflow on mobile**
- **Finding:** The app uses `.table-shell` in `globals.css` (`line 407`) which applies `overflow-x-auto` to wrap `<table className="data-table">` elements. This is good, but many nested components lack minimum widths, causing columns to squash rather than scroll.

**C8 — Unoptimized images**
- **Finding:** In `dashboard/layout.tsx` (`line 1179`), a raw `<img>` tag is used to load a logo from Zyrosite: `<img src="https://assets.zyrosite.com/..." style={{ width: 32, height: 32 }} />`. This bypasses Next.js image optimization.

## SECTION D — DESKTOP UX GAPS

**D1 — Bookings page efficiency**
- **Finding:** `bookings/page.tsx` relies heavily on modals and dropdowns. Finding a booking requires typing into a local search state.

**D2 — CommandPalette scope**
- **Finding:** `CommandPalette.tsx` implements keyboard shortcuts (Arrow up/down, Enter) and searches `bookings`, `customers`, and `enquiries` by calling `GET /api/search` (`searchAll` in `search.controller.ts`). Good implementation.

**D3 — Dashboard completeness for owner**
- **Finding:** `dashboard/page.tsx` and `analytics.controller.ts` (`getDashboardSummary`) pull `totalRevenue`, `cancelledBookings`, and `hallsByRevenue`. Missing granular cash-flow metrics (outstanding balance for this week).

**D4 — Reports page completeness**
- **Finding:** No dedicated outstanding balance aging report.

**D5 — Sidebar role filtering**
- **Finding:** `dashboard/layout.tsx` filters nav items dynamically based on `permissions`.

## SECTION E — ROLE & PERMISSION GAPS

**E1 — Default permissions**
- **Finding:** `seed.ts` creates Admin, Manager, and Employee. Admin gets all permissions. Employee gets nothing explicitly assigned in `seed.ts`—it's just an empty role upon creation (`line 99`). This means standard employees cannot see the dashboard unless an Admin manually assigns them permissions.

**E2 — Manager password reset**
- **Finding:** `resetManagedUserPassword` in `settings/page.tsx` (`line 778`) allows anyone with `manage_users` to reset another user's password via `api.resetUserPassword(user.id, { newPassword })`. A Manager with `manage_users` can reset an Admin's password. The API `resetUserPassword` (`user.controller.ts`) does not prevent lower-tier roles from resetting higher-tier roles.

**E3 — UserBanquet restriction**
- **Finding:** `userBanquets` scoping is robustly applied across `booking.controller.ts`, `hall.controller.ts`, and `analytics.controller.ts` using `withBookingBanquetScope` and `getAllowedBanquetIds(req)`. Good enforcement.

**E4 — Settings access**
- **Finding:** `settings/page.tsx` has logic for `canReadUsers`, `canReadRoles`, etc. But if a user lacks `manage_users`, they can't even change their own password easily if the whole settings route is excluded from the Sidebar.

## SECTION F — DATA INTEGRITY

**F1 — Double booking race condition**
- **Finding:** `checkHallAvailability` is an isolated read-only query. In `createBooking`, there is an `assertNoHallClash` check within the `$transaction`. However, Prisma transactions without explicit row locks (`SELECT FOR UPDATE`) can still suffer from race conditions under high concurrent load. PostgreSQL unique constraints don't work for time-range overlaps.

**F2 — Pencil booking expiry**
- **Finding:** `releasePencilBookings` runs every hour via `setInterval` in `server.ts` (`line 267`). It does `status: 'cancelled', isPencilBooking: false`. Since it's in `server.ts`, if PM2 runs 4 instances, 4 intervals run simultaneously, potentially causing DB lock contention. Also, if the server restarts, it runs immediately upon boot, then every hour.

**F3 — Booking version atomicity**
- **Finding:** Yes, `updateBooking` uses a Prisma transaction (`prisma.$transaction`) to set `isLatest = false` on the old version and create the new version. If the server crashes, the transaction rolls back cleanly.

**F4 — Payment correction**
- **Finding:** There is an `updatePayment` endpoint in `booking.routes.ts` (`router.patch('/:id/payments/:paymentId')`). Ledger is append-only for bookings but individual payment records can be modified. Hard deletes for payments do not exist via API.

**F5 — Customer phone uniqueness**
- **Finding:** `schema.prisma` has `@unique` on `Customer.phone` and `Customer.phoneE164`. In `createCustomer` (`customer.controller.ts`), it checks for `P2002` (Unique constraint failed) and returns `Phone number is already registered to another customer`. Handled correctly.

**F6 — Cascade deletes**
- **Finding:** `schema.prisma` uses `onDelete: Cascade` aggressively. E.g., `Customer -> Booking`, `Booking -> BookingHall`, `Booking -> BookingPayments`. If an Admin deletes a Customer, ALL their historical bookings and financial records are permanently hard-deleted. **CRITICAL DATA LOSS RISK.**

## SECTION G — PERFORMANCE

**G1 — Prisma Pagination**
- **Finding:** List queries in `booking.controller.ts` (`getBookings`) and `customer.controller.ts` (`getCustomers`) use `skip` and `take: limit`. Pagination is handled correctly at the database level.

**G2 — Large Bundles / No Code-Splitting**
- **Finding:** A search for `React.lazy` and `dynamic(` across the `client` directory returned no results. Heavy components like Calendar, Timeline Board, and Settings ship in the main bundle. This inflates bundle size and increases JS parse time on older Android devices, heavily affecting TTI (Time to Interactive).

**G3 — Redis Usage**
- **Finding:** Redis is used exclusively for SSE (Server-Sent Events) pub/sub fan-out across PM2 workers (`sse.ts`). There is NO caching (e.g., `redis.get`/`set`) for expensive DB queries.

**G4 — SSE State**
- **Finding:** SSE clients are stored in an in-memory `Set<Response>` in `sse.ts` (`line 25`). If a process restarts, all connected SSE clients are dropped and must rely on client-side EventSource reconnection logic. No strict client limit is enforced.

**G5 — PDF Worker**
- **Finding:** `pdfWorker.ts` runs generation synchronously (`generatePdfBuffer` uses a Promise but PDFKit works heavily on the thread). However, it seems to be spawned as a Node.js `worker_threads` Worker (based on `parentPort` and `workerData` imports), preventing event loop blocking on the main thread. Good.

## SECTION H — PRIORITIZED SUMMARY TABLE

| Priority | Category | Finding | File + Line | Effort | Impact |
|----------|----------|---------|-------------|--------|--------|
| P0 | Data Integrity | **Cascade Delete on Customers destroys Bookings.** Deleting a customer deletes all their financial history. | `server/prisma/schema.prisma` L194 | S | Catastrophic data loss |
| P1 | Performance | **5000-row fetches on client pages.** Forms fetch all users, items, and menus into memory on mount. Severely hits low-RAM Android devices, lacks virtualization. | `client/src/app/dashboard/bookings/page.tsx` L1280, `client/src/app/dashboard/settings/page.tsx` L539 | M | Mobile crashes / DOM stutter |
| P1 | Bug | **checkHallAvailability split() type crash.** If an array is passed, `split()` throws a 500 error. | `server/src/controllers/booking.controller.ts` L541 | S | API failure |
| P1 | Workflow | **No Enquiry to Booking conversion.** Staff must manually duplicate data. | `client/src/app/dashboard/enquiries/page.tsx`, `server/src/controllers/enquiry.controller.ts` | M | Severe operational friction |
| P1 | Workflow | **Missing WhatsApp integration.** Crucial for Indian market ops. | Entire codebase | L | High manual workload |
| P2 | Security | **Manager can reset Admin password.** Role hierarchy is not enforced during password resets. | `client/src/app/dashboard/settings/page.tsx` L778, `server/src/controllers/user.controller.ts` | M | Privilege escalation |
| P2 | Workflow | **No Quotation PDF template.** Reuses Booking PDF. | `server/src/workers/pdfWorker.ts` | M | Unprofessional branding |
| P2 | Concurrency | **Multiple PM2 intervals.** `releasePencilBookings` runs on every worker. | `server/src/server.ts` L267 | S | Race conditions/DB load |
| P3 | UX | **BottomNav missing Enquiries.** High-velocity flow buried in "More" menu. | `client/src/components/BottomNav.tsx` L61 | S | Clunky mobile flow |
| P3 | UX | **Raw img tag bypasses optimization.** | `client/src/app/dashboard/layout.tsx` L1179 | S | Minor load time hit |
| P3 | Performance | **Unused cache middleware.** | `server/src/routes/hall.routes.ts`, `server/src/routes/vendor.routes.ts` | S | Unnecessary DB queries |


## SECTION I — DARK MODE COMPATIBILITY

**I1 — Hardcoded Colors**
- **Finding:** Many components across the client application use hardcoded Tailwind classes like `bg-white`, `text-gray-700`, `border-gray-200`, and `bg-green-50`. These classes override CSS variables (`var(--surface)`, `var(--text-1)`) that typically adjust when `[data-theme="dark"]` is active.
- **Impact:** When a user switches to dark mode, large areas of the UI (such as modals, cards, popovers, and table rows) will remain stark white, creating a harsh contrast and breaking the dark mode experience.
- **Fix:** Replace all hardcoded colors (e.g., `bg-white`) with CSS variable references (`bg-[var(--surface)]`) and use semantic text/border colors (`text-[var(--text-1)]`, `border-[var(--border)]`) so styles adapt seamlessly to theme changes.
