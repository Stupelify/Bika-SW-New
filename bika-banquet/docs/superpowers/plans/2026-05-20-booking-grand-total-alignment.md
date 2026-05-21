# Booking Grand Total Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the booking form’s subtotal, discount, grand total, and due amount match what the server persists via `sumBookingLines` + discount logic, so pre-submit preview equals post-submit `booking.grandTotal`.

**Architecture:** Add a client-side pure module `bookingFinancials.ts` that mirrors `server/src/controllers/booking.helpers.ts` (`sumBookingLines` + discount rules). Refactor `bookings/page.tsx` to build the same hall/pack/additional line shapes as `doSaveBooking` before summing. Grand Total becomes a single `subtotal − discount` value (extras inside subtotal, not added again). Fix edit-load so `finalAmount` is not double-counted with extras.

**Tech Stack:** Next.js 14, React, TypeScript, Express, Prisma, Jest (server tests only)

---

## Root Cause Summary (for implementers)

| Bug | Client today | Server truth |
|-----|--------------|--------------|
| Subtotal base | `totalPackAmount` (hall baked per pack, no setup/extra) | `sumBookingLines(halls, packs, additionalItems)` |
| Discount base | `totalPackAmount` only | Full `totalAmount` |
| Grand Total | `finalAmount + extras` | `totalAmount − discountAmount` |
| Edit reload | `finalAmount` ≈ `grandTotal`, then + extras again | `grandTotal` already includes extras |
| Shared hall | Hall summed per pack row | `Math.max` per `hallId` in `hallsPayload` |

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `client/src/lib/bookingFinancials.ts` | **Create** | Canonical client billing: build lines, sum, apply discount |
| `client/src/lib/bookingFinancials.parity.md` | **Create** | Human-readable parity contract vs server (vectors) |
| `server/src/controllers/booking.helpers.ts` | Modify | Export `applyBookingDiscount`, optional `roundMoney` export |
| `server/src/__tests__/booking-financials.test.ts` | Modify | Discount + hall-dedup + parity vectors |
| `client/src/app/dashboard/bookings/page.tsx` | Modify | Wire helpers; fix memos, effects, display, load, history |
| `client/src/components/BookingFinancialSummary.tsx` | **Out of scope** | Uses different pack-only formula — see Risks |

---

## Potential Problems (read before coding)

### P1 — Semantic change for “Net Amount” row
After fix, **Net Amount** = discounted **full bill** (same as Grand Total when extras are in subtotal). Users who treated Net Amount as “packs only after discount” will see Net Amount jump when extras exist. **Mitigation:** Label row “Grand Total (after discount)” or hide redundant Net row if it equals Grand Total.

### P2 — Existing DB rows stay as-is; only display/sync fixes
Server `grandTotal` on old bookings was computed correctly (mostly). Wrong numbers were **form preview** and **reopen form** double-count. List/calendar were already server-backed. **Risk:** Users think “fix didn’t work” if they compare to memory of wrong form number.

### P3 — Multi-pack, one hall
Per-pack **row** amount in grid can still show `hallRate + catering` for UX, but **footer totals** must use deduped hall map. Row subtotal ≠ sum of row footers if two packs share a hall — document in UI tooltip or accept.

### P4 — `discountPercentage > 0` wins on server
If both % and ₹ set, server recomputes ₹ from %. Client `applyBookingDiscount` must match. Editing ₹ while % > 0 gets overwritten on save.

### P5 — `BookingFinancialSummary` (Tab 2) still pack-only
`discRate * packCount` ignores halls, extras, setup. **Do not** use that component’s “Total Discounted Amount” to validate form Grand Total. Separate follow-up plan if needed.

### P6 — Party over / `computeTotalBilledAmount`
History/party-over helpers in `page.tsx` (~3991, ~4266) use old pack formula. Version diff may show false “amount changed” until those use `booking.totalAmount` from API.

### P7 — Partial PATCH update
`updateBooking` without `packs`/`halls`/`additionalItems` recalculates from DB. Client must **reload** booking after save so form matches server.

### P8 — `discountManuallySet` reset on pack change
When packs change and discount was manual, effect resets `finalAmount` to `totalPackAmount` (line ~1386). Must reset to **new `totalBillAmount` − discount** or clear discount consistently.

### P9 — No client Jest today
Client has no `npm test`. Parity enforced via server tests + shared vectors in markdown. Manual QA checklist required.

### P10 — Floating point
Server uses `safeMoney` (2 dp). Client must use same rounding in `bookingFinancials.ts` or off-by-0.01 on large bookings.

---

## Task 1: Server — `applyBookingDiscount` + tests

**Files:**
- Modify: `server/src/controllers/booking.helpers.ts`
- Modify: `server/src/__tests__/booking-financials.test.ts`

- [ ] **Step 1: Write failing tests for discount helper**

Append to `server/src/__tests__/booking-financials.test.ts`:

```typescript
import { sumBookingLines, applyBookingDiscount } from '../controllers/booking.helpers';

describe('applyBookingDiscount', () => {
  it('applies percent discount when percent > 0', () => {
    const { discountAmount, grandTotal } = applyBookingDiscount(10000, 10, 999);
    expect(discountAmount).toBe(1000);
    expect(grandTotal).toBe(9000);
  });

  it('uses fixed discount when percent is 0', () => {
    const { discountAmount, grandTotal } = applyBookingDiscount(10000, 0, 1500);
    expect(discountAmount).toBe(1500);
    expect(grandTotal).toBe(8500);
  });

  it('never returns negative grand total', () => {
    const { grandTotal } = applyBookingDiscount(100, 0, 500);
    expect(grandTotal).toBe(0);
  });
});

describe('sumBookingLines hall dedup scenario', () => {
  it('counts each hall once when multiple pack lines reference catering only', () => {
    const result = sumBookingLines({
      halls: [{ charges: 5000 }],
      packs: [
        { ratePerPlate: 100, packCount: 50, noOfPack: null, setupCost: 0, extraCharges: 0 },
        { ratePerPlate: 80, packCount: 30, noOfPack: null, setupCost: 0, extraCharges: 0 },
      ],
      additionalItems: [{ charges: 200, quantity: 1 }],
    });
    // 5000 + 5000 + 2400 + 200 = 12600
    expect(result).toBe(12600);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npm test -- --testPathPattern=booking-financials
```

Expected: `applyBookingDiscount is not a function` or import error.

- [ ] **Step 3: Implement `applyBookingDiscount` in `booking.helpers.ts`**

Add after `sumBookingLines` (export `safeMoney` as `roundMoney` or keep internal):

```typescript
export function applyBookingDiscount(
  totalAmount: number,
  discountPercentage: number,
  discountAmountInput: number
): { discountAmount: number; grandTotal: number } {
  const total = safeMoney(totalAmount);
  const pct = Number.isFinite(discountPercentage) ? Math.max(0, discountPercentage) : 0;
  let discountAmount = safeMoney(discountAmountInput);
  if (pct > 0) {
    discountAmount = safeMoney((total * pct) / 100);
  }
  discountAmount = Math.min(discountAmount, total);
  const grandTotal = safeMoney(Math.max(0, total - discountAmount));
  return { discountAmount, grandTotal };
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- --testPathPattern=booking-financials
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/booking.helpers.ts server/src/__tests__/booking-financials.test.ts
git commit -m "feat: add applyBookingDiscount helper with tests"
```

---

## Task 2: Client — `bookingFinancials.ts` (mirror server)

**Files:**
- Create: `client/src/lib/bookingFinancials.ts`
- Create: `client/src/lib/bookingFinancials.parity.md`

- [ ] **Step 1: Create parity contract doc**

`client/src/lib/bookingFinancials.parity.md`:

```markdown
# Parity with server `booking.helpers.ts`

Must stay line-logic aligned with:
- `sumBookingLines`
- `applyBookingDiscount`

Vectors (server Jest is source of truth):
1. halls 5000+3000, pack 100×50+500+200, additional 150×4 → 14300
2. discount 10% on 10000 → grand 9000
3. halls 5000, packs 5000+2400, additional 200 → 12600
```

- [ ] **Step 2: Create `bookingFinancials.ts`**

```typescript
// client/src/lib/bookingFinancials.ts
// KEEP IN SYNC with server/src/controllers/booking.helpers.ts

export interface HallLine { charges: number }
export interface PackLine {
  ratePerPlate: number;
  packCount: number;
  noOfPack?: number | null;
  setupCost: number;
  extraCharges: number;
}
export interface AdditionalLine { charges: number; quantity: number }

function roundMoney(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100) / 100;
}

function safeNum(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function sumBookingLines(input: {
  halls: HallLine[];
  packs: PackLine[];
  additionalItems: AdditionalLine[];
}): number {
  const hallTotal = input.halls.reduce((s, h) => s + roundMoney(h.charges), 0);
  const packTotal = input.packs.reduce((s, p) => {
    const count = Math.max(1, safeNum(p.packCount ?? p.noOfPack ?? 1));
    return (
      s +
      roundMoney(p.ratePerPlate) * count +
      roundMoney(p.setupCost) +
      roundMoney(p.extraCharges)
    );
  }, 0);
  const additionalTotal = input.additionalItems.reduce(
    (s, a) => s + roundMoney(a.charges) * Math.max(1, safeNum(a.quantity ?? 1)),
    0
  );
  return roundMoney(hallTotal + packTotal + additionalTotal);
}

export function applyBookingDiscount(
  totalAmount: number,
  discountPercentage: number,
  discountAmountInput: number
): { discountAmount: number; grandTotal: number } {
  const total = roundMoney(totalAmount);
  const pct = Number.isFinite(discountPercentage) ? Math.max(0, discountPercentage) : 0;
  let discountAmount = roundMoney(discountAmountInput);
  if (pct > 0) {
    discountAmount = roundMoney((total * pct) / 100);
  }
  discountAmount = Math.min(discountAmount, total);
  const grandTotal = roundMoney(Math.max(0, total - discountAmount));
  return { discountAmount, grandTotal };
}

/** Same dedup logic as doSaveBooking hallChargeMap */
export function buildHallLinesFromPackRows(
  entries: Array<{
    withHall: boolean;
    hallIds: string[];
    hallRate: string;
  }>,
  isValidHallId: (hallId: string) => boolean
): HallLine[] {
  const map = new Map<string, number>();
  entries.forEach((entry) => {
    if (!entry.withHall) return;
    const validIds = entry.hallIds.filter(isValidHallId);
    if (validIds.length === 0) return;
    const charge = Math.max(0, safeNum(Number(entry.hallRate)));
    validIds.forEach((hallId) => {
      map.set(hallId, Math.max(map.get(hallId) ?? 0, charge));
    });
  });
  return Array.from(map.values()).map((charges) => ({ charges }));
}

export function buildPackLinesFromRows(
  rows: Array<{
    withCatering: boolean;
    ratePerPlate: string;
    pax: string;
    setupCost?: string;
    extraCharges?: number;
  }>
): PackLine[] {
  return rows.map((row) => ({
    ratePerPlate: row.withCatering ? Math.max(0, safeNum(Number(row.ratePerPlate))) : 0,
    packCount: Math.max(1, safeNum(Number(row.pax || '1'))),
    noOfPack: null,
    setupCost: row.setupCost ? safeNum(Number(row.setupCost)) : 0,
    extraCharges: row.extraCharges ?? 0,
  }));
}

export function buildAdditionalLines(
  rows: Array<{ amount: string }>
): AdditionalLine[] {
  return rows
    .map((r) => ({
      charges: Math.max(0, safeNum(Number(r.amount || '0'))),
      quantity: 1,
    }))
    .filter((r) => r.charges > 0);
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/bookingFinancials.ts client/src/lib/bookingFinancials.parity.md
git commit -m "feat: add client bookingFinancials mirror of server sumBookingLines"
```

---

## Task 3: `page.tsx` — canonical `totalBillAmount` + `grandTotal` memos

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx`

- [ ] **Step 1: Import helpers at top of file**

```typescript
import {
  sumBookingLines,
  applyBookingDiscount,
  buildHallLinesFromPackRows,
  buildPackLinesFromRows,
  buildAdditionalLines,
} from '@/lib/bookingFinancials';
```

(Use relative path `../../../lib/bookingFinancials` if `@/` alias missing.)

- [ ] **Step 2: Add `billingLines` useMemo (after `formData`, halls, enabled packs)**

Inside `BookingsPage`, add helper reused by save + display:

```typescript
const enabledPackEntriesForBilling = useMemo(
  () =>
    (Object.keys(formData.packs) as PackKey[])
      .map((key) => ({ key, row: formData.packs[key] }))
      .filter((e) => e.row.enabled),
  [formData.packs]
);

const billingSnapshot = useMemo(() => {
  const isValidHallId = (hallId: string, banquetId: string) =>
    halls.some(
      (h) => h.id === hallId && (!banquetId || h.banquet?.id === banquetId)
    );

  const hallLines = buildHallLinesFromPackRows(
    enabledPackEntriesForBilling.map((e) => ({
      withHall: e.row.withHall,
      hallIds: e.row.hallIds.filter((id) =>
        isValidHallId(id, e.row.banquetId)
      ),
      hallRate: e.row.hallRate,
    })),
    () => true
  );

  const packLines = buildPackLinesFromRows(
    enabledPackEntriesForBilling.map((e) => ({
      withCatering: e.row.withCatering,
      ratePerPlate: e.row.ratePerPlate,
      pax: e.row.pax,
      setupCost: e.row.setupCost,
      extraCharges: e.row.extraCharges,
    }))
  );

  const additionalLines = buildAdditionalLines(formData.additionalRequirements);

  return { hallLines, packLines, additionalLines };
}, [enabledPackEntriesForBilling, formData.additionalRequirements, halls]);

const totalBillAmount = useMemo(
  () =>
    sumBookingLines({
      halls: billingSnapshot.hallLines,
      packs: billingSnapshot.packLines,
      additionalItems: billingSnapshot.additionalLines,
    }),
  [billingSnapshot]
);

const billingTotals = useMemo(() => {
  const discountPercent = toNonNegativeNumber(formData.finalDiscountPercent || '0');
  const discountAmountInput = toNonNegativeNumber(formData.finalDiscountAmount || '0');
  const { discountAmount, grandTotal } = applyBookingDiscount(
    totalBillAmount,
    discountPercent,
    discountAmountInput
  );
  return { discountAmount, grandTotal };
}, [
  totalBillAmount,
  formData.finalDiscountPercent,
  formData.finalDiscountAmount,
  toNonNegativeNumber,
]);
```

- [ ] **Step 3: Replace old `totalBillAmount` useMemo**

Remove:

```typescript
const totalBillAmount = useMemo(
  () => totalPackAmount + totalAdditionalRequirementsAmount,
  ...
);
```

Keep `totalPackAmount` only for per-pack grid display / validation (`belowHallRate`), not for bill totals.

- [ ] **Step 4: Fix due-amount `useEffect` (~935–941)**

Replace:

```typescript
const netAmount = parseFloat(formData.finalAmount || '0') || totalPackAmount;
const grandTotal = netAmount + totalAdditionalRequirementsAmount;
```

With:

```typescript
const grandTotal = billingTotals.grandTotal;
```

Dependency array: add `billingTotals.grandTotal`, remove `totalPackAmount` / `totalAdditionalRequirementsAmount` for due calc.

- [ ] **Step 5: Commit**

```bash
git add client/src/app/dashboard/bookings/page.tsx
git commit -m "refactor: derive totalBillAmount and grandTotal from billingFinancials"
```

---

## Task 4: Discount sync uses `totalBillAmount`

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx` (~1344–1388, ~959–1001)

- [ ] **Step 1: Change `normalizeAmountSnapshot` callers**

Every `normalizeAmountSnapshot(..., totalPackAmount)` → `normalizeAmountSnapshot(..., totalBillAmount)`:

- Discount row onChange handlers (~3371, 3392, 3417)
- Mobile discount handlers (~3744, 3749, 3754)
- Auto-recalc `useEffect` (~1357)
- Comment ~1356: change to “Discount applied to full bill (halls + packs + extras)”

- [ ] **Step 2: Fix manual-discount reset effect (~1381–1387)**

Replace:

```typescript
finalAmount: formatComputedAmount(totalPackAmount),
```

With:

```typescript
finalAmount: formatComputedAmount(totalBillAmount),
```

Change effect deps from `totalPackAmount` to `totalBillAmount`.

- [ ] **Step 3: Update `doSaveBooking` normalization (~2339–2350)**

```typescript
const normalizedDiscountAmount = Math.min(
  totalBillAmount,
  Math.max(0, toNumber(formData.finalDiscountAmount || '0'))
);
const normalizedFinalAmount = billingTotals.grandTotal;
```

(Server recalculates anyway; this makes `internalNotes` accurate.)

- [ ] **Step 4: Commit**

```bash
git add client/src/app/dashboard/bookings/page.tsx
git commit -m "fix: apply discount to full bill subtotal not pack-only"
```

---

## Task 5: UI — Grand Total display + Net Amount semantics

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx` (~3523–3536, ~3757–3765, ~3400–3423)

- [ ] **Step 1: Desktop Grand Total row**

Replace IIFE:

```typescript
const netAmount = parseFloat(formData.finalAmount || '0') || totalPackAmount;
const grandTotal = netAmount + totalAdditionalRequirementsAmount;
```

With:

```typescript
const grandTotal = billingTotals.grandTotal;
```

- [ ] **Step 2: Mobile Grand Total block** — same replacement.

- [ ] **Step 3: Net Amount input — sync to `grandTotal`**

`onBlur` / `normalizeAmountSnapshot('finalAmount', ...)` still works if `total` arg is `totalBillAmount`.

Optional: set displayed Net Amount value to `formatComputedAmount(billingTotals.grandTotal)` when not drafting (`netAmountDraft === null`) so field matches footer.

Update `aria-label` / `title` to “Amount after discount (includes extras)”.

- [ ] **Step 4: Add Subtotal row (optional but reduces confusion)**

Above Discount row, one line:

```tsx
<tr className="bg-[var(--surface)]">
  <td colSpan={7} />
  <td className="px-2 py-1.5 text-right text-xs font-semibold text-[var(--text-2)]">Bill Subtotal</td>
  <td className="px-2 py-1.5 text-right text-xs font-bold">₹{totalBillAmount.toLocaleString('en-IN')}</td>
</tr>
```

- [ ] **Step 5: Commit**

```bash
git add client/src/app/dashboard/bookings/page.tsx
git commit -m "fix: show grand total as subtotal minus discount without double extras"
```

---

## Task 6: Edit load — stop double-counting extras

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx` (~2049–2053)

- [ ] **Step 1: Load `finalAmount` from server grand total**

Replace:

```typescript
finalAmount:
  booking.finalAmount ||
  (booking.grandTotal !== null && booking.grandTotal !== undefined
    ? String(booking.grandTotal)
    : '0'),
```

With:

```typescript
finalAmount: (() => {
  const gt =
    booking.finalAmountValue ??
    booking.grandTotal ??
    booking.finalAmount;
  if (gt !== null && gt !== undefined) return String(gt);
  const ta = booking.totalAmount ?? booking.totalBillAmountValue;
  if (ta != null) return String(ta);
  return '0';
})(),
```

Discount fields stay from `booking.discountAmount` / `booking.discountPercentage`.

- [ ] **Step 2: After load, verify `billingTotals.grandTotal` matches `booking.grandTotal`**

If mismatch > 0.01 (legacy bad rows), prefer **server** `booking.grandTotal` for display and toast once:

```typescript
// dev-only or console.warn in openEditBooking after setFormData
```

No auto-mutation of DB in this task.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/dashboard/bookings/page.tsx
git commit -m "fix: load edit form finalAmount from server grandTotal"
```

---

## Task 7: `calculatePackAmount` — include setup/extra for row display only

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx` (~887–894)

- [ ] **Step 1: Extend row calculator (display only)**

```typescript
const calculatePackAmount = useCallback(
  (row: BookingPackRow): number => {
    const hallRate = row.withHall ? toNonNegativeNumber(row.hallRate) : 0;
    const ratePerPlate = row.withCatering ? toNonNegativeNumber(row.ratePerPlate) : 0;
    const pax = row.withCatering ? toNonNegativeNumber(row.pax) : 0;
    const setup = toNonNegativeNumber(row.setupCost || '0');
    const extra = row.extraCharges ?? 0;
    return hallRate + ratePerPlate * pax + setup + extra;
  },
  [toNonNegativeNumber]
);
```

**Do not** use this sum for `totalBillAmount` (halls would double-count vs `billingSnapshot`).

- [ ] **Step 2: Commit**

```bash
git add client/src/app/dashboard/bookings/page.tsx
git commit -m "fix: pack row display includes setup and extra charges"
```

---

## Task 8: History diff — use server `totalAmount`

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx` (~3987–3994)

- [ ] **Step 1: Prefer API total for history bill**

Replace `histTotalPackAmount` reduce with:

```typescript
const histTotalBill =
  Number(resolved?.totalAmount ?? resolved?.totalBillAmountValue ?? hist?.totalAmount ?? NaN);
const histTotalPackAmount = Number.isFinite(histTotalBill)
  ? histTotalBill
  : historyPacks.reduce(/* existing fallback reduce */);
```

Remove `histTotalBill = histTotalPackAmount + histTotalAdditional` double-add if `histTotalBill` already from server.

- [ ] **Step 2: Commit**

```bash
git add client/src/app/dashboard/bookings/page.tsx
git commit -m "fix: booking history diff uses server totalAmount"
```

---

## Task 9: Manual verification checklist

- [ ] **Step 1: New booking — packs + extras + 10% discount**

1. Enable lunch: hall ₹5000, 50 pax @ ₹100, setup ₹500, extra ₹200.
2. Add extra item ₹600.
3. Subtotal expect: `5000 + 5000+200 + 600 = 10600` (single hall).
4. 10% discount → Grand Total **9540**.
5. Submit → list column Grand Total **9540**.

- [ ] **Step 2: Two packs, same hall**

1. Lunch + dinner, same hall ₹5000 each row.
2. Subtotal hall counted **once** ₹5000 (not 10000).
3. Submit matches.

- [ ] **Step 3: Reopen edited booking**

1. Open booking from Step 1.
2. Form Grand Total still **9540** (not 9540+600).

- [ ] **Step 4: Due amount**

1. Add payment ₹2000.
2. Due = Grand Total − 2000.

- [ ] **Step 5: Server tests**

```bash
cd server && npm test -- --testPathPattern=booking-financials
```

Expected: PASS.

- [ ] **Step 6: Client lint**

```bash
cd client && npm run lint
```

---

## Task 10 (optional follow-up): Align `BookingFinancialSummary`

**Not required for grand-total fix.** Track separately if Tab 2 “discounted amount” must match form.

---

## Spec Coverage Self-Review

| Requirement | Task |
|-------------|------|
| Client subtotal = `sumBookingLines` | 2, 3 |
| Discount on full bill | 4 |
| Grand total = subtotal − discount | 3, 5 |
| No double extras on reload | 6 |
| Hall dedup | 2, 3 |
| setup/extra in server totals | 2, 7 (display) |
| Tests | 1, 9 |
| History diff | 8 |
| Risks documented | Potential Problems |
| BookingFinancialSummary | Task 10 optional |

**Placeholder scan:** None.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-05-20-booking-grand-total-alignment.md`.

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.

**2. Inline Execution** — run tasks in this session with executing-plans checkpoints.

Which approach?
