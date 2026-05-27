# Agent instructions — Bika Banquet

General coding behavior below applies to **all** work in this repo. **Booking** rules are additional — follow both.

> **Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## General behavior (all tasks)

### 1. Think before coding

Do not assume. Do not hide confusion. Surface tradeoffs.

Before implementing:

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what is confusing. Ask.

### 2. Simplicity first

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No “flexibility” or “configurability” that was not requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask: *Would a senior engineer call this overcomplicated?* If yes, simplify.

### 3. Surgical changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Do not “improve” adjacent code, comments, or formatting.
- Do not refactor things that are not broken.
- Match existing style, even if you would do it differently.
- If you notice unrelated dead code, mention it — do not delete it unless asked.

When your changes create orphans:

- Remove imports/variables/functions **your** changes made unused.
- Do not remove pre-existing dead code unless asked.

**Test:** Every changed line should trace directly to the user’s request.

### 4. Goal-driven execution

Define success criteria. Loop until verified.

| Request | Success criteria |
|---------|------------------|
| Add validation | Tests for invalid inputs, then make them pass |
| Fix a bug | Test reproduces bug, then passes |
| Refactor X | Tests pass before and after |

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]  
2. [Step] → verify: [check]  
3. [Step] → verify: [check]  

Strong criteria (“net equals total minus discount after Submit”) let you verify independently. Weak criteria (“make it work”) need constant clarification.

**These guidelines work when:** diffs stay small, fewer rewrites from over-engineering, and questions come **before** implementation — not after mistakes.

---

## Booking form — project-specific

Read before changing the **booking form**, booking billing, payments, or `server/src/controllers/booking.*`.

Also read: `docs/superpowers/plans/booking-form-integrity.md`, `.cursor/agents/booking-form-integrity.md`.

### Architecture (why it breaks easily)

The booking UI is **not** one billing engine. Layers must stay aligned:

| Layer | Location |
|-------|----------|
| Row + footer totals | `client/src/lib/booking-form/billing-lines.ts` |
| Form UI | `client/src/app/dashboard/bookings/page.tsx` (large — minimal edits only) |
| Save (create/update) | `server/src/controllers/booking.write.ts` |
| Recalc / finalize | `server/src/controllers/booking.shared.ts`, `booking.financials.ts` |

Fixing one layer without the others regresses Submit / Finalize.

### Billing invariants (never regress)

1. **Per pack (meal row):** `Amount = catering + one hallRate`  
   - Catering ≈ `ratePerPlate × pax` (+ setup/extras when used).  
   - **Hall rate is once per pack**, never × number of halls selected.

2. **Footer pre-discount Total** = sum of enabled pack row amounts + additional items (extras).

3. **Halls association:** `buildBookingHallRows` → `charges: 0`. Hall money lives on pack `hallRate` / `hallRateValue`.

4. **Server save:** `sumBookingLines` must receive every pack via `mapPackLineForSumBooking()` (includes `hallRate` / `hallRateValue`). Same rules on create, update, and `recalculateBookingFinancials`.

5. **Net / due:** Must not exceed bill total (ceiling). When the client does not send `finalAmount`, server derives net from computed `grandTotal`, not a stale plates-only total.

6. **After save:** Reload payments (and discount/net/due) from `GET /bookings/:id`. Do not duplicate `POST` for payments that already have a server `id`.

7. **Payments on new version:** Payments are not copied per version by design. Do not zero `paymentReceivedAmount` across versions unless product explicitly asks.

### Testing

| Suite | Command | What it guards |
|-------|---------|----------------|
| Client unit | `cd bika-banquet/client && npm run test:unit:booking-form` | Row/footer math, ceiling, payments/template helpers |
| Server unit | `cd bika-banquet/server && npm test -- --testPathPatterns=booking` | `sumBookingLines`, `mapPackLineForSumBooking`, discount/ceiling |
| E2E (optional) | `cd bika-banquet/client && npm run test:e2e:booking-form` | Payments no duplicate; template import (needs DB + auth) |

**CI:** `.github/workflows/booking-form-integrity.yml` on scoped PR paths.

**Gaps (manual smoke required):** full HTTP Submit with `hallRate`, Finalize snapshot, version clone + payments.

**Before merge:**

```bash
cd bika-banquet/client && npm run test:unit:booking-form
cd bika-banquet/server && npm test -- --testPathPatterns=booking
```

**Manual smoke (when E2E skipped):**

1. Lunch + dinner with hall rates → Total = sum of row amounts.  
2. **Submit** → Net = Total − discount (no drop to ~₹7–8L when bill is ~₹21L).  
3. **Finalize** → history Amount Summary matches.  
4. Save twice with payments → no duplicate payment rows.

### Booking work style

| Do | Avoid |
|----|--------|
| One focused task per PR | “Refactor booking form” / large `page.tsx` rewrites |
| Change helpers + server mapper together | UI-only total changes |
| Preserve invariants; run tests | Declaring done without verification |
| State plan + verify checks | Silent multi-layer edits |

### Prompt stub (booking tasks)

```
Read bika-banquet/AGENTS.md (general + booking sections) and docs/superpowers/plans/booking-form-integrity.md.
Minimal diff. hallRate in sumBookingLines on save; row = catering + one hallRate.
Plan with verify steps. Run test:unit:booking-form and server booking tests.
Explain what changed, which invariant you tested, and why Submit/Finalize stay safe.
```
