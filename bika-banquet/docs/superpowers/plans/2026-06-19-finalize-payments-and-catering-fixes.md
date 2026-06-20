# Finalize Payments + Catering-Off Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do **not** start the backfill (Task 4) until Tasks 1–3 are merged and deployed.

**Goal:** Fix two booking defects:
1. **Payments vanish on finalize.** Creating a new booking version (finalize / party-over / "save as new version") starts the new version with **zero payments** and **due reset to the full bill**, as if nothing was ever paid.
2. **Catering-off still stores pax = 1 and lets you open the menu.** Turning catering off should make pax/rate **0** and disable the menu, but the server floors pax back to `1` and the "Set menu…" button stays clickable.

**Architecture (one rule):** *Payments follow the booking event, not a single draft version.* The payment ledger lives on the `isLatest` row — that is already a hard invariant (payments can only be **written** to `isLatest`, see `booking.payments.ts:127,228`). The only correct way to honour that across versions is to **move** the rows forward when a new version is created and **recompute** received/due from the real rows. We fix this at the single choke point (`cloneBookingVersion`) so finalize, party-over, and manual versioning all behave identically. No schema migration, no new tables, no versioning redesign.

**Tech Stack:** TypeScript, Prisma, Express. Shared math in `@bika/booking-core` (`resolvePaymentTotals`, `resolvePayableTotal`). Server tests: `jest` + `ts-jest`. Client/shared tests: `vitest`.

---

## Decisions locked (from review interview, 2026-06-19)

| Decision | Choice |
|---|---|
| Move vs copy payments | **Move** (sum-neutral; copy would double staff-stats `count` and global sums) |
| Backfill scope | **Full chain consolidation** — sweep **all** non-latest versions' payments onto the latest, even chains where latest already holds some |
| Old/finalized version payment **ledger** display | **Aggregates are enough** — no client change; old versions show stored received/due, not an itemized live list |
| Catering-off pax storage | **Zero both** `packCount` and `noOfPack`; keep the `≥1` floor **only when catering is ON** |

---

## Background — verified file:line facts

### Bug 1 — payments reset on clone

`cloneBookingVersion` (`server/src/controllers/booking.shared.ts:472-644`) creates the new version with hard-coded empties and never moves the rows:

- `booking.shared.ts:538-541` — `paymentReceivedAmount/Value = 0`, `dueAmount/Value = replicaPayable` (the **full** bill).
- `booking.shared.ts:629-632` — comment claims the summary is "carried forward", but the code above sets `0`. The comment is stale; the bug is real.

Callers (all route through `cloneBookingVersion`):
- Finalize — `booking.write.ts:696`
- Party-over — `booking.write.ts:904`
- "Save as new version" — `booking.write.ts:1055` (gated by `data.createNewVersion`, not every edit)

Why **move** (not copy), proven from code:
- Payments may only be written to `isLatest` (`booking.payments.ts:127,228`). Carrying only the *number* without the rows breaks on the next add, because every recalc reads rows fresh via `resolvePaymentTotals(final, dbPayments)` (`booking.payments.ts:152-170,250-268`; `booking.shared.ts:712-735`).
- Staff stats = `bookingPayments.count({ where: { receivedBy } })` (`user.controller.ts:411`). A **moved** row keeps its `id` + `receivedBy` → count unchanged. A **copied** row → doubled.
- No revenue report sums payment **rows** globally; dashboards read the booking-level `paymentReceivedAmountValue`. Move is sum-neutral.

Why finalized history stays safe under a move:
- Finalize/party-over write the frozen JSON **before** the clone: `recalculateBookingFinancials` → `fetchBookingSnapshot` → `toJsonSnapshot` into `FinalizedBooking.data` (`booking.write.ts:660-689`, `:876-897`), and the snapshot include (`BOOKING_RELATION_INCLUDE`) **contains payments** (`booking.shared.ts:397`).
- Version history reads that frozen JSON (`booking.read.ts:404` → `snapshotData`); the diff helper consumes `snapshotData` (`client/.../version-history.ts:91-127`). Moving live rows off the old version does not corrupt the frozen record.

### Bug 2 — catering-off pax floored to 1

- **Client is already correct.** When catering is off the form sends `packCount: 0, noOfPack: 0, ratePerPlate: 0` (`useBookingForm.tsx:1707-1709`), and untick already clears menu/pax/rate via `clearedCateringFieldsPatch()` (`useBookingForm.tsx:846-855`, `pack-catering.ts:46-58`). Schema already accepts `0` (`booking.write.ts:91-92,180-181`, relaxed in commit `0a3f7d1`).
- **Server stomps it back to 1.** Both write paths floor with `Math.max(1, …)`:
  - Create: `booking.write.ts:370-373` (`normalizedPackCount`) and `:410` (`noOfPack`).
  - Update: `booking.write.ts:1213-1216` and `:1251`.
  Commit `0a3f7d1`'s own message notes the write path "already coerces 0 → 1 via Math.max" — only the schema was relaxed, not the persistence.
- **Menu button not gated.** Pax/rate inputs are disabled when `!withCatering` (`BookingPackTable.tsx:325,338`; `BookingPackMobileCards.tsx:195,201`), but the "Set menu…" button has **no** `disabled` guard (`BookingPackTable.tsx:301-316`; mobile `BookingPackMobileCards.tsx:~185-188`).
- **Storing 0 is billing-safe.** Billing is `rate × count` (multiplication); `booking.financials.ts` never divides by pax. With catering off, `rate = 0`, so the bill is `0` whether pax is `0` or `1` — the bug is data-hygiene + a clickable menu, not a wrong bill.

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `server/src/controllers/booking.shared.ts` | `cloneBookingVersion` | Move payments to clone + recompute received/due; delete stale comment; add `resolvePaymentTotals` import |
| `server/src/controllers/booking.write.ts` | Pack create/update persistence | Conditional floor: `≥1` only when catering on, else allow `0` (4 sites: `:370-373`, `:410`, `:1213-1216`, `:1251`) |
| `client/.../BookingPackTable.tsx` | Desktop pack row | Gate "Set menu…" button with `!row.withCatering` |
| `client/.../BookingPackMobileCards.tsx` | Mobile pack card | Gate menu button with `!row.withCatering` |
| `server/src/scripts/backfillFinalizePayments.ts` | One-time data repair | **Create** — audit + consolidate payments + catering-pax legacy fix |
| `server/src/__tests__/clone-moves-payments.test.ts` | Clone payment behaviour | **Create** |
| `server/src/__tests__/booking-pack-catering.test.ts` | Catering-off persistence | Extend (file exists) |
| `client/.../__tests__/pack-catering.test.ts` | Menu-gating helper (if extracted) | Extend (file exists) |

---

## Task 1 — `cloneBookingVersion` moves payments and recomputes due (Bug 1)

**Files:** `server/src/controllers/booking.shared.ts`; test `server/src/__tests__/clone-moves-payments.test.ts`.

- [ ] **Step 1: Failing test.** With a source booking that has e.g. `payable = 1_400_000` and two payment rows summing `500_000`, assert that after `cloneBookingVersion`:
  - the clone has **2 payment rows** (same ids, same `receivedBy`),
  - the **source** has **0** payment rows,
  - clone `paymentReceivedAmountValue === 500_000` and `dueAmountValue === 900_000`,
  - a cheque row with a future `clearingDate` counts toward `grossReceived` but **not** toward `credited`/due (mirror `resolvePaymentTotals`).

- [ ] **Step 2: Implementation.** In `cloneBookingVersion`, after the pack loop, **replace** the stale comment block (`:629-632`) with a move + recompute, and import the helper.

```ts
// booking.shared.ts — imports
import { resolvePayableTotal, resolvePaymentTotals } from '@bika/booking-core';

// ...inside cloneBookingVersion, replacing lines 629-632:

// Payments follow the booking EVENT, not a single draft version. They may only
// ever be recorded on the isLatest row (booking.payments.ts), so the ledger is
// moved forward to the new version and received/due are recomputed from the
// real rows. The prior version's payments are already frozen into
// FinalizedBooking.data before this clone runs (finalize/party-over).
await tx.bookingPayments.updateMany({
  where: { bookingId: source.id },
  data: { bookingId: clonedBooking.id },
});

const movedPayments = await tx.bookingPayments.findMany({
  where: { bookingId: clonedBooking.id },
  select: { method: true, amount: true, clearingDate: true },
});
const { grossReceived, dueAmount } = resolvePaymentTotals(replicaPayable, movedPayments);

await tx.booking.update({
  where: { id: clonedBooking.id },
  data: {
    paymentReceivedAmount: toStoredNumberString(grossReceived),
    paymentReceivedAmountValue: grossReceived,
    dueAmount: toStoredNumberString(dueAmount),
    dueAmountValue: dueAmount,
  },
});
```

  The create block at `:538-541` may keep its `0` / full-due initial values (they are overwritten by the update above) **or** be left as-is for the no-payments case; either way the final `findUnique` (`:634`) re-hydrates the clone with moved rows + corrected fields. `replicaPayable` is already computed at `:502`.

- [ ] **Step 3: Verify call sites need no change.**
  - Finalize (`booking.write.ts:678-696`): snapshot is written before the clone → frozen JSON keeps payments. ✅
  - Party-over (`:876-935`): clone returns `completedReplica` hydrated **with** moved rows, so `toJsonSnapshot(completedReplica)` (`:932`) freezes them too. Payments end up on the `completed` (latest) row; further edits are blocked by `bookingIsImmutable`. ✅
  - createNewVersion (`:1048-1056`): old row marked `isLatest:false`, payments move to the new latest. ✅

**Success:** `clone-moves-payments.test.ts` green; finalize/party-over/new-version e2e show received/due preserved on the new latest version.

---

## Task 2 — Server persists pax = 0 when catering is off (Bug 2, server)

**Files:** `server/src/controllers/booking.write.ts` (create `:370-373,410`; update `:1213-1216,1251`); test `server/src/__tests__/booking-pack-catering.test.ts` (exists).

- [ ] **Step 1: Failing test.** Posting a hall-only pack (`ratePerPlate: 0`, `packCount: 0`, `noOfPack: 0`, empty menu) persists `packCount === 0 && noOfPack === 0`. Posting a catering pack (`ratePerPlate: 500`, `packCount: 0`) still floors to `1` (defensive — catering can't have 0 pax).

- [ ] **Step 2: Implementation (apply identically in both create and update blocks).**

```ts
// Floor pax to >=1 only when catering is ON; a catering pack always has rate > 0
// (validatePackCateringForSave enforces rate >= MIN_CATERING_RATE_PER_PLATE).
// Hall-only / catering-off rows send rate 0 and must persist pax 0.
const cateringOn = toSafeMoney(pack.ratePerPlate) > 0;
const rawCount = toSafeNumber(pack.packCount ?? pack.noOfPack ?? 0);
const normalizedPackCount = cateringOn ? Math.max(1, rawCount) : Math.max(0, rawCount);
// ...
noOfPack: normalizedPackCount,
packCount: normalizedPackCount,
```

  This replaces the unconditional `Math.max(1, …)` at `:370-373` and the separate `noOfPack: Math.max(1, …)` at `:410` (and the mirror at `:1213-1216,1251`). Keeping both fields equal to `normalizedPackCount` removes the prior `packCount`/`noOfPack` divergence risk.

**Success:** catering-off pack reloads with pax 0; catering-on pack still floors to ≥1; bill unchanged (`rate × 0 = 0`).

---

## Task 3 — Disable "Set menu…" when catering is off (Bug 2, client UI)

**Files:** `client/.../components/booking/BookingPackTable.tsx:301-316`; `client/.../components/booking/BookingPackMobileCards.tsx` (menu button).

- [ ] **Step 1.** Add `disabled={!row.enabled || !row.withCatering}` to the desktop "Set menu…" button and apply the existing disabled styling (match the pax/rate inputs at `:325,338`). Optionally add `title="Turn on catering to set a menu"`.
- [ ] **Step 2.** Mirror on the mobile card menu button.
- [ ] **Step 3.** No handler change — untick already clears menu/pax/rate (`useBookingForm.tsx:846-855`). Read-only view (`BookingFormReadOnlyView.tsx`) unaffected.

**Success:** with catering off, the menu button is non-interactive on desktop and mobile; turning catering on re-enables it.

---

## Task 4 — One-time backfill (run only after Tasks 1–3 deploy)

**File:** `server/src/scripts/backfillFinalizePayments.ts` (new; matches `scripts/` convention, e.g. `normalizeEntryCase.ts`). Reuses `resolveVersionChain` (`booking.helpers.ts:11`), `resolvePayableTotal`, `resolvePaymentTotals`. **Idempotent. Audit-first.** Support `--dry-run` (default) and `--apply`.

### Repair A — consolidate scattered payments onto the latest version

Because payments could only ever be added to `isLatest`, each pre-fix finalize stranded the then-current payments on the version being frozen. A chain can therefore hold payments on several non-latest rows (v1 ₹2L, v2 ₹3L, v3 ₹0).

- [ ] **Audit (read-only):** count payment rows attached to `isLatest = false` bookings, and the number of distinct chains affected. Record the total ₹ about to move.
- [ ] **Apply (per chain, in a transaction):**
  1. For each `isLatest = true` booking, `chain = resolveVersionChain(latest.id)`.
  2. `nonLatestIds = chain` minus the latest; move every payment on those ids: `updateMany({ where: { bookingId: { in: nonLatestIds } }, data: { bookingId: latest.id } })`.
  3. Recompute on the latest: `resolvePaymentTotals(resolvePayableTotal(latest), latestPayments)` → update `paymentReceivedAmount/Value`, `dueAmount/Value`. (Same helper as live code — no hand-written SQL math.)
- [ ] **Idempotency:** a second run finds no payments on non-latest rows → no-op.
- [ ] **Re-audit:** assert `0` payment rows on `isLatest = false` bookings and `0` affected chains remaining.

> Iterate over **latest** rows (not raw payment rows) so a chain is consolidated exactly once and `resolveVersionChain` is called once per chain.

### Repair B — catering-off legacy pax (rate 0, no menu, pax 1)

- [ ] **Audit:** count `BookingPack` rows on **live** bookings (`booking.isLatest = true AND status != 'completed'`) where `ratePerPlate = 0` **AND** the pack's menu has **no items** **AND** (`packCount = 1 OR noOfPack = 1`). The rate-0 + no-menu guards prevent zeroing a real catering pack.
- [ ] **Apply:** set `packCount = 0, noOfPack = 0` for those packs, then `recalculateBookingFinancials(tx, bookingId)` per affected booking (bill is unchanged at rate 0, but keeps stored financials consistent).
- [ ] **Idempotency:** second run finds none (already 0).

**Success:** audit → apply on staging → verify in UI → apply on production → re-audit shows zero remaining for both repairs.

---

## Out of scope / accepted tradeoffs

- **No per-version live payment ledger for old versions.** Per the locked decision, we do **not** add a `snapshotData.payments` fallback. After the move, a non-latest version's **live** `payments` relation is empty; its stored `paymentReceivedAmountValue`/`dueAmountValue` and its frozen `FinalizedBooking.data` remain correct. The version-history **diff** already uses `snapshotData` (safe). Accepted consequence: any screen that lists a non-latest version's *live* payment rows will show none for historical versions. *(If this surfaces later, the fix is a small client read-fallback — no server rework.)*
- **No versioning redesign, no new "chain id" column, no schema migration.** Move is `UPDATE booking_payments SET bookingId = …`; pax 0 needs no DDL (`packCount Int` already accepts 0).
- **`resolvePaymentTotals` / payment ledger / save flow unchanged.** Behaviour is aligned, not rewritten.
- **Enquiry `.min(1)` pax pattern** (separate feature) untouched.

---

## Rollout & verification

1. **Ship code (Tasks 1–3)** behind normal review. Run full server (`jest`) + client/shared (`vitest`) suites.
2. **Manual e2e on staging:**
   - Add ₹5L to a ₹14L booking → Finalize → new version shows **received ₹5L, due ₹9L**, payment rows present; old version frozen view still shows ₹5L.
   - Party-over a paid booking → completed version holds the ledger; due correct; cannot add more payments.
   - Catering off on a pack → save → reload shows **pax 0, rate 0**, menu cleared, "Set menu…" disabled.
3. **Audit (read-only)** on production: record affected counts/₹ for Repair A and B.
4. **Backfill on staging** (`--apply`) → verify in UI → **production** (`--apply`) → **re-audit** → both zero.
5. Confirm dashboards (collections/received) reconcile against `paymentReceivedAmountValue` totals before/after (should be unchanged in aggregate — move is sum-neutral).

## Rollback

- **Code:** revert the PR. New clones revert to the old (buggy) reset; already-moved rows stay on the latest version (harmless — that's where they belong).
- **Backfill:** no destructive deletes; payments are reassigned, not removed. To undo, re-attach by chain from `FinalizedBooking.data` if ever required (not expected). Always run `--dry-run` and snapshot `booking_payments` (or take a DB backup) before `--apply` on production.

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Move empties old version's live ledger; a screen lists it | Low | Diff uses `snapshotData`; aggregates retained; flagged + cheap follow-up |
| Recompute mishandles cheque clearing | Low | Reuse `resolvePaymentTotals` (gross vs credited); covered by Task 1 test |
| Catering-on pack with pax 0 slips through | Low | Server floors ≥1 when `rate > 0`; covered by Task 2 test |
| Backfill double-moves / partial run | Low | Idempotent; per-chain transaction; iterate latest rows; re-audit gate |
| Repair B zeroes a real catering pack | Low | Guarded by `rate = 0` **and** no menu items; live rows only |

## Test matrix (new/extended)

- `clone-moves-payments.test.ts` — payment totals unit tests (always run)
- `clone-moves-payments.integration.test.ts` — row move + recompute (requires Postgres; CI via `RUN_INTEGRATION_TESTS=1`)
- `pack-count-persist.integration.test.ts` — hall-only pax=0 DB roundtrip (integration)
- `backfill-finalize-payments.test.ts` — audit/consolidate/idempotency with mocked prisma (always run)
- `booking-pack-catering.test.ts` (extend): catering-off persists 0; catering-on floors ≥1
- Regression: `booking-history.test.ts`, `booking-financials.test.ts`, `booking-schema.test.ts` stay green

Run integration locally: `cd server && npm run test:integration -- --testPathPatterns=clone-moves-payments|pack-count-persist`
