# Bika SW — Forensic Product Audit

> Part 1 of 2. This document is the evidence base: what the software actually is today, what works,
> what is broken, and a ranked register of data-reliability risks. The redesign itself is in
> [02-redesign-blueprint.md](./02-redesign-blueprint.md).
>
> Everything below is grounded in the actual codebase (`bika-banquet/client`, `bika-banquet/server`)
> with file references. No screens were invented; no capability changes are assumed.

---

## 0. What this product actually is

A multi-venue banquet operations platform (venues: Bika 1, Bika 2, Rangoli, Divinity Pavilion) covering:

- **Lead → money pipeline**: Enquiry (`pending → quoted → converted → cancelled`) → Booking
  (`confirmed | cancelled | completed`, plus `isQuotation`, `isPencilBooking + pencilExpiresAt` flags)
  → Finalize (immutable snapshot + new editable version) → Party-Over (extra plates, settlement
  discount, `completed`, read-only).
- **Meal-pack model**: every booking carries up to 4 packs (Breakfast / Lunch / Hi-Tea / Dinner),
  each with its own halls, time window, menu (template or custom), PAX, rate/plate, hall rate.
- **Payments**: append-only ledger per booking (cash/card/upi/cheque/bank_transfer), cheque
  clearing-date logic ("credited toward due" vs "pending clearance"), settlement at party-over.
- **Availability**: server-enforced via `assertNoHallClash()` (`server/src/controllers/booking.shared.ts:267`)
  inside serializable transactions, backed by a PostgreSQL exclusion constraint
  (`booking_halls_hall_time_range_excl`). Active pencil holds block halls; expired ones are released
  by an hourly cron. Google Calendar events are imported read-only and do **not** block.
- **Realtime**: SSE (`booking:*`, `enquiry:*`, `customer:*`) over Redis pub/sub; client reconnects
  with backoff (`client/src/hooks/useSSE.ts`).
- **Delivery**: Next.js 14 web + Capacitor/Ionic native shells (Android/iOS), dark mode, RBAC with
  venue scoping, audit log, Cmd+K command palette.

The single most important architectural fact for the redesign: **the backend is already strong on
correctness** (serializable isolation, DB-level exclusion constraint, append-only ledger, version
chains, audit log). Nearly all trust failures live in the **presentation layer** — what staff see,
when they see it, and what the UI implies about system state.

---

## 1. Existing software audit

### 1.1 What genuinely works well (keep, don't regress)

| Area | Evidence | Why it's good |
|---|---|---|
| Hall-clash enforcement | `booking.shared.ts:267-355`, exclusion constraint verified at boot | Double-booking is physically impossible at the DB level. Conservative default: missing times = same-day clash. |
| Pencil-hold semantics | `pencilExpiresAt`, hourly release cron with Redis lock | Real hospitality workflow (tentative holds that auto-expire) is modeled, not faked. |
| Version chain + finalized snapshots | `versionNumber/isLatest/previousBookingId`, `FinalizedBooking.data` JSON | Immutable financial history; `FinalizedVersionHistory.tsx` even renders per-version diffs. |
| Live calendar | `calendar/page.tsx:149` LatestWinsGuard, SSE refresh at `:242`, debounced reload | The race conditions documented in `docs/phone-performance-plan.md` (H1/H2) are actually fixed in code — the docs are stale. |
| VenueTimelineBoard | `components/VenueTimelineBoard.tsx` | Real engineering: lane assignment for overlaps, 9:00–22:00 timeline, now-line, pencil countdown chips, status-colored bars, separate mobile day/week renderers, month heat tiles. |
| Dirty-state modal guard | `FormPromptModal.tsx:52-58` | Closing a dirty form asks before discarding (in-modal only — see risks). |
| Cheque clarity in ledger | `BookingPaymentsLedger.tsx:419-429` | "Credited toward due" vs "pending clearance" is an unusually honest financial distinction. |
| Mobile foundations | safe-area vars (`globals.css:37-41`), keyboard offset via Capacitor (`CapacitorNativeShell.tsx`), bottom-sheet modals, BottomNav, FABs | The plumbing for a real mobile app exists. |
| Shared list primitives | `SortableHeader`, `TablePagination`, `EmptyState`, `FilterPanel`, `Combobox`, `StatusBadge`, skeletons | Used consistently across Customers/Enquiries/Halls/Menu/Payments/Logs. |
| Command palette | `CommandPalette.tsx` | Cmd+K with quick actions + live grouped search (Bookings/Customers/Enquiries). Underused, but the right instinct. |
| RBAC depth | roles + per-user grant/deny overrides + venue scoping | Permission model is more sophisticated than the UI that administers it. |

### 1.2 What is weak (the honest version)

**The product has no operational home.** `/dashboard` (`dashboard/page.tsx`) is an analytics page —
revenue KPIs, monthly bar charts, function-type mix, "business insights." A banquet team's day starts
with *"what's happening today, what's at risk, what needs action"* — none of which this screen
answers. The closest thing to an ops view (the calendar day view) is two clicks away.

**The core object has no page.** A booking — the entity everything orbits — has no URL of its own.
It exists only as a 1,400px-wide modal (`bookings/page.tsx:2818`, `widthClass="max-w-[1400px]"`)
stacked on top of the list, with two tabs (Details/Payments), a 9-column editable pack grid inside,
a menu editor opening as a *second* modal (`:4648`), and quick-add-item as a *third*. You cannot
link a colleague to a booking, open two bookings side by side, or look at the calendar while editing
one. The deep-link that does exist (`/dashboard/bookings?section=edit&id=…`, used by the calendar)
just re-opens the modal.

**The bookings page is a 5,355-line monolith** with 50+ `useState` hooks managing list, filters,
form, packs, menus, payments, PDF export, inline customer creation, and clash detection in one
component. This is not just an engineering smell — it produces UX smells: the list silently
re-renders under the modal, view state resets, and the default desktop view is a sparse card grid
(`viewMode` default `'cards'`, `:626`) showing ~9 bookings per screen where an operator needs 30.

**Status is a derived guess.** The UI badge collapses `status` + `isQuotation` + `isPencilBooking`
into one chip (`bookings/page.tsx:5187`: `isQuotation ? 'quotation' : booking.status`). A
quotation-flagged booking *hides* its underlying confirmed/cancelled state. Pencil expiry is
visible on the calendar timeline tooltip but not in the list table at all. Staff cannot answer
"is this hall hard-held?" from a list row.

**Three disconnected availability surfaces, none authoritative-feeling:**
1. Calendar timeline (visual, live via SSE).
2. In-form clash banner — appears only *after* date + halls are picked, debounced 500ms
   (`bookings/page.tsx:689-716`).
3. The server's save-time rejection (error toast with raw exception text).
There is no "answer machine" — nowhere to ask *"evening of June 14, 600 pax — what's free?"* and act
on the result.

**Navigation dead ends everywhere** (verified across screens):
- Payments table shows the booking name but doesn't link to it (`payments/page.tsx`).
- Customer detail lists "Recent Enquiries/Bookings" as plain text — not clickable (`customers/[id]/client.tsx`).
- Activity log rows show `resourceLabel` with no drill-down (`logs/page.tsx`).
- The header Help button has no `onClick` at all (`dashboard/layout.tsx:1056-1062`) — a dead control
  shipped to production.
- Enquiry → booking conversion has no UI path: the enquiry already holds packs, halls, dates and a
  `converted` status exists, but staff re-type everything into the booking form.

**Inconsistent paradigms:**
- Customers create/edit on dedicated routes; every other entity edits in modals.
- Calendar opens bookings via `router.push` but enquiries via `window.location.href` —
  a full page reload (`calendar/page.tsx:139`).
- Date formats: `DD-MM-YYYY` in tables, `Mon 'YY` on dashboard, long-form locale strings on calendar.
- Half the styling is Tailwind classes, half inline `style={{}}` objects (the entire sidebar nav,
  `layout.tsx:620-925`), guaranteeing drift.

**Nav badges lie by omission.** Pending-enquiry and outstanding-payment counts are fetched once on
auth (`layout.tsx:497-510`) and never refreshed — by afternoon they're fiction, displayed with the
confidence of fact.

**Visual identity is "competent admin template."** Inter, teal-600 primary, slate neutrals, rounded
cards (`globals.css:7-25`). Nothing wrong, nothing premium, and nothing that ranks information by
operational importance — revenue charts get the same visual weight as the conflict banner.

---

## 2. Biggest UX problems, ranked by operational impact

| # | Problem | Operational consequence |
|---|---|---|
| 1 | Trust gaps in availability & saves (see risk register §3) | Wrong commitments to customers; lost edits; the staff habit of "call to double-check" defeats the software |
| 2 | No booking page/workspace; modal-stack editing | Slow, error-prone handling of the highest-value object; no shareable links; no side-by-side work |
| 3 | No operational home screen | Every shift starts with navigation archaeology instead of a worklist |
| 4 | Enquiry→booking re-entry | Transcription errors on dates/halls/PAX — exactly the fields that cause clashes |
| 5 | Status ambiguity (quotation/pencil/confirmed collapsed into one chip) | Misread hall holds; mis-prioritized follow-ups; tentative treated as firm |
| 6 | Dead-end entities (payment↛booking, customer↛booking, log↛resource) | Constant manual cross-referencing via search; wasted minutes per task, many times a day |
| 7 | Desktop list density (card grid default, tall table rows) | Operators scan 9 cards when they need 30 rows; pagination instead of overview |
| 8 | Mobile shell compromises (7-tab bottom nav; tablets get phone layout for the booking form at <1280px, `bookings/page.tsx:3227`; 34px web buttons) | The people most "in motion" get the weakest tool |
| 9 | Filter system = column-search clone in a right overlay panel, per page | Filtering feels like configuration, not work; no saved views; no shared semantics |
| 10 | Admin sprawl (Settings permission grid, hidden Ingredients/Vendors pages reachable only via sidebar subtree) | Misconfigured roles; undiscovered features |

---

## 3. Data-reliability risk register (the priority lens)

Every finding below is verified in code. Ranked by *operational impact × probability*. UX remedies
are specified in the blueprint (Part 2, cross-referenced); none require backend changes unless
explicitly marked as a flagged dependency.

### 🔴 CRITICAL — could cause real business damage

**R1. Availability check failure is silent — failure looks identical to "all clear."**
`bookings/page.tsx:709-711`: the debounced clash check does `catch { setHallClashWarnings([]) }`.
A timeout, auth blip, or server error *clears the warning banner*. Staff filling the form on hotel
Wi-Fi see no clash warning and reasonably conclude the hall is free; the truth only surfaces as a
save-time rejection — or worse, the save succeeds for a *different* pack's hall and the verbal
commitment was already made.
*Probability: high (any network hiccup). Data integrity: indirect. Business risk: double-promised dates.*
→ Remedy: blueprint §6.3 (three-state check chip: Verified / Checking / **Couldn't verify — retry**).

**R2. Concurrent edits silently merge or overwrite (last-write-wins).**
`server/src/controllers/booking.write.ts:1034+` reads the booking once, then updates with no
`updatedAt`/`versionNumber` guard; packs are wholesale delete-and-recreated (`:1204-1297`). Client
sends full form state. Two staff editing the same booking (sales adjusting menu, accounts adjusting
discount) → the second save destroys the first, **with a success toast on both screens**. The
`versionNumber` field exists but serves the finalize chain, not concurrency.
*Probability: medium (shared computers, busy season). Data integrity: direct loss. Business risk: vanished menu/rate changes discovered at the event.*
→ Remedy: blueprint §7.4 (edit-presence + change-while-editing banner using existing SSE events;
true 409 protection flagged as backend dependency).

**R3. Stale financials inside an open dirty form get re-submitted as truth.**
`bookings/page.tsx:2348`: external payment refresh is skipped when `isFormDirtyRef.current` is true.
A colleague records a ₹25,000 payment while you have the form open; your form still shows the old
due; your save then writes totals computed against stale payments. Server recalculation mitigates
the stored amounts (`booking.payments.ts` recomputes from SUM), but the operator *acted* on a wrong
due figure — quoted it, took the wrong settlement decision.
*Probability: medium. Business risk: wrong amounts quoted to customers; reconciliation work.*
→ Remedy: blueprint §7.4 + §8.3 (money-state header always server-derived, live; "payments changed
while editing" inline event row).

**R4. Google Calendar events look like bookings but don't block anything.**
Imported events render in the same timeline as native bookings (`calendar/page.tsx:580-611`,
`hallBoardRows`), distinguished mainly by tooltip/origin. `assertNoHallClash()` queries only the
`Booking` table. Staff who see "Divinity Pavilion looks busy/free on the board" are reading two
sources with different guarantees and no visual contract. A booking that overlaps a Google event
saves *successfully*.
*Probability: medium-high wherever Google import is enabled. Business risk: a real-world hall conflict the software said was fine.*
→ Remedy: blueprint §6.4 (explicit "external — does not block" visual grammar + advisory overlap
warning at booking time; true blocking flagged as backend dependency).

**R5. A 10-minute booking entry can vanish without warning.**
No `beforeunload` guard, no draft persistence (verified: no localStorage/sessionStorage draft writes
in the form path). The dirty-check exists only inside the modal's own close button. Ctrl+R, a tab
crash, the Capacitor app being killed in background, or the 4-hour idle logout (`layout.tsx:308`)
while a form is open = total loss, silently.
*Probability: high over any month of real use. Business risk: re-entry errors + staff distrust ("type it in Notes first").*
→ Remedy: blueprint §7.3 (save-state pill, local draft retention, leave guards).

### 🟠 HIGH — likely operational confusion

**R6. Liveness is invisible.** SSE reconnects silently with backoff (`useSSE.ts:71-80`); during an
outage the calendar/list simply stop updating with no indicator. Staff at the front desk are reading
a frozen board styled exactly like a live one. *(The well-built LatestWinsGuard prevents wrong
merges, but not stale display.)*
→ Remedy: blueprint §7.2 (global sync chip + per-surface "as of HH:MM" stamps).

**R7. Tentative vs. firm is one badge.** `isQuotation` overrides status in the badge
(`bookings/page.tsx:5187`); pencil expiry countdown exists only in calendar tooltips
(`VenueTimelineBoard.tsx:123`, `pencilCD()`); the list table has no hold-expiry column. Enquiry-side
flags (`quotationSent`, `isPencilBooked`) render as tiny supplementary glyphs.
→ Remedy: blueprint §5 status system (two-axis: lifecycle × hold-type, expiry always visible).

**R8. Save pipeline is multi-request with partial-failure ambiguity.** Booking save → then payment
creates/updates in a `Promise.all` (`bookings/page.tsx:2612-2636`) → then refetch. If a payment call
fails after the booking save succeeded, the toast says failure, the booking is updated, the payment
may or may not exist, and the restored form state (`savedFormDataRef`) no longer matches the server.
No per-payment status is shown. Double-submit protection is the disabled button only; no idempotency.
→ Remedy: blueprint §7.3 (per-row save receipts in the ledger; explicit retry affordance).

**R9. Finalize — the most consequential action — runs through `confirm()`.**
`bookings/page.tsx:2682`: a native browser confirm with a one-liner, for an action that snapshots
financials and forks the version chain. Meanwhile a real diff engine (`formDiff`, rendered as
+added/−removed chips in the menu editor) already exists and isn't used here.
→ Remedy: blueprint §7.5 (finalize review sheet with the existing diff).

**R10. Payment edits are invisible history.** Payments are edit-in-place via PATCH with no audit
entry for the change and no "corrected" marker in the ledger UI. A ₹50,000 typo corrected to ₹5,000
leaves no on-screen trace of ever having been wrong — the opposite of how money UIs earn trust.
→ Remedy: blueprint §8.3 (correction grammar in ledger; audit-log entry flagged as backend dependency).

**R11. Mobile commitment surfaces.** 7 items in the bottom nav (6 + More, `BottomNav.tsx:22-60`);
the booking form's structured pack table only exists ≥1280px, so iPads get the stacked phone cards
for the most data-dense task in the product; web buttons are ~34px tall (`globals.css` `.btn`)
against the 44px floor; bookings has no FAB while customers/enquiries do.
→ Remedy: blueprint §10.

### 🟡 MEDIUM — friction and inefficiency

- **M1.** Legacy data path loads up to 5,000 rows then paginates client-side (75/page); server
  pagination exists behind `usesServerPagination()` flags but defaults off. Slow first paint on
  phones; search semantics differ between modes (300ms vs 150ms debounce).
- **M2.** FilterPanel is a per-column search overlay, duplicated per page, no saved filters, no URL
  persistence of filter state (lost on refresh/sharing).
- **M3.** Inline customer creation inside the booking modal duplicates the entire customer form
  (~25 fields) as a fourth nesting level.
- **M4.** `window.location.href` navigation for enquiry edit (full reload, loses SPA state).
- **M5.** Dashboard "Resource Counts" tiles deep-link to admin pages — admin shortcuts occupying
  the prime operational screen.
- **M6.** Stale nav badge counts (fetched once per session, `layout.tsx:497`).
- **M7.** Ingredients/Vendors reachable only via sidebar subtree; not represented as tabs within the
  Menu page they conceptually belong to.
- **M8.** Idle timeout config contradiction: constant says 4h (`layout.tsx:308`) while the comment
  says 30 min — somebody changed policy without deciding it.

### ⚪ LOW — polish

- Date-format inconsistency across screens; currency formatting mostly consistent (en-IN).
- Dead Help button (`layout.tsx:1056`).
- Logo loaded from an external CDN (`assets.zyrosite.com`) — broken brand mark if that host blips.
- Modal lacks Escape-to-close and focus trap (`FormPromptModal.tsx`).
- Inline-style/Tailwind mixture; two slightly different nav item renderers (primary vs secondary)
  duplicated in `layout.tsx`.

---

## 4. Workflow friction map (clicks & cognition)

**Lead lifecycle** — Enquiry created in modal (customer must already exist or be created in a
nested form) → status managed by editing the enquiry → *conversion to booking = full manual re-entry*
(no prefill path despite enquiry carrying packs/halls/date). Friction: ~40+ fields re-typed; the
`converted` status is bookkeeping, not a workflow.

**Quotation flow** — A quotation is a booking with `isQuotation=true` created through the same
mega-form; "sending" it means generating a PDF. No quote-versus-quote comparison, no expiry surface
(`quotationValidUntil` exists in the enquiry model, invisible in UI).

**Booking creation** — Open modal (1 click) → pick/create customer (1–25 fields) → per-pack: enable,
banquet, hall picker popover, times, menu modal, PAX, rates (≈10 interactions × up to 4 packs) →
financials (sync-mode quirks between discount % / amount / net) → save. Clash feedback arrives only
after halls are chosen, and silently dies on network error (R1).

**Availability checking** — No first-class flow. Practiced path: open Calendar → set day view →
visually scan timeline → remember → navigate to Bookings → re-enter everything. The
`check-availability` endpoint is never exposed as a user-facing query tool.

**Payment workflow** — Two entry points with different shapes: Payments page (pick booking from a
global Combobox, fill modal) and the booking form's Payments tab (inline ledger). The Payments list
row doesn't link to the booking; balance questions require search round-trips.

**Calendar workflow** — Strong day/week/month timeline, live updates, conflict banner — but the
banner covers only the *selected* day (`calendar/page.tsx:394`), conflicts elsewhere in the visible
month stay silent, and clicking a booking warps you into the bookings-page modal, losing calendar
context entirely.

**Approval/admin** — Settings hides a sophisticated permission engine behind a raw grant/deny grid
of ~80 permission strings grouped by subject; no role preview ("what would this user see?"), no
diff when editing roles.

---

*Continue to [02-redesign-blueprint.md](./02-redesign-blueprint.md) for the redesign.*
