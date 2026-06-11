# Bika Banquet — Reliability & UX Fix Implementation Plan

**Scope:** every problem from `01-forensic-audit.md` **except R4** (Google Calendar
external-event blocking/labelling) and **R7** (dual status-badge system), per product
decision. R7's exclusion also removes audit problem #5 (status collapsing) from scope.

**Hard constraint — the Forms Contract:** no change to the workflow or functionality of
any form. Concretely, for every form in the app (booking create/edit, menu editor,
quick-add item, enquiry, customer, payment rows, hall/banquet/item/vendor/user/role
forms):

1. Same fields, same field order, same defaults, same validation rules.
2. Same steps: nothing that used to take N clicks takes N+1 (the single exception is a
   *conflict-only* prompt in R2, which appears only when data would otherwise be lost —
   normal saves are untouched).
3. Same API calls with the same payloads (one additive pre-save GET in R2).
4. Same modal-based flow. The blueprint's "dedicated booking page" re-architecture
   (blueprint §7.1) is **deferred indefinitely** — the URL deep-links the modals need
   (`?section=edit&id=…`, `?section=new&date=…&hall=…&slot=…`) already exist
   (calendar/page.tsx:117-129), so the modal flow keeps working exactly as today.
5. All fixes are additive layers: indicators, guards, drafts, richer messages — never
   removed or rearranged functionality.

**Out of scope (unchanged from the audit's ground rules):** backend/API/database/auth
changes. Two items have a durable backend fix noted as `[backend dependency]`; in both
cases the client-only version ships first and stands alone.

**Stale audit findings corrected by this plan (no work needed):**
- Audit #4 ("FAB missing on Bookings") is wrong — `FloatingActionButton` is already
  rendered on the bookings page behind `canAddBooking` (bookings/page.tsx:5259-5264).
- `docs/phone-performance-plan.md` still lists calendar duplication bugs as open;
  `LatestWinsGuard` (calendar/page.tsx:149-156) and the `onEventRef` pattern in
  `useSSE` (useSSE.ts:16-21) already fix them. That doc should be archived or annotated.

---

## Phase 0 — Zero-risk quick wins (no form code touched)

### 0.1 Live nav badges (M6)
**Problem:** "pending enquiries" / "outstanding payments" sidebar badges are fetched
once on auth and never again (layout.tsx:496-510, deps `[isAuthenticated]`).
**Fix:**
- Extract the two fetches into a `refreshNavBadges()` callback.
- Call it on auth (as today), plus on SSE events: `useSSE(['enquiry:', 'booking:'],
  refreshNavBadges, isAuthenticated)` — the hook is already reconnect-safe.
- Add a 5-minute interval fallback for sessions where SSE is down.
**Files:** `client/src/app/dashboard/layout.tsx`.
**Contract check:** display-only; no form involved.
**Effort:** ~half day. **Risk:** minimal (debounce the SSE-triggered refresh ~2s to
avoid hammering during bulk updates).

### 0.2 Consistent in-app navigation from calendar (M4 / problem #7)
**Problem:** booking click uses `router.push` (calendar/page.tsx:119) but enquiry click
uses `window.location.href` (calendar/page.tsx:139) → full page reload.
**Fix:** change `openEnquiryDetails` to `router.push('/dashboard/enquiries?section=edit&id=…')`.
**Verification:** confirm the enquiries page reads `section`/`id` search params on
client-side navigation (it does for the calendar's booking equivalent; mirror that).
If the enquiries page only parses params on mount, add a `useSearchParams`-driven
effect there — display logic only, the enquiry form itself is untouched.
**Effort:** ~1 hour. **Risk:** minimal.

### 0.3 Idle-timeout truth (M8 / problem #10)
**Problem:** `IDLE_TIMEOUT_MS = 4h` (layout.tsx:308) while prose elsewhere says
"30-minute idle window" — contradictory documentation of a security-relevant behavior.
**Fix:** 4 hours is the behavior users currently live with — keep it; fix every stale
"30 minute" comment/doc to say 4 hours. The 60-second warning countdown
(layout.tsx:309-310) already exists and is good — no change.
**Effort:** ~1 hour. **Risk:** none (comments/docs only).

### 0.4 Dead Help button (problem #9)
**Problem:** header Help button has no `onClick` (layout.tsx:1056-1062).
**Fix:** remove it. (If help content exists later, reintroduce it wired to that.)
**Effort:** ~15 min. **Risk:** none.

---

## Phase 1 — Critical reliability (R1, R5, R2, R3)

### 1.1 R1 — Availability check must never fail silently  **(CRITICAL)**
**Problem:** the debounced hall-clash check swallows errors —
`catch { setHallClashWarnings([]) }` (bookings/page.tsx:709-711) — so "check failed"
renders identically to "hall is free."
**Fix (additive state machine, same check, same timing):**
- New state: `availabilityCheck: 'idle' | 'checking' | 'clear' | 'clash' | 'error'`.
  - `'checking'` when the 500ms timer fires; `'clear'` / `'clash'` from the response;
    `'error'` in the catch (replacing the silent reset; keep clearing the warnings
    array so no stale clash list shows).
- New UI: one status chip rendered next to the hall selectors *and* echoed beside the
  Save button:
  - `Checking availability…` (spinner)
  - `✓ No clashes for selected halls` (quiet, auto-fades)
  - `⚠ N clash(es)` (existing warning list stays exactly as-is below it)
  - `⚠ Couldn't verify availability — [Retry]` (Retry bumps a `recheckNonce` included
    in the effect deps; nothing else re-runs).
- **Deliberately not blocking save** in `'error'`/`'checking'` states — saving today
  doesn't depend on this check, and `assertNoHallClash()` inside the serializable
  transaction (server/src/controllers/booking.shared.ts:267-355) plus the Postgres
  exclusion constraint remain the real enforcement. The chip is information, not a gate.
**Files:** `client/src/app/dashboard/bookings/page.tsx` (effect at 689-716 + two render
sites). **Effort:** ~1 day. **Risk:** low — no control flow into save changes.

### 1.2 R5 — Unsaved booking work must survive accidents  **(CRITICAL)**
**Problem:** the dirty-check only guards the modal's own close button
(FormPromptModal.tsx:52-58). Browser refresh, tab close, back button, or a crash
discards everything silently.
**Fix (two independent layers):**
1. **`beforeunload` guard:** while `isFormDirty`, register a `beforeunload` handler
   (native browser "leave site?" prompt). Remove on save/clean close. Implement inside
   `FormPromptModal` keyed off the existing `isDirty` prop so *every* form using the
   modal gets it for free (bookings, enquiries, menu editor, etc.).
2. **Draft autosave + resume:** in the bookings page, debounce-serialize `formData` to
   `localStorage` under `bika_booking_draft:{editingBookingId || 'new'}` (~1s debounce,
   only while dirty). Clear the key on successful save and on explicit
   "Discard & Close." On opening the form, if a draft exists for that key and differs
   from the loaded state, show a small inline bar at the top of the modal:
   `Unsaved draft from 14:32 — [Resume] [Discard]`. Resume rehydrates `formData`;
   Discard deletes the key. No prompt when no draft exists → zero change to the normal
   open flow.
   - Drafts capture form *inputs* only — never payment IDs or server-derived totals —
     and resume runs the same `setFormData` path the form already uses, so validation
     and save behave identically.
   - Cap: one draft per booking key; stamp with `versionNumber`-free `updatedAt` check
     so a draft older than the server copy warns before resuming.
**Files:** `FormPromptModal.tsx` (layer 1), `bookings/page.tsx` (layer 2).
**Effort:** layer 1 ~half day; layer 2 ~2 days incl. resume-bar UI.
**Risk:** medium — resume must never overwrite a *newer* server state silently;
mitigated by the `updatedAt` stamp comparison (see 1.3, same plumbing).

### 1.3 R2 — No silent overwrites between two editors  **(CRITICAL)**
**Problem:** two users editing the same booking → last save wins, first user's changes
vanish with no warning. The form never captures a concurrency token (no
`updatedAt`/`versionNumber` reference anywhere in bookings/page.tsx).
**Fix (client-only; conflict-case-only prompt):**
- Capture `booking.updatedAt` (exists: server/prisma/schema.prisma Booking model,
  `@updatedAt`) into a ref when the form loads a booking (`applyBookingToForm`).
- In `doSaveBooking`, immediately before `api.updateBooking` (bookings/page.tsx:2602):
  one `api.getBooking(editingBookingId)` head-check. If server `updatedAt` ≠ captured →
  stop and show a conflict dialog:
  `This booking was changed by someone else at 14:32 while you were editing.`
  `[Reload latest (discard my changes)]  [Save anyway (overwrite theirs)]  [Cancel]`
  — "Save anyway" proceeds with today's exact save path; "Reload" runs the existing
  `applyBookingToForm` refresh. If `updatedAt` matches (the overwhelmingly common
  case), save proceeds with zero user-visible difference; cost is one extra GET.
- **Live awareness (non-blocking):** while the form is open, subscribe
  `useSSE(['booking:'], …)`; if an event references the open booking id, show a passive
  banner inside the modal: `Updated in the background — totals shown may be stale`
  (pairs with 1.4). Never auto-refresh user-edited fields.
- Creates (`api.createBooking`) skip the head-check entirely — nothing to conflict with.
- `[backend dependency]` durable fix: server compares `If-Unmodified-Since`/version and
  returns 409. Not required for the client guard to be useful; noted for later.
**Files:** `bookings/page.tsx`. **Effort:** ~2 days. **Risk:** low-medium — the prompt
only appears on a real conflict, which today produces silent data loss; any
false-positive risk (e.g. self-triggered `updatedAt` bump after the form's own save) is
handled by re-capturing `updatedAt` from the existing post-save refetch
(bookings/page.tsx:2638-2642).

### 1.4 R3 — Financials never silently stale while editing  **(CRITICAL)**
**Problem:** payments/totals shown in an open form don't reflect changes made elsewhere
mid-edit, with no staleness indicator.
**Fix:** on the SSE banner trigger from 1.3, offer `[Refresh financials]` which
refetches only the server-derived display surfaces — `BookingPaymentsLedger` and
`BookingFinancialSummary` — leaving every user-edited input untouched. After refresh,
flash `Updated just now` on the financial summary. The boundary is strict: refresh
re-runs the same payment/total fetch the form already performs after save; it never
writes into `formData` fields the user can edit.
**Files:** `bookings/page.tsx`, `BookingPaymentsLedger.tsx` (accept a refresh
nonce/prop), `BookingFinancialSummary.tsx` (same).
**Effort:** ~1.5 days. **Risk:** low — read-only refresh path.

---

## Phase 2 — High-priority trust (R6, R8, R9, R10)

### 2.1 R6 — Visible realtime connection state  **(HIGH)**
**Problem:** `useSSE` reconnects silently with backoff (useSSE.ts:71-80); users can't
tell live data from stale data during an outage.
**Fix:**
- Add a tiny global store (Zustand, matching existing client state) `sseStatus:
  'connected' | 'reconnecting' | 'offline'`, written from inside `useSSE`:
  `onopen → connected`; `onerror`/token-fetch failure → `reconnecting`; after ≥3 failed
  attempts → `offline`. Hook signature and all existing call sites unchanged.
- Render one small chip in the dashboard header (layout.tsx, beside ThemeToggle):
  `● Live` / `● Reconnecting…` / `● Offline — data may be stale`. Echo it in the
  calendar toolbar, where staleness is most dangerous.
**Files:** `useSSE.ts`, new `lib/sseStatusStore.ts`, `layout.tsx`, `calendar/page.tsx`.
**Effort:** ~1 day. **Risk:** minimal. *(Multiple `useSSE` instances run concurrently —
the store should track per-instance status and report the best one, so one healthy
connection shows "Live".)*

### 2.2 R8 — Saves report exactly what succeeded  **(HIGH)**
**Problem:** booking save fires the booking mutation, then `Promise.all` over payment
adds/updates (bookings/page.tsx:2615-2636). One failed payment rejects the batch; the
user gets a single generic error even though the booking and sibling payments saved.
(The existing catch *does* reset the form to last-known server state, 2663-2667 — good
— but tells the user nothing about which parts landed.)
**Fix:**
- Replace `Promise.all` with `Promise.allSettled`; collect per-payment outcomes.
- All fulfilled → exact current behavior (same success toast, same refetch at 2638).
- Any rejected → still refetch (so the form shows true server state, as today), then:
  - toast: `Booking saved. 1 of 3 payment entries failed (₹5,000 · cheque) — it has
    not been recorded. [Retry]`,
  - mark the failed payment row(s) in the payments section with an `unsaved` tag.
    Retry re-submits only the failed rows through the same add/update calls.
- Booking-mutation failure path (2654-2668) unchanged.
**Contract check:** identical API calls; success path byte-for-byte identical; failure
path goes from "generic error" to "precise error + retry" — strictly more information.
**Files:** `bookings/page.tsx`. **Effort:** ~1.5 days. **Risk:** medium — touches the
save routine; covered by the regression checklist below (save with 0/1/N payments,
mixed new+edited payments, induced payment failure via devtools request blocking).

### 2.3 R9 — Finalize gets a real review step  **(HIGH)**
**Problem:** finalizing — an irreversible snapshot — is gated by a bare browser
`confirm()` (bookings/page.tsx:2682) showing none of what's being locked.
**Fix:** replace `confirm()` with a `FormPromptModal` review sheet rendering a
read-only summary from current `formData`: customer, function name/type/date, halls per
pack with times, PAX, menu counts, totals/discount/advance, payment count and balance,
plus the existing sentence ("becomes read-only; a new editable replica is generated").
Buttons: `[Cancel]` / `[Finalize booking]`. On confirm, run the exact existing
sequence: `doSaveBooking({keepOpen:true})` → `api.finalizeBooking` → open replica
(2684-2696).
**Contract check:** still exactly one confirmation between click and finalize — the
dialog is richer, not extra.
**Files:** `bookings/page.tsx` (+ a small `FinalizeReviewSheet` component).
**Effort:** ~1.5 days. **Risk:** low.

### 2.4 R10 — Edited payments are visibly edits  **(HIGH)**
**Problem:** an edited payment entry is indistinguishable from a fresh one in the
ledger; financial history reads as if the correction was the original.
**Fix (client-only):**
- `BookingPaymentsLedger`: where `payment.updatedAt > payment.createdAt` (both already
  returned by Prisma), render an `edited` tag with a tooltip
  (`Last edited 11 Jun, 14:32`).
- In the booking form's payment rows, rows classified into `changedPayments` by
  `partitionPaymentsForSave` get a pre-save inline tag: `modified — will update the
  existing entry` so users know they're rewriting history rather than adding.
- `[backend dependency]` durable fix: persisted correction entries (old → new, who,
  when) in the append-only ledger. Client-only version ships regardless.
**Files:** `BookingPaymentsLedger.tsx`, `bookings/page.tsx`.
**Effort:** ~1 day. **Risk:** minimal (display only).

---

## Phase 3 — Mobile & responsive (R11, audit #3)

### 3.1 R11 / problem #6 — Bottom nav: 5 touch targets, not 7
**Problem:** 6 items + "More" = 7 cramped targets (BottomNav.tsx:22-60); mis-taps under
pressure.
**Fix:** cap visible items at **4 + More**. Priority order: Home, Bookings, Calendar,
Enquiries; Customers and Payments move into the existing "More" sheet (one extra tap,
still permission-filtered). Implementation: keep the single `navItems` array, slice the
permission-filtered list to 4, pass the remainder to the More sheet so nothing becomes
unreachable. Order lives in one array — trivial to reshuffle if usage says otherwise.
**Contract check:** navigation layout only; no form is touched; every destination
remains reachable.
**Files:** `BottomNav.tsx`, the More-sheet component in `layout.tsx`.
**Effort:** ~1 day incl. visual QA on small devices. **Risk:** low.

### 3.2 Problem #3 — Full tables on tablets
**Problem:** the booking pack table renders only at `xl` (≥1280px)
(bookings/page.tsx:3227 `hidden xl:block`, cards at 3756-3757 `xl:hidden`); landscape
tablets get the reduced card view and lose rate/hall-amount columns.
**Fix:**
- Lower the pair to `lg` (≥1024px) and wrap the table in `overflow-x-auto` with a
  sensible `min-w` so the 9 columns scroll horizontally instead of crushing — inside
  the `max-w-[1400px]` modal this is the safe option.
- Sweep the dashboard for the same `hidden xl:block` / `xl:hidden` pairs (bookings list
  table, etc.) and apply the same treatment where a table/cards pair exists.
**Contract check:** same columns, same data, same actions — only the breakpoint at
which the full table appears.
**Files:** `bookings/page.tsx` + any pages found in the sweep.
**Effort:** ~1 day incl. tablet QA (768/834/1024/1180px widths). **Risk:** low.

---

## Phase 4 — Consistency & structural health (behavior-preserving)

### 4.1 M5 — Conflicts flagged across the whole visible calendar range
**Problem:** `selectedDayConflicts` is computed only for the selected day
(calendar/page.tsx:394-397); week/month views show no conflict signal on other days.
**Fix:** run `findDayHallConflicts` across every day in the visible range (memoized;
it's pure client math over already-loaded data) and render a small conflict dot/badge
on affected day cells in `VenueTimelineBoard`. Selected-day detail panel unchanged.
**Files:** `calendar/page.tsx`, `VenueTimelineBoard.tsx`.
**Effort:** ~1 day. **Risk:** low — additive rendering; verify month-view perf with a
busy dataset (memoize per day-key).

### 4.2 Modal accessibility (low-priority audit items, fixed once for all forms)
**Fix in `FormPromptModal` only:** Escape key routes through the existing
`handleCloseRequest` (so the dirty-check still guards it — no functional change); focus
trap within the panel; initial focus to the panel. Every form inherits this.
**Effort:** ~1 day. **Risk:** low. *(Nested modal stacks — menu editor over booking —
need Escape to close only the topmost; track open modals with a simple counter/registry
in the component.)*

### 4.3 Problem #8 — Sidebar styling normalization
**Problem:** nav rendering mixes heavy inline `style={{}}` with Tailwind
(layout.tsx:620-925); visual drift over time.
**Fix:** move inline styles into classes built on the existing tokens
(`--surface*`, `--text-*`, `--border*`, `--teal-*`). Pixel-parity goal — before/after
screenshots in light and dark themes as the review artifact.
**Effort:** ~2 days. **Risk:** low (cosmetic), churn-heavy → isolate in its own commit.

### 4.4 Problem #2 — Incremental extraction of the 5,355-line bookings page
**Problem:** one monolith holds 50+ `useState` hooks; every fix above lands in this
file; risk concentrates.
**Fix:** *after* Phases 0-3 are merged (so we're not refactoring under our own feet),
extract presentational sections one per commit, props-only, no state relocation in the
first pass: `PackTable`, `PackMobileCards`, `BookingFormHeader`, `MenuEditorModal`,
`PaymentRowsSection`. Each extraction is reviewed against the regression checklist; any
extraction can stop without blocking anything else.
**Effort:** ~1 week, interruptible. **Risk:** medium — pure-refactor discipline, no
logic edits in extraction commits.

### 4.5 Motion polish (blueprint §10, reduced)
Token-level only: a standard transition scale (`120ms/180ms/240ms`, one easing curve)
applied to the new chips/banners from Phases 1-2 and existing hover states; respect
`prefers-reduced-motion`. No layout animation, no new libraries.
**Effort:** ~1 day, piggybacks on the components above.

---

## Sequencing, estimates, dependencies

| Order | Item | Effort | Depends on |
|---|---|---|---|
| 1 | 0.1-0.4 quick wins | ~2 days total | — |
| 2 | 1.1 R1 availability states | 1 day | — |
| 3 | 1.2 R5 drafts + beforeunload | 2.5 days | — |
| 4 | 1.3 R2 conflict guard | 2 days | shares `updatedAt` plumbing with 1.2 |
| 5 | 1.4 R3 live financials | 1.5 days | 1.3 (SSE banner) |
| 6 | 2.1 R6 connection chip | 1 day | — |
| 7 | 2.2 R8 allSettled saves | 1.5 days | — |
| 8 | 2.3 R9 finalize review | 1.5 days | — |
| 9 | 2.4 R10 edited tags | 1 day | — |
| 10 | 3.1 bottom nav | 1 day | — |
| 11 | 3.2 table breakpoints | 1 day | — |
| 12 | 4.1 calendar conflicts | 1 day | — |
| 13 | 4.2 modal a11y | 1 day | — |
| 14 | 4.3 sidebar styles | 2 days | — |
| 15 | 4.4 bookings extraction | ~1 week | after 1-13 merged |
| 16 | 4.5 motion tokens | 1 day | with 1-2 components |

≈ 4 working weeks for everything through item 13 (the full reliability + UX payload),
plus the optional structural week (4.4).

## Regression checklist (run after every phase that touches `bookings/page.tsx`)

The Forms Contract is verified manually against this list (and is the seed list for
Playwright smoke tests if/when added):

1. Create booking: customer typeahead → 2 packs with halls/menus/PAX/rates → save →
   reopen → all values persisted.
2. Edit booking: change PAX + add a menu item → save with `keepOpen` → totals correct.
3. Payments: add new + edit existing in one save; verify ledger; verify cheque with
   clearing date counts/doesn't count toward due correctly.
4. Finalize: save-then-finalize sequence; replica opens editable; original read-only.
5. Quotation and pencil-booking toggles unchanged (incl. pencil expiry chip on calendar).
6. Hall clash: pick a clashing hall/date → warning list appears (now with status chip);
   save still blocked only by the server when truly clashing.
7. Dirty-close: modal close button → existing confirm; browser refresh → new
   beforeunload prompt; draft resume bar appears after a forced refresh mid-edit.
8. Menu editor and quick-add-item nested modals: open/edit/close, Escape closes topmost
   only.
9. Enquiry → quotation → conversion flow untouched end-to-end.
10. Mobile (≤640px) and tablet (768-1180px): bottom nav 5 targets; pack table visible
    at ≥1024px; card views below.

## Explicitly not in this plan

- **R4** (Google Calendar events in clash checks/labels) and **R7** (two-axis status
  badges) — excluded by product decision.
- Backend changes of any kind (optimistic-lock 409s and persisted payment-correction
  audit entries are noted inline as future `[backend dependency]` items).
- The blueprint's full booking-workspace page (§7.1), navigation IA overhaul (§2), and
  the three visual design directions (§11) — all deferred; nothing in this plan
  precludes them later.
