# Bika SW — Redesign Blueprint

> Part 2 of 2. Builds strictly on the audit in [01-forensic-audit.md](./01-forensic-audit.md).
> Scope: UX, UI, information architecture, navigation, workflows, screens, interaction, motion.
> No backend/API/schema/framework changes are proposed. Where a UX pattern would *eventually* need a
> server capability to be complete (e.g., true optimistic locking), it is explicitly marked
> **[backend dependency]** and a client-only fallback is designed first.
>
> Risk IDs (R1–R11, M1–M8) refer to the audit's risk register.

---

## 1. Design philosophy

**Trust before beauty.** Staff must always be able to answer three questions without thinking:
*Is what I'm looking at current? Did what I just did actually happen? Is anyone else changing this?*
Every screen carries the answers as ambient state, not as something to hunt for.

Operating principles, in priority order:

1. **State is always visible.** Live/stale, saved/unsaved, held/firm, cleared/pending — rendered,
   never implied.
2. **Failure is louder than success.** A failed check or save must be visually impossible to read
   as a pass (directly fixes R1).
3. **The system never asks the user to remember.** Availability follows you into the booking form;
   the enquiry pre-fills the booking; the payment links to its booking.
4. **Dense clarity over decoration.** Operators scan; they don't browse. 13px type, 36px rows,
   tabular numerals — not cards floating in whitespace.
5. **One object, one URL.** Bookings, enquiries, customers, payments — all addressable, all linkable.
6. **Protect without nagging.** Safeguards scale with consequence: nothing for reversible actions,
   undo for soft actions, review sheets for forks (finalize), typed confirmation only for the truly
   destructive (hard delete).

---

## 2. Navigation redesign

### 2.1 Desktop information architecture

Reduce primary nav to the operational loop; everything administrative collapses under **Manage**.

```
─ OPERATE ─────────────────────────────
  ◉ Today              /dashboard/today        ← new default landing (ops home)
  ◉ Calendar           /dashboard/calendar     (availability board lives here, day view default)
  ◉ Bookings           /dashboard/bookings
  ◉ Pipeline           /dashboard/enquiries    (enquiries + quotations as stages, renamed)
  ◉ Payments           /dashboard/payments
  ◉ Customers          /dashboard/customers
─ MANAGE ──────────────────────────────
  ▸ Venues             /dashboard/halls
  ▸ Menu Library       /dashboard/menu  (tabs: Item Types · Items · Templates · Ingredients · Vendors)
  ▸ Reports            /dashboard/reports
  ▸ Settings           /dashboard/settings  (Users · Roles · Activity Log as tabs)
```

Changes vs. today, with rationale:

- **Today** replaces the analytics dashboard as the landing route. The analytics content moves to
  Reports, where it semantically belongs. (Audit problem #3, M5.)
- **Activity Logs folds into Settings** as a tab — it's an admin/audit tool, not a daily destination.
  This also resolves the inconsistent permission-denied rendering noted in the screens inventory.
- **Ingredients/Vendors become tabs of Menu Library** (M7) instead of sidebar-subtree-only routes.
  The existing `?section=` tab pattern (already used by Menu/Halls/Settings) extends naturally.
- **Breadcrumb is replaced by a context bar**: current entity title + status chip + sync chip (§7.2).
  Path-segment breadcrumbs ("Dashboard › Bookings") encode no information the sidebar doesn't.
- **Live badge counts**: the Enquiries/Payments badges already exist (`layout.tsx:497`) — they
  re-derive from the SSE events the layout already receives instead of one boot-time fetch (M6).
- **Remove the dead Help button** or make it open a real shortcut/legend sheet. Shipped dead
  controls erode trust in everything else.
- **Command palette is promoted to the primary power tool**: every entity gets `Open …` plus verbs —
  `New booking on <date>`, `Check availability <date>`, `Record payment for <booking>`. The palette
  infrastructure (`CommandPalette.tsx`) already supports actions; this is wiring, not invention.

### 2.2 Mobile navigation

Bottom nav cut from 7 to 5 fixed items (R11):

```
[ Today ] [ Calendar ] [ Bookings ] [ Payments ] [ More ]
```

- Customers and Pipeline live under **More** (a half-sheet, not the drawer) — on a phone, staff
  *look things up and record things*; customer CRUD is desk work.
- One global FAB, context-sensitive: on Calendar = "New booking on selected date", on Bookings =
  "New booking", on Payments = "Record payment". (Fixes the missing bookings FAB.)
- Tab choice respects role permissions exactly as `BottomNav.tsx` does today.

---

## 3. Workflow redesign

### 3.1 One pipeline: Enquiry → Quote → Hold → Booking

Today these are two screens and a manual re-typing exercise. Redesigned as a single visible pipeline
on the **Pipeline** screen — columns or filter-stages mapped to *existing* statuses (no new states):

```
NEW (pending) → QUOTED (quoted/quotationSent) → ON HOLD (isPencilBooked) → WON (converted) / LOST (cancelled)
```

- **Convert** is a first-class button on an enquiry: it opens the booking workspace **pre-filled**
  from the enquiry's customer, date, halls, packs, template menus, PAX (`EnquiryPack` already stores
  `mealSlotId`, `templateMenuId`, `packCount`). This is pure client-side prefill into the existing
  create-booking call — the single highest-leverage click-saver in the product, and it removes the
  transcription-error class entirely (audit problem #4).
- Quote expiry (`quotationValidUntil`) and pencil expiry (`pencilBookedUntil`) render as countdown
  chips on the card/row — aging leads become visible instead of archaeological.

### 3.2 Availability-first booking

The canonical creation flow inverts: **pick the slot, then describe the event.**

1. From Today/Calendar/palette: "Check availability" → the Availability Board (§6) for a date.
2. Tap a free hall×slot cell → "Book this" / "Hold this (pencil)" → booking workspace opens with
   date, hall, slot, and times pre-filled (the calendar already passes `?date&hall&slot` —
   `calendar/page.tsx:123-129`; the workspace honors it).
3. The clash check (§6.3) re-verifies continuously while the form is open.

The current path (form first, clash warning later) remains possible but is no longer the default
gesture.

### 3.3 Payments without round-trips

- Every payment row everywhere links to its booking (audit problem #6).
- "Record payment" from a booking context pre-binds the booking; from the Payments screen, the
  existing pinned-Combobox picker stays.
- The ledger (already strong) becomes the single payment-editing surface; the Payments page modal
  reuses it instead of a parallel form.

### 3.4 Friction ledger (what the redesign deletes)

| Task | Today | Redesigned |
|---|---|---|
| Enquiry → booking | ~40 fields re-typed | 1 click + review |
| "Is the hall free?" | Calendar → scan → remember → Bookings → re-enter | 1 query, actionable cells |
| Payment → its booking | Search by name | 1 click |
| Booking link to a colleague | Impossible (modal) | Copy URL |
| Finalize review | `confirm()` one-liner | Diff sheet (already-computed `formDiff`) |
| Menu edit | Modal-in-modal | Inline section in workspace (§7) |

---

## 4. Screen-by-screen redesign

Each entry: what it is today (from the audit) → what it becomes.

**Today (new, replaces dashboard-as-landing)** — A worklist, not a chart gallery:
- *Header strip*: date, sync chip, "X events today · Y this week".
- *Now/Next*: today's and tomorrow's events as dense rows (time, hall, function, PAX, status,
  balance due) — each row links to the booking workspace.
- *Needs attention*: expiring pencil holds (next 72h), unanswered new enquiries, events within 7
  days with outstanding balance, cheques pending clearance. All derived from existing fields
  (`pencilExpiresAt`, `status`, `dueAmountValue`, `clearingDate`).
- *Mini availability strip*: next 7 days × venues heat row → tap into Availability Board.
- KPIs and charts move to Reports unchanged.

**Calendar** — Keep the strong VenueTimelineBoard core. Changes:
- Conflict surfacing extends beyond the selected day: any visible day with a conflict gets a red
  corner glyph in month/week views (the data already exists per-day via `findDayHallConflicts`).
- Booking click opens a **peek panel** (right side, desktop; bottom sheet, mobile) with summary +
  "Open workspace" — context is no longer destroyed by the jump (the `BookingDrawer` component
  already exists as a starting point).
- Google events get the §6.4 visual grammar.
- "As of HH:MM · Live" stamp in the toolbar (§7.2).

**Bookings list** — Table becomes the desktop default (cards remain a toggle); dense-table spec §9.
Columns: Date · Time · Function · Customer · Halls · PAX · Status (two-axis chips, §5) · Hold expiry
· Total · Due · Updated. Row click → workspace. Saved views replace ad-hoc filter sessions:
"Upcoming", "Pencil expiring", "Outstanding balance", "Completed this month" (client-side over the
existing filter engine).

**Booking workspace** — The centerpiece; full spec in §7.

**Pipeline (Enquiries)** — Stage-grouped list (default) with the same dense table; stage chips
clickable as filters; Convert button per row (§3.1). The enquiry form keeps its current modal for
quick capture — capture should stay fast; it's *conversion* that needed surgery.

**Customers** — List unchanged structurally (it already works); detail page becomes a mini-CRM:
linked (clickable!) bookings/enquiries/payments timeline, lifetime value, referral chain
(`referredById` already modeled). Keep dedicated-page editing — and migrate other entities *toward*
this paradigm rather than the reverse.

**Payments** — Adds a money-state header (Received today/this week · Pending cheques · Outstanding
across upcoming events) above the table; rows link to bookings; ledger drawer per booking (§8).

**Venues (Halls)** — Administrative CRUD stays; add per-hall occupancy strip (next 30 days) on the
hall row — the calendar data already supports it.

**Menu Library** — Tabs gain Ingredients & Vendors (M7). The template-menu editor reuses the
workspace's inline menu-section pattern instead of its own variant.

**Reports** — Inherits the old dashboard's KPI cards/charts. Otherwise unchanged.

**Settings** — Users/Roles/Activity Log tabs. Role editor gains a *preview pane*: pick a role →
see the nav and actions it produces (pure client-side simulation against `routeAccess.ts`).
Permission grid gets human grouping (already partially done via `SUBJECT_ORDER`).

**Login/Profile** — Fine as-is; profile gains active-session info surface only if already available.

---

## 5. Status system redesign (fixes R7)

One chip is not enough for a two-dimensional truth. Statuses split into **lifecycle** × **hold**:

- **Lifecycle (filled chip)**: `Enquiry` · `Quoted` · `Confirmed` · `Completed` · `Cancelled`
  — directly from `status`/enquiry status; no new states.
- **Hold modifier (outlined chip, only when present)**:
  - `◔ Pencil · 2d 4h` — countdown from `pencilExpiresAt` (logic already in
    `VenueTimelineBoard.tsx:123`), turning amber <48h, red <12h. Shown **everywhere** the booking
    appears: list, calendar, workspace, Today.
  - `Quotation` — when `isQuotation`, shown *alongside* lifecycle, never replacing it
    (today's badge hides confirmed-ness, `bookings/page.tsx:5187`).
- **Financial state is never encoded in the status chip** — it has its own column/indicator (Due
  amount with a paid-progress underline, as `BookingCard`'s PaymentBar already draws).

Color system (consistent across list/calendar/workspace): Confirmed = solid green; Pencil = amber
diagonal stripe (the calendar's `--cal-stripe` hatch pattern already exists — reuse it as the
*global* tentative texture); Quoted = blue outline; Cancelled = gray strikethrough; Completed =
neutral checked. Hatching = "not firm" becomes a single learned visual rule.

---

## 6. Hall availability redesign (mission-critical surface)

### 6.1 The Availability Board

A new mode of the existing calendar day view (not a new backend): **date × hall × slot answer grid**.

```
Jun 14, 2026          Morning      Afternoon    Evening      Night
Bika 1 / Hall A       ████ FREE    ████ FREE    ▨▨▨ PENCIL   ████ FREE
                                                "Mehta Sangeet"
                                                expires in 31h
Bika 1 / Hall B       ████ FREE    ■■■ BOOKED   ■■■ BOOKED   ████ FREE
                                   "Sharma Wedding · 800 pax · confirmed"
Rangoli / Main        ◌ EXTERNAL   ████ FREE    ████ FREE    ████ FREE
                      Google: "Corporate offsite" (does not block)
```

- Slot buckets reuse the board's existing `SLOTS` model (`VenueTimelineBoard.tsx:15`).
- Cell states: **Free** (actionable: Book / Hold) · **Pencil** (stripe + countdown + owner) ·
  **Booked** (solid + function name + status) · **External** (§6.4) · **Couldn't load** (§6.3 —
  never rendered as Free).
- Optional party-size input dims halls whose `capacity + floatingCapacity` is insufficient.
- Tap Free → §3.2 booking flow with everything pre-filled.

### 6.2 Zero-ambiguity reading rules

- Solid = blocks the hall. Striped = blocks *until the printed expiry*. Dotted/ghost = informational
  only. The legend states these as guarantees, in words: *"Striped holds expire automatically at the
  shown time."*
- Every board carries the freshness stamp (§7.2). A board that can't prove freshness shows it.

### 6.3 The availability check chip (fixes R1 — highest-priority single change)

In the booking workspace, the clash check becomes a persistent three-state chip next to the
date/halls section, replacing the appear/disappear banner:

- ✅ **`Verified free · 14:32:05`** — green, timestamped on every successful check.
- ⏳ **`Checking…`** — while the debounced call is in flight.
- ⚠️ **`Couldn't verify availability — Retry`** — red, persistent, with retry button, whenever the
  check *fails* (network/server error). The current `catch { setHallClashWarnings([]) }` path
  renders this state instead of clearing.
- ❌ **`Clash: "Sharma Wedding" 18:00–22:00 · Hall A`** — the existing warning content, kept.

Save remains allowed in the ⚠ state (the server still hard-blocks), but the button relabels to
"Save (availability unverified)" so the operator's mental model matches reality.

### 6.4 External (Google) event grammar (fixes R4)

- Distinct rendering everywhere: dotted border, no fill, globe glyph, and an explicit suffix label
  **"external — does not block"** in tooltip and peek panel. Never status-colored.
- If selected halls/venue + date in the workspace overlap a fetched Google event, show an *advisory*
  (not blocking) amber note: *"A Google Calendar event overlaps this slot at Rangoli. Verify
  manually."* The events are already fetched and time-parsed for the board — this is reuse.
- **[backend dependency]** True blocking or import-to-booking conversion would need server work;
  the advisory removes the *silent* failure mode meanwhile.

---

## 7. Booking workspace redesign (the operational cockpit)

### 7.1 From modal-stack to page

`/dashboard/bookings/[id]` (and `/new`). The deep-link query pattern the calendar already uses
proves the form is navigable; this gives it a real address (audit problem #2).

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Bookings   Sharma Wedding · Confirmed · [◔ Pencil 31h]               │
│   v3 (editing) · Saved 14:32 ✓ · ● Live          [Finalize] [⋯]        │
├──────────────┬──────────────────────────────────────┬─────────────────┤
│ RAIL         │ CANVAS (sections, inline edit)       │ CONTEXT PANEL   │
│ Event        │ ▸ Event — name, type, date, customer │ Availability    │
│ Halls & time │ ▸ Halls & Times — per-pack hall/slot │  chip + mini    │
│ Packs & menus│   grid + §6.3 chip pinned here       │  day strip      │
│ Financials   │ ▸ Packs & Menus — dense pack table;  │ Money summary   │
│ Payments     │   menu edits expand INLINE (no modal)│  (server-live)  │
│ History      │ ▸ Financials — totals, discounts     │ Activity feed   │
│              │ ▸ Payments — embedded ledger (§8)    │  (audit + SSE)  │
└──────────────┴──────────────────────────────────────┴─────────────────┘
```

- The pack table keeps its excellent column structure (`Meal · Banquet · Hall · Time · Menu · PAX ·
  Rate/Plate · Hall Rate · Amount`) but lives in a page with room to breathe at ≥768px instead of
  only ≥1280px inside a modal (R11).
- Menu editing expands in place beneath the pack row (the two-pane picker UI is reused, un-nested).
  Quick-add-item becomes an inline row in the picker, ending modal³.
- Context panel keeps availability and money state visible *while* editing — the two things staff
  currently lose sight of.

### 7.2 Sync visibility system (fixes R6) — global, not just here

A single connection chip in the app header, fed by the existing `useSSE` lifecycle:

- `● Live` (green) — stream open.
- `◐ Reconnecting…` (amber) — backoff in progress.
- `○ Offline — showing data as of 14:21` (red) — after N failed attempts; every live surface
  (calendar, lists, workspace context panel) shows its own "as of" stamp inherited from this state.

Rule: **no surface may look live while the stream is down.**

### 7.3 Save confidence system (fixes R5, R8)

- **Save-state pill** in the workspace header, always one of:
  `Unsaved changes` (amber dot) → `Saving…` → `Saved 14:32 ✓` → `Save failed — Retry` (red,
  persistent until resolved). The toast remains, but the pill is the source of truth that survives
  the toast's 4 seconds.
- **Leave guards**: `beforeunload` while dirty + in-app route guard (the modal's dirty-confirm logic
  generalizes to navigation).
- **Local draft retention**: form state snapshotted to device storage every few seconds while dirty;
  on reopen after a crash/kill: *"You have an unsaved draft of this booking from 14:28 — Restore /
  Discard."* Client-only; mirrors how the palette already uses localStorage.
- **Per-row payment receipts**: because saves fan out (booking → N payment calls), each pending
  ledger row shows its own state (`queued → saved ✓ / failed ↻`). A partial failure reads as
  *exactly which row* failed instead of a generic error toast over restored-but-stale form state.

### 7.4 Concurrent-edit safety (fixes R2, R3) — client-only first

Using only the SSE events the client already receives (`booking:updated` carries the id):

- If the open booking receives an update event **while the form is clean** → auto-refresh silently
  (current behavior, kept).
- **While dirty** → a non-dismissable banner at the top of the canvas:
  *"This booking was changed by someone else at 14:31 (payments / packs). Review changes before
  saving — your save would overwrite theirs."* with [Review] (opens read-only current-server-state
  side-by-side) and [Reload — discard my edits].
- The money summary in the context panel is **always server-state**, refreshed on events even while
  the form is dirty — eliminating the stale-due-quoted-to-customer failure (R3) without touching
  the form's dirty fields.
- **[backend dependency]** True conflict *prevention* needs an `updatedAt` precondition (409). The
  UX above already removes the *silent* overwrite; the 409 turns the banner into a hard stop later.

### 7.5 Action-consequence safety (destructive actions)

| Action | Today | Redesigned safeguard |
|---|---|---|
| Cancel booking | confirm dialog | One click + **15s undo toast** (soft-cancel already; status flip back is the undo) |
| Hard delete booking | confirm | Typed confirmation ("type the function name"), admin-only, shows linked payments count |
| Finalize | browser `confirm()` | **Review sheet**: the already-computed `formDiff` (added/removed menu items, rate changes) + financial summary + "creates locked v3 snapshot" explainer → confirm |
| Party-over | form | Same review-sheet pattern + explicit "this becomes read-only" |
| Payment edit | silent in-place | Edit opens as **correction**: old value struck through in the row, "corrected by <user> 14:31" annotation (client renders from the response; **[backend dependency]** for a persisted audit entry) |
| Template import over existing menu | confirm | Kept — already well-designed (it warns and diffs) |

No safeguard is added to reversible actions; speed is preserved.

---

## 8. Payments & financial confidence

### 8.1 Money-state header (everywhere money appears)

One canonical strip, identical math everywhere, always server-derived:

```
Total ₹4,50,000  −  Discount ₹25,000  =  Net ₹4,25,000
Received ₹3,00,000 (₹2,50,000 cleared · ₹50,000 cheques pending)   DUE ₹1,75,000
```

- "Cleared vs pending" elevates the ledger's existing cheque logic
  (`BookingPaymentsLedger.tsx:419-429`) from a footnote to the headline — the figure staff quote is
  the *cleared* due, and the UI says so.
- Settlement fields (party-over) render as a separate, clearly labeled final block — never mixed
  into running totals.

### 8.2 Ledger as the single payment surface

The booking workspace's Payments section and the Payments page drawer are the *same component*.
Append-only visual order (newest last), running balance column, receiver (`receivedBy`) shown.

### 8.3 Correction grammar (fixes R10)

Edits never replace silently: the row keeps its original value struck through with the correction
beneath and an attribution line. Money UIs earn trust by showing their scars.

---

## 9. Table system redesign (enterprise-grade)

One `DataTable` spec replacing per-page table markup (the shared primitives already exist; this
unifies them):

- **Density**: 36px rows (compact 32px toggle), 13px Inter, `font-variant-numeric: tabular-nums`,
  right-aligned numerals, currency symbol de-emphasized.
- **Structure**: sticky header; sticky first column on horizontal scroll; column visibility menu;
  per-column sort (existing `SortableHeader`) and inline header filters replacing the right-overlay
  FilterPanel (M2).
- **State in URL**: filters/sort/page serialize to query params — shareable, refresh-proof,
  consistent with the `?section=` convention.
- **Saved views**: named filter+sort+column sets per user (device storage), surfaced as tabs above
  the table.
- **Row interactions**: whole row click = open; hover (desktop) reveals an action cluster; ⌘-click
  = new tab (rows are real links now).
- **Keyboard**: ↑/↓ row focus, Enter open, `/` focus search — same keys everywhere.
- **Status & freshness**: two-axis chips (§5); "Updated 2m ago" relative column where it matters
  (bookings, payments).
- **Empty/loading**: existing EmptyState/Skeleton components retained.
- **Mobile**: the same column model renders the card view automatically (title/meta/figures slots)
  so card and table never drift (today `MobileBookingCard` and the table are hand-synced twins).

---

## 10. Mobile re-architecture (fixes R11, mobile safety)

Built on the existing Capacitor/safe-area/keyboard plumbing, which is good.

- **Nav**: 5 tabs (§2.2); context FAB; "More" as half-sheet.
- **Breakpoints**: the booking workspace's structured layout activates at `md` (768px) — tablets get
  the desktop-grade pack table, not phone cards. Phones get the rail as a horizontal section
  stepper: `Event → Halls & Times → Packs → Money → Payments`, one section per screen, sticky
  bottom bar with the save-state pill + primary action.
- **Touch floor**: 44px minimum interactive height globally on touch devices (web `.btn` is ~34px
  today); destructive icons never adjacent to primary actions in card action rows.
- **Reliability under pressure**:
  - Offline/Reconnecting chip is *more* prominent on mobile (staff on hotel Wi-Fi are the primary
    victims of R1/R6); forms in unverified-availability state show the §6.3 chip inline above the
    save bar.
  - Draft retention (§7.3) matters most here — Capacitor apps get killed in background routinely.
  - Swipe actions are confirm-on-release with undo, never instant-destructive.
  - Date/number fields use native pickers/keyboards (mostly already true via `type=` attributes).
- **Calendar on phone**: keep the purpose-built `MobileDay`/`MobileWeek` renderers; add the
  availability-board slot grid as the default phone view (slots collapse better than timelines on
  320–390px).
- **Tablet posture**: ≥768px uses desktop layouts with touch sizing — never phone layouts stretched.

---

## 11. Motion & interaction system

Fast, informative, never theatrical. The DOM already exposes `data-device-tier`
(`layout.tsx:456-466`) — low-tier devices get durations of 0.

| Pattern | Spec |
|---|---|
| Micro-interactions (hover, press, chip changes) | 120ms ease-out, opacity/transform only |
| Panels & sheets (peek panel, More sheet) | 160–200ms ease-out slide + fade; no bounce |
| Save-state pill transitions | Color cross-fade 150ms; `Saved ✓` check draws in 200ms — the one deliberately *noticeable* animation, because it carries trust |
| Stale→fresh data swap | 250ms background highlight pulse on changed rows (SSE-driven), so live updates are perceived as live |
| Conflict/error banners | No animation in; instant. Errors must not "arrive gracefully" |
| Skeletons | Existing components; shimmer disabled on low tier |
| Reduced motion | `prefers-reduced-motion` collapses everything to instant state changes |

Keyboard system (desktop): `⌘K` palette (exists) · `N` new booking · `A` availability board ·
`/` search · `↑↓ Enter` table nav · `⌘S` save in workspace · `Esc` closes peeks/sheets (and gets
added to the modal primitive, which currently lacks it).

---

## 12. Three design directions

All three sit on the same IA, workflows, and reliability systems above; they differ in visual
language and emphasis.

### Direction 1 — Operational Command Center
*Philosophy*: the software is mission control; state legibility outranks warmth. Inspired by
Linear/incident-tooling.
*Visual language*: near-monochrome slate UI with a restrained teal accent (keeps current brand hue);
status colors are the only saturation on screen; 13px Inter + mono numerals; 1px borders, no
shadows; dark mode first-class (tokens already exist).
*Navigation*: icon rail + palette-first; Today is a status console (counts, risks, stream of
changes).
*Strengths*: fastest scanning; failures/staleness maximally conspicuous; cheapest to reach from the
current codebase (it's a disciplined tightening of what exists).
*Tradeoffs*: austere for customer-facing moments (showing a family their quote); learning curve for
keyboard grammar; can read "technical" to non-power staff.

### Direction 2 — Luxury Hospitality ERP
*Philosophy*: the tool should feel like the venues it manages — composed, warm, premium — without
sacrificing density.
*Visual language*: ivory/charcoal surfaces, brass/gold accent reserved for confirmed-revenue
moments; a serif display face for event names and customer names only (everything operational stays
Inter); hairline dividers, generous *horizontal* rhythm but unchanged row heights; print-parity
quotation/menu PDFs that look like an invitation suite (PDF pipeline already exists).
*Navigation*: labeled sidebar (closest to today), softer chips, photography allowed on venue cards
only.
*Strengths*: brand pride; quotes/menus shown to customers feel premium; gentlest transition for
existing staff.
*Tradeoffs*: warm palettes compress status-color contrast — requires discipline so amber/red
warnings stay unmistakable; serif display costs vertical rhythm; slowest to "feel different" in
daily ops.

### Direction 3 — Power User Dense Interface
*Philosophy*: the list *is* the app. Airtable/spreadsheet DNA: maximum rows, inline edit, views as
the primary navigation.
*Visual language*: 32px rows, visible grid lines, cell-level editing in lists (PAX, dates, status
transitions inline where permissions allow), saved views as tabs, batch selection + bulk actions;
chrome nearly disappears.
*Navigation*: two levels only — entity switcher + view tabs; workspace opens as a right-hand
split-screen panel rather than a route, so the list never leaves the screen.
*Strengths*: highest throughput for back-office (accounts, admin season-planning); fewest
navigations per task.
*Tradeoffs*: inline editing multiplies concurrent-edit exposure — it *requires* §7.4's conflict
visibility (and realistically the 409 backend dependency) before it is safe; weakest on phones;
densest learning curve.

**Recommendation**: Direction 1 as the system core, borrowing Direction 2's print/PDF treatment for
customer-facing artifacts. It maximizes the reliability goals this redesign exists for, at the
lowest distance from the current code. Direction 3's saved views and inline status transitions can
be layered onto it later for back-office roles.

---

## 13. Sequencing by risk (what to design/build first)

1. **§6.3 check chip + §7.2 sync chip + §7.3 save pill** — kills R1, R5, R6, R8: the trust layer.
2. **§5 status system** — kills R7; pure presentation.
3. **Booking workspace page (§7)** — unlocks links, side-by-side, tablet layout; carries §7.4/§7.5.
4. **Availability Board (§6.1) + availability-first flow (§3.2)** — the mission-critical surface.
5. **Pipeline + Convert prefill (§3.1)** — biggest click-saver.
6. **Table system (§9) → list pages** — density + saved views.
7. **Mobile nav + tablet breakpoints (§10)**.
8. **Today screen (§4)** — most valuable once the chips/statuses it aggregates exist.
9. **Directions pass (§12)** — full visual-language application.
