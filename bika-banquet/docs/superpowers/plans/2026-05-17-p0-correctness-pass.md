# P0 Correctness Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the confirmed P0 correctness issues blocking safe testing of booking, auth, permission, search, and mobile-critical flows.

**Architecture:** Keep the current app structure intact and patch the broken seams instead of broad refactors. The backend changes concentrate on type correctness, auth/permission enforcement, and route availability; the frontend changes concentrate on making those corrected APIs reachable and preventing the heaviest lookup-path regressions on mobile.

**Tech Stack:** Prisma, Express, TypeScript, Next.js, Zustand, Axios, Zod

---

### Task 1: Fix Booking Pack Hall ID Typing End-to-End

**Files:**
- Modify: `server/prisma/schema.prisma`
- Modify: `server/src/controllers/booking.controller.ts`
- Modify: `client/src/app/dashboard/bookings/page.tsx`
- Modify: `client/src/components/HallCard.tsx`
- Test: `server` TypeScript build, `client` TypeScript build

- [ ] Update `BookingPack.hallIds` from `Int[]` to `String[]` in Prisma and align any schema comments with UUID-based hall IDs.
- [ ] Update booking create/update Zod schemas to accept `z.array(z.string().uuid())` for pack `hallIds`.
- [ ] Normalize incoming pack hall IDs as trimmed UUID strings in booking controller create/update paths instead of numbers.
- [ ] Include `hallIds` in the client booking save payload so pack-level hall selection survives create/update.
- [ ] Verify `HallCard` and edit-form normalization paths continue to treat hall IDs as strings only.
- [ ] Run `cd /Users/harshitgoyal/Downloads/files/bika-banquet/server && npm run build`.
- [ ] Run `cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npm run build` or the strongest compile-only fallback available if production build is too coupled to env.

### Task 2: Add Password Management Routes and UI

**Files:**
- Modify: `server/src/controllers/auth.controller.ts`
- Modify: `server/src/routes/auth.routes.ts`
- Modify: `server/src/middleware/auth.middleware.ts`
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/app/dashboard/settings/page.tsx` or a tighter profile/settings surface if present
- Test: `server` TypeScript build, `client/src/lib/api.test.ts`

- [ ] Add an authenticated `POST /auth/change-password` controller that verifies current password, hashes the new password, and returns a success response.
- [ ] Add an admin/manager-controlled password reset route only if there is already a safe existing user-management surface to host it; otherwise implement self-service change-password only in this pass and leave reset-password for a follow-up.
- [ ] Fix session validation refresh logic so `userBanquets` is included when session-backed auth resolution runs.
- [ ] Add client API methods for password change.
- [ ] Add a UI entry point for logged-in users to change their password without exposing unrelated RBAC settings.
- [ ] Extend `client/src/lib/api.test.ts` with a failing test for the new auth API method shape first, then update implementation until it passes.

### Task 3: Enforce Banquet and Permission Scoping Consistently

**Files:**
- Modify: `server/src/controllers/booking.controller.ts`
- Modify: `server/src/controllers/hall.controller.ts`
- Modify: `server/src/controllers/banquet.controller.ts`
- Modify: `server/src/controllers/analytics.controller.ts`
- Modify: `server/src/controllers/search.controller.ts`
- Modify: `server/src/controllers/calendar.controller.ts` if needed
- Modify: `server/src/routes/search.routes.ts`
- Test: `server` TypeScript build

- [ ] Add a shared, minimal helper in existing controller space to resolve allowed banquet IDs from `req.user` without introducing broad refactors.
- [ ] Apply banquet scoping to booking detail/history/payment mutation flows so direct-ID access cannot bypass list restrictions.
- [ ] Apply banquet scoping to hall and banquet by-id/update paths where missing.
- [ ] Apply banquet-aware filtering to analytics so summary data respects user banquet assignments.
- [ ] Require explicit search permissions on `/search` and filter returned bookings/enquiries by allowed banquet scope.
- [ ] Keep customer search accessible only where the caller already has customer visibility.
- [ ] Build and type-check the server after each scoped set, then once at the end.

### Task 4: Secure the SSE Endpoint

**Files:**
- Modify: `server/src/routes/index.ts`
- Modify: `client/src/app/dashboard/bookings/page.tsx`
- Test: `server` TypeScript build, `client` build

- [ ] Move SSE authentication behind the existing bearer-token auth middleware rather than leaving `/api/events` public.
- [ ] Preserve heartbeat behavior and connected-client cleanup.
- [ ] Update the client EventSource connection path only if auth transport requires a compatible mechanism; otherwise keep the existing same-origin path.
- [ ] Verify the bookings page still compiles against the secured endpoint behavior.

### Task 5: Repair Search/Command Palette Navigation

**Files:**
- Modify: `server/src/controllers/search.controller.ts`
- Modify: `client/src/components/CommandPalette.tsx`
- Modify: `client/src/app/dashboard/bookings/page.tsx`
- Modify: `client/src/app/dashboard/enquiries/page.tsx`
- Test: `client/src/lib/api.test.ts` if API shape changes, `client` build

- [ ] Stop returning dead detail-page hrefs for bookings and enquiries.
- [ ] Switch search navigation to routes that the UI can actually open, preferably by driving the existing list pages with query params that open the relevant record in-place.
- [ ] Add list-page handling for those query params so a clicked search result opens the right booking or enquiry workflow directly.
- [ ] Keep customer detail navigation unchanged because that route exists.

### Task 6: Reduce the Worst Mobile Lookup Prefetches in Primary Flows

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx`
- Modify: `client/src/app/dashboard/enquiries/page.tsx`
- Modify: `client/src/app/dashboard/payments/page.tsx`
- Test: `client` build

- [ ] Replace the 5000-row booking-form prefetch pattern with narrower limits or demand-driven lookup loading for the booking form’s heaviest dependencies.
- [ ] Apply the same reduction to enquiry and payments flows where lookup lists are currently fetched wholesale before the user can act.
- [ ] Preserve graceful empty/error handling so one failed lookup does not silently poison the whole form state.
- [ ] Keep this pass narrow: optimize the hottest staff-facing flows only, not every admin page.

### Task 7: Verification

**Files:**
- Modify: `client/src/lib/api.test.ts`
- Test: repo build/test commands

- [ ] Run `cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npm test -- --runInBand` if the repo has a working test runner; otherwise document that the existing repo does not expose one and use the strongest available file-level verification.
- [ ] Run `cd /Users/harshitgoyal/Downloads/files/bika-banquet/server && npm run build`.
- [ ] Run `cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npm run build`.
- [ ] If any build step is blocked by unrelated pre-existing issues, isolate which failure belongs to this patch versus existing repo state and report that clearly.
