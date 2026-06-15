# Booking Form Billing Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two booking-form billing defects: (1) the server rejects hall-only packs because catering-off sends `packCount/noOfPack = 0`, and (2) editing a booking trusts a stale stored net amount, producing a phantom discount.

**Architecture:** Bug 1 is a one-line zod relaxation per field on the server (the downstream code already coerces `0 → 1` safely). Bug 2 makes the **discount** the billing invariant instead of the absolute net: the recalc helper carries the discount (% or ₹) across line-item changes, and edit-load derives net from the stored discount applied to the live meals subtotal. Both tasks are independent and independently shippable.

**Tech Stack:** TypeScript, zod, Next.js/React (client hook). Server tests: `jest` + `ts-jest`. Client/shared tests: `vitest`.

---

## Background — what's broken (verified file:line facts)

**Bug 1 (BLOCKER):** Catering off → client sends `packCount: 0, noOfPack: 0` ([useBookingForm.tsx:1742-1743](../../../client/src/app/dashboard/bookings/_hooks/useBookingForm.tsx)). Server schema is `z.number().min(1).optional()` at:
- `server/src/controllers/booking.write.ts:91` (`noOfPack`, createBookingSchema)
- `server/src/controllers/booking.write.ts:92` (`packCount`, createBookingSchema)
- `server/src/controllers/booking.write.ts:180` (`noOfPack`, updateBookingSchema)
- `server/src/controllers/booking.write.ts:181` (`packCount`, updateBookingSchema)

`.optional()` allows the field to be *absent*, but a present `0` fails `.min(1)` → `"Number must be greater than or equal to 1"`. The persistence layer already coerces with `Math.max(1, ...)` at `booking.write.ts:370/410-411` (create) and `:1213/1251-1252` (update), so accepting `0` is safe — it becomes `1` downstream.

> Out of scope: `enquiry.controller.ts:77-78` has the same `.int().min(1).optional()` pattern for a different feature (enquiries). Not touched here. Flagged for a follow-up if enquiries hit the same error.

**Bug 2 (money):** On edit-load, `finalAmount` is set from the stored `booking.finalAmountValue` with only `Math.max(0, payable - extras)` — no clamp against the live meals subtotal:
- `useBookingForm.tsx:1387-1399` inside `openEditBooking`
- `useBookingForm.tsx:1465-1481` inside `applyBookingToForm`

Load also sets `setDiscountManuallySet(true)` (`:1438`) which disables the auto-recalc guard (`:1014`). Result: a stored net larger than the current subtotal is shown raw, and discount (`total − net`) fakes a value.

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `server/src/controllers/booking.write.ts` | Booking create/update zod schemas | Modify 4 lines: `.min(1)` → `.min(0)` |
| `server/src/__tests__/booking-schema.test.ts` | Schema-level validation tests | Create |
| `client/src/lib/booking-form/billing-recalc.ts` | Billing recalc/load helpers | Add `resolveLoadedNetAmount` |
| `client/src/lib/booking-form/__tests__/billing-recalc.test.ts` | Unit tests for recalc/load helpers | Add cases |
| `client/src/app/dashboard/bookings/_hooks/useBookingForm.tsx` | Booking form hook | Use helper in 2 load closures |

---

## Task 1: Server accepts `packCount`/`noOfPack` = 0 (Bug 1, the blocker)

**Files:**
- Test: `server/src/__tests__/booking-schema.test.ts` (create)
- Modify: `server/src/controllers/booking.write.ts:91-92` and `:180-181`

- [ ] **Step 1: Write the failing test**

Create `server/src/__tests__/booking-schema.test.ts`:

```ts
import { createBookingSchema, updateBookingSchema } from '../controllers/booking.write';

// A hall-only pack: catering disabled => client sends packCount/noOfPack = 0.
const hallOnlyPack = {
  packName: 'Lunch',
  packCount: 0,
  noOfPack: 0,
  ratePerPlate: 0,
  hallRate: '32500',
  menu: { name: 'Lunch Menu', items: [] },
};

const createBody = {
  customerId: 'cust1',
  functionName: 'Wedding',
  functionType: 'Reception',
  functionDate: '2026-07-01',
  functionTime: '12:00',
  expectedGuests: 100,
  packs: [hallOnlyPack],
};

describe('booking schemas — hall-only packs (catering disabled)', () => {
  it('createBookingSchema accepts packCount/noOfPack = 0', () => {
    expect(() => createBookingSchema.parse({ body: createBody })).not.toThrow();
  });

  it('updateBookingSchema accepts packCount/noOfPack = 0', () => {
    expect(() => updateBookingSchema.parse({ body: { packs: [hallOnlyPack] } })).not.toThrow();
  });

  it('still rejects negative pack counts', () => {
    const badPack = { ...hallOnlyPack, packCount: -1 };
    expect(() => createBookingSchema.parse({ body: { ...createBody, packs: [badPack] } })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && npx jest src/__tests__/booking-schema.test.ts`
Expected: FAIL — the two "accepts 0" cases throw `ZodError` with `"Number must be greater than or equal to 1"` on `packs.0.noOfPack` / `packs.0.packCount`. The "rejects negative" case passes.

- [ ] **Step 3: Relax the schema in createBookingSchema**

In `server/src/controllers/booking.write.ts`, lines 91-92, change:

```ts
      noOfPack: z.number().min(1).optional(),
      packCount: z.number().min(1).optional(),
```

to:

```ts
      noOfPack: z.number().min(0).optional(),
      packCount: z.number().min(0).optional(),
```

- [ ] **Step 4: Relax the schema in updateBookingSchema**

In the same file, lines 180-181, apply the identical change (`.min(1)` → `.min(0)` for both `noOfPack` and `packCount`).

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd server && npx jest src/__tests__/booking-schema.test.ts`
Expected: PASS (all 3 cases).

- [ ] **Step 6: Run the existing financial test to confirm no regression**

Run: `cd server && npx jest src/__tests__/booking-financials.test.ts`
Expected: PASS — confirms the `Math.max(1, ...)` downstream coercion (the `'uses zero packCount when pax is zero'` case) is unaffected.

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/booking.write.ts server/src/__tests__/booking-schema.test.ts
git commit -m "fix(booking): accept packCount/noOfPack 0 for hall-only packs

Catering-off sends packCount/noOfPack=0; schema .min(1) rejected it even
though the write path already coerces 0 -> 1 via Math.max. Relax to .min(0)."
```

---

## Task 2: Make the discount the invariant, not the absolute net (Bug 2)

**Decision (from the user):** the **discount % is the anchor**. When line items change, net tracks the new total at the same discount: 10% on ₹12,000 ⇒ net ₹10,800; on ₹8,000 ⇒ ₹7,200; **0% ⇒ net = total**. Integer `roundRupee` rounding (existing rule).

**Root cause:** `recalcBillingWhenMealsSubtotalChanges` carries the *absolute net* (`prev.finalAmount`) forward in `finalAmount` mode ([billing-recalc.ts:27-35](../../../client/src/lib/booking-form/billing-recalc.ts)). A fixed net + a rising total ⇒ the gap becomes a phantom discount (the ₹100,000-total/₹10,000-net demo). Fix: **never carry the net; carry the discount** — % when set, otherwise the ₹ discount amount (including 0). Separately, edit-load writes `finalAmount` raw from the stored value ([useBookingForm.tsx:1387-1399](../../../client/src/app/dashboard/bookings/_hooks/useBookingForm.tsx), `:1465-1481`); derive it from the stored discount applied to the live subtotal so the ₹65,000-stale display self-heals on open.

This keeps flat-₹ discounts working (0% + ₹ amount ⇒ net = subtotal − amount) and matches the existing `billing-recalc.test.ts` percent/amount cases — only the never-tested `finalAmount`-lock path changes.

**Files:**
- Modify: `client/src/lib/booking-form/billing-recalc.ts` (rewrite recalc body; add `resolveLoadedBillingAmounts`)
- Test: `client/src/lib/booking-form/__tests__/billing-recalc.test.ts`
- Modify: `client/src/app/dashboard/bookings/_hooks/useBookingForm.tsx` (`openEditBooking` ~1379-1399, `applyBookingToForm` ~1457-1481)

### Part A — recalc carries the discount, not the net

- [ ] **Step 1: Add the failing test for the no-discount lock**

Add to `client/src/lib/booking-form/__tests__/billing-recalc.test.ts` (keep the 3 existing cases — they still pass):

```ts
it('net tracks the new subtotal when there is no discount (no finalAmount lock)', () => {
  // The 100000-total / 10000-net demo: 0% discount, finalAmount-mode loaded net.
  const prev = { finalDiscountPercent: '0', finalDiscountAmount: '0', finalAmount: '10000' };
  const next = recalcBillingWhenMealsSubtotalChanges(prev, 100000, 'finalAmount');
  expect(next.finalAmount).toBe('100000');
  expect(next.finalDiscountAmount).toBe('0');
});

it('upscales net by the discount % when the total rises', () => {
  const prev = { finalDiscountPercent: '10', finalDiscountAmount: '1000', finalAmount: '9000' };
  const next = recalcBillingWhenMealsSubtotalChanges(prev, 12000, 'finalAmount');
  expect(next.finalAmount).toBe('10800');
  expect(next.finalDiscountAmount).toBe('1200');
});

it('downscales net by the discount % when the total drops', () => {
  const prev = { finalDiscountPercent: '10', finalDiscountAmount: '1000', finalAmount: '9000' };
  const next = recalcBillingWhenMealsSubtotalChanges(prev, 8000, 'finalAmount');
  expect(next.finalAmount).toBe('7200');
});
```

- [ ] **Step 2: Run the test to verify the new cases fail**

Run: `cd client && npx vitest run --config vitest.config.ts src/lib/booking-form/__tests__/billing-recalc.test.ts`
Expected: FAIL — the no-discount case returns `'10000'` (locked net) instead of `'100000'`; the upscale case returns `'9000'`/`'386...'` family instead of `'10800'`.

- [ ] **Step 3: Rewrite the recalc body to carry the discount**

Replace the body of `recalcBillingWhenMealsSubtotalChanges` in `client/src/lib/booking-form/billing-recalc.ts` (lines 17-36). Keep the signature (callers pass `amountSyncMode`; it is now unused — prefix with `_`):

```ts
/**
 * When meals subtotal changes (pack rate/pax edit), the DISCOUNT is the invariant —
 * never the absolute net. Carry the % when one is set (net scales by %), otherwise
 * carry the rupee discount (incl. 0 => net tracks the new subtotal). This stops a
 * stale/locked net from faking a discount.
 */
export function recalcBillingWhenMealsSubtotalChanges(
  prev: BillingFieldsSnapshot,
  mealsSubtotal: number,
  _amountSyncMode: BillingAmountSyncMode
): SyncedBillingAmounts {
  const percentSource = prev.finalDiscountPercent?.trim() ?? '';
  const percentNum = Number(percentSource);
  const hasPercent =
    percentSource !== '' && Number.isFinite(percentNum) && percentNum > 0;

  if (hasPercent) {
    return syncBillingAmounts('discountPercent', prev.finalDiscountPercent, mealsSubtotal);
  }
  return syncBillingAmounts('discountAmount', prev.finalDiscountAmount || '0', mealsSubtotal);
}
```

- [ ] **Step 4: Run the test to verify all cases pass**

Run: `cd client && npx vitest run --config vitest.config.ts src/lib/booking-form/__tests__/billing-recalc.test.ts`
Expected: PASS — the 3 pre-existing cases plus the 3 new ones.

### Part B — derive net from the stored discount on edit-load

- [ ] **Step 5: Add the failing test for the load helper**

Add to the same test file:

```ts
import { resolveLoadedBillingAmounts } from '../billing-recalc';

describe('resolveLoadedBillingAmounts', () => {
  it('derives net from a stored percent against the live subtotal', () => {
    const a = resolveLoadedBillingAmounts(10, 1000, 12000);
    expect(a.finalAmount).toBe('10800');
    expect(a.finalDiscountAmount).toBe('1200');
    expect(a.finalDiscountPercent).toBe('10');
  });

  it('no discount => net equals the live subtotal (heals a stale stored net)', () => {
    // The 65000-stale booking: 0% / 0 discount, current subtotal 32500.
    const a = resolveLoadedBillingAmounts(0, 0, 32500);
    expect(a.finalAmount).toBe('32500');
    expect(a.finalDiscountAmount).toBe('0');
  });

  it('preserves a flat rupee discount when no percent is set', () => {
    const a = resolveLoadedBillingAmounts(0, 5000, 32500);
    expect(a.finalAmount).toBe('27500');
    expect(a.finalDiscountAmount).toBe('5000');
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `cd client && npx vitest run --config vitest.config.ts src/lib/booking-form/__tests__/billing-recalc.test.ts`
Expected: FAIL — `resolveLoadedBillingAmounts is not a function`.

- [ ] **Step 7: Implement the load helper**

Append to `client/src/lib/booking-form/billing-recalc.ts`:

```ts
/**
 * Billing amounts to load for an existing booking. The discount is the source of
 * truth: net is recomputed from the stored discount applied to the live meals
 * subtotal, so a stale stored net can never show an inflated value or a phantom
 * discount. Prefer the stored percent; fall back to the stored rupee discount.
 */
export function resolveLoadedBillingAmounts(
  discountPercentage: number | string | null | undefined,
  discountAmount: number | string | null | undefined,
  mealsSubtotal: number
): SyncedBillingAmounts {
  const pct = Number(discountPercentage) || 0;
  if (pct > 0) {
    return syncBillingAmounts('discountPercent', String(pct), mealsSubtotal);
  }
  const amt = Math.max(0, Number(discountAmount) || 0);
  return syncBillingAmounts('discountAmount', String(amt), mealsSubtotal);
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `cd client && npx vitest run --config vitest.config.ts src/lib/booking-form/__tests__/billing-recalc.test.ts`
Expected: PASS (all cases).

- [ ] **Step 9: Use the load helper in `openEditBooking`**

In `client/src/app/dashboard/bookings/_hooks/useBookingForm.tsx`, add `resolveLoadedBillingAmounts` to the existing import from `@/lib/booking-form/billing-recalc`. Just before the `loadedFormData` object literal (after `nextPacks` is built), add:

```ts
      const loadedBilling = resolveLoadedBillingAmounts(
        booking.discountPercentage,
        booking.discountAmount,
        computeMealsSubtotal(nextPacks)
      );
```

Then replace the three amount fields at lines 1379-1399 (`finalDiscountAmount`, `finalDiscountPercent`, `finalAmount` — currently three separate closures) with:

```ts
        finalDiscountAmount: loadedBilling.finalDiscountAmount,
        finalDiscountPercent: loadedBilling.finalDiscountPercent,
        finalAmount: loadedBilling.finalAmount,
```

Leave `setDiscountManuallySet(true)` at line 1438 as-is — recalc now does the right thing regardless of that flag.

- [ ] **Step 10: Use the load helper in `applyBookingToForm`**

Replace the three amount fields at lines 1457-1481 inside the `setFormData((prev) => ...)` updater. Packs in scope are `prev.packs`:

```ts
        finalDiscountAmount: (() => {
          const a = resolveLoadedBillingAmounts(
            booking.discountPercentage ?? prev.finalDiscountPercent,
            booking.discountAmount ?? prev.finalDiscountAmount,
            computeMealsSubtotal(prev.packs)
          );
          return a.finalDiscountAmount;
        })(),
        finalDiscountPercent: (() => {
          const a = resolveLoadedBillingAmounts(
            booking.discountPercentage ?? prev.finalDiscountPercent,
            booking.discountAmount ?? prev.finalDiscountAmount,
            computeMealsSubtotal(prev.packs)
          );
          return a.finalDiscountPercent;
        })(),
        finalAmount: (() => {
          const a = resolveLoadedBillingAmounts(
            booking.discountPercentage ?? prev.finalDiscountPercent,
            booking.discountAmount ?? prev.finalDiscountAmount,
            computeMealsSubtotal(prev.packs)
          );
          return a.finalAmount;
        })(),
```

> Note: `roundRupee` may become unused in the two old closures you removed. Do not delete its import without grepping the file — it is referenced elsewhere in this hook.

- [ ] **Step 11: Run the full booking-form unit suite**

Run: `cd client && npm run test:unit:booking-form`
Expected: PASS — `billing-recalc`, `discount-scenario`, `snapshot-to-form`, and all other booking-form suites.

- [ ] **Step 12: Typecheck the client**

Run: `cd client && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 13: Commit**

```bash
git add client/src/lib/booking-form/billing-recalc.ts \
        client/src/lib/booking-form/__tests__/billing-recalc.test.ts \
        client/src/app/dashboard/bookings/_hooks/useBookingForm.tsx
git commit -m "fix(booking): carry discount, not absolute net, across edits

Recalc held the absolute net fixed in finalAmount mode, so raising line items
dumped the gap into a phantom discount; edit-load also trusted a stale stored
net. Make the discount the invariant: net = subtotal adjusted by % (0% => net
== subtotal), and derive net on load from the stored discount."
```

### Manual verification (do after Task 2)

- [ ] **Step 14: Reproduce the original demo manually**

Open an existing booking, disable all meals, enable only lunch, set hall rate ₹100,000.
Expected: Total = ₹100,000, **Net = ₹100,000, Discount = ₹0** (no phantom discount). Then set Disc % = 10 → Net = ₹90,000. Change hall rate to ₹120,000 → Net = ₹108,000.

---

## Self-Review

- **Spec coverage:** Bug 1 → Task 1 (4 schema lines + tests). Bug 2 → Task 2: recalc carries the discount not the net (Part A) + edit-load derives net from stored discount (Part B). User's %-anchor rule (10% ⇒ 10800/7200, 0% ⇒ net=total) covered by Steps 1 and 5 tests + Step 14 manual check. Enquiry parity → flagged out of scope.
- **Placeholder scan:** none — every step has concrete code, exact paths, and runnable commands with expected output.
- **Type consistency:** `resolveLoadedBillingAmounts(discountPercentage, discountAmount, mealsSubtotal): SyncedBillingAmounts` defined once (Step 7), called identically in Steps 9 and 10. `recalcBillingWhenMealsSubtotalChanges` keeps its existing 3-arg signature. `syncBillingAmounts`, `computeMealsSubtotal`, `SyncedBillingAmounts`, `BillingAmountSyncMode` all come from `@bika/booking-core` (already imported in both files).

## Execution Handoff

Tasks 1 and 2 are independent. Task 1 (the blocker) can ship alone. Task 2's two parts (A: recalc, B: load) are best landed together but each is independently testable.
