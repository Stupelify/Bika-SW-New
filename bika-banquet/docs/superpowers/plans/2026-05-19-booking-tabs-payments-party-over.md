# Booking Form Tabs — Payments & Party Over (Page 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the booking form modal into two tabs — "Booking Details" (existing content minus payments) and "Payments & Party Over" (new full-page payments ledger + financial summary + party over table).

**Architecture:** Add a tab bar to the existing `FormPromptModal` booking form. Extract payment state and party-over state into a new `BookingPageTwo` section rendered in Tab 2. Three new focused components: `BookingPaymentsLedger`, `BookingFinancialSummary`, `BookingPartyOverForm`. Add `clearingDate` and settlement fields via DB migration. Wire party-over submit to accept settlement data.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind/CSS vars, Prisma, PostgreSQL, Express/Zod

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `server/prisma/schema.prisma` | Modify | Add `clearingDate`, settlement fields |
| `server/src/controllers/booking.payments.ts` | Modify | Accept/store `clearingDate` |
| `server/src/controllers/booking.write.ts` | Modify | `partyOverBooking` accepts settlement data |
| `client/src/app/dashboard/bookings/page.tsx` | Modify | Tab shell, move payment section, remove party-over modal |
| `client/src/components/BookingPaymentsLedger.tsx` | Create | New payments ledger table component |
| `client/src/components/BookingFinancialSummary.tsx` | Create | Financial summary with due-date logic |
| `client/src/components/BookingPartyOverForm.tsx` | Create | Full Excel-style party over table |

---

## Task 1: DB Migration — clearingDate + settlement fields

**Files:**
- Modify: `server/prisma/schema.prisma`
- Run: Prisma migrate

- [ ] **Step 1: Add clearingDate to BookingPayments model in schema**

In `server/prisma/schema.prisma`, find `model BookingPayments` and add after `paymentDate`:

```prisma
model BookingPayments {
  id            String    @id @default(uuid())
  bookingId     String
  receivedBy    String
  amount        Float
  method        String
  paymentMethod String?
  reference     String?
  narration     String?
  paymentDate   DateTime  @default(now())
  clearingDate  DateTime?           // ← ADD THIS
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  booking       Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  receiver      User      @relation("PaymentReceiver", fields: [receivedBy], references: [id])

  @@index([bookingId])
  @@index([paymentDate])
  @@map("booking_payments")
}
```

- [ ] **Step 2: Add settlement fields to Booking model in schema**

In `server/prisma/schema.prisma`, find `model Booking`. After `discountPercentage2ndValue Float?` add:

```prisma
settlementDiscountPercent  Float?
settlementDiscountAmount   Float?
settlementTotalAmount      Float?
```

- [ ] **Step 3: Run migration**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server
npx prisma migrate dev --name add_clearing_date_and_settlement
```

Expected: Migration applied, `booking_payments` table has `clearing_date` column, `bookings` table has `settlement_discount_percent`, `settlement_discount_amount`, `settlement_total_amount`.

- [ ] **Step 4: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations
git commit -m "feat: add clearingDate to booking_payments and settlement fields to bookings"
```

---

## Task 2: Backend — accept clearingDate in payment handlers

**Files:**
- Modify: `server/src/controllers/booking.payments.ts`

- [ ] **Step 1: Add clearingDate to addPaymentSchema**

In `booking.payments.ts`, find `addPaymentSchema`. After `paymentDate` field, add:

```typescript
clearingDate: z
  .string()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: 'Clearing date must be a valid date',
  })
  .optional(),
```

- [ ] **Step 2: Pass clearingDate to prisma create in addPayment**

In `addPayment` function, destructure `clearingDate` from `req.body`:

```typescript
const { amount, method, reference, narration, paymentDate, clearingDate } = req.body;
```

In `tx.bookingPayments.create`, add:

```typescript
clearingDate: clearingDate ? new Date(clearingDate) : undefined,
```

- [ ] **Step 3: Add clearingDate to updatePaymentSchema**

In `updatePaymentSchema`, after `paymentDate` field, add:

```typescript
clearingDate: z
  .string()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: 'Clearing date must be a valid date',
  })
  .optional(),
```

- [ ] **Step 4: Pass clearingDate to prisma update in updatePayment**

In `updatePayment` function, destructure `clearingDate` from `req.body`:

```typescript
const { amount, method, narration, paymentDate, reference, clearingDate } = req.body;
```

In the `tx.bookingPayments.update` data, add:

```typescript
...(clearingDate !== undefined && { clearingDate: new Date(clearingDate) }),
```

- [ ] **Step 5: Verify no TS errors**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/booking.payments.ts
git commit -m "feat: accept clearingDate in add/update payment endpoints"
```

---

## Task 3: Backend — partyOverBooking accepts settlement data

**Files:**
- Modify: `server/src/controllers/booking.write.ts`

- [ ] **Step 1: Extend partyOver payload schema to include settlement**

In `booking.write.ts`, find `partyOverBooking` function. Find the `payloadSchema` definition. After the `packs` array, add:

```typescript
settlementDiscountPercent: z.number().min(0).max(100).optional(),
settlementDiscountAmount: z.number().min(0).optional(),
settlementTotalAmount: z.number().min(0).optional(),
```

So the full schema becomes:

```typescript
const payloadSchema = z.object({
  packs: z
    .array(
      z.object({
        bookingPackId: idSchema('booking pack ID'),
        extraPlate: z.number().int().min(0),
        extraRate: z.number().min(0).optional(),
      })
    )
    .default([]),
  settlementDiscountPercent: z.number().min(0).max(100).optional(),
  settlementDiscountAmount: z.number().min(0).optional(),
  settlementTotalAmount: z.number().min(0).optional(),
});
```

- [ ] **Step 2: Store settlement fields on the booking after pack updates**

In `partyOverBooking`, after the `for (const pack of booking.packs)` loop that updates each pack, find the `booking.update` call. After the existing status update, add settlement fields:

```typescript
await tx.booking.update({
  where: { id },
  data: {
    status: 'completed',
    ...(payload.settlementDiscountPercent !== undefined && {
      settlementDiscountPercent: payload.settlementDiscountPercent,
    }),
    ...(payload.settlementDiscountAmount !== undefined && {
      settlementDiscountAmount: payload.settlementDiscountAmount,
    }),
    ...(payload.settlementTotalAmount !== undefined && {
      settlementTotalAmount: payload.settlementTotalAmount,
    }),
  },
});
```

Note: Look for the existing `tx.booking.update` that sets `status: 'completed'` inside the transaction and extend it — don't add a second update call.

- [ ] **Step 3: Also update api.ts client to pass settlement fields**

In `client/src/lib/api.ts`, find `partyOverBooking`:

```typescript
partyOverBooking: (
  id: string,
  data: {
    packs: Array<{ bookingPackId: string; extraPlate: number; extraRate?: number }>;
    settlementDiscountPercent?: number;
    settlementDiscountAmount?: number;
    settlementTotalAmount?: number;
  }
) => apiClient.post(`/bookings/${id}/party-over`, data),
```

- [ ] **Step 4: Verify no TS errors**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/server && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/booking.write.ts client/src/lib/api.ts
git commit -m "feat: partyOverBooking accepts and stores settlement discount/amount"
```

---

## Task 4: Frontend — extend PaymentRow with reference and clearingDate

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx`

- [ ] **Step 1: Extend PaymentRow interface**

Find the `PaymentRow` interface (around line 186) and add `reference` and `clearingDate`:

```typescript
interface PaymentRow {
  id?: string;
  mode: string;
  narration: string;
  date: string;
  receivedBy: string;
  amount: string;
  reference: string;          // ← ADD (maps to Ledger column)
  clearingDate: string;       // ← ADD (ISO date string or '')
  _original?: {
    mode: string;
    narration: string;
    date: string;
    receivedBy: string;
    amount: string;
    reference: string;        // ← ADD
    clearingDate: string;     // ← ADD
  };
}
```

- [ ] **Step 2: Update initialFormData.payments and paymentDraft initial state**

The `initialFormData` has `payments: []`. No change needed there.

Find `paymentDraft` initial state (around line 557):

```typescript
const [paymentDraft, setPaymentDraft] = useState<PaymentRow>({
  amount: '',
  mode: 'Cash',
  date: todayStr(),
  receivedBy: '',
  narration: '',
  reference: '',        // ← ADD
  clearingDate: '',     // ← ADD
});
```

Also update the reset call in the Add Payment modal confirm handler (around line 3185):

```typescript
setPaymentDraft({ amount: '', mode: 'Cash', date: todayStr(), receivedBy: '', narration: '', reference: '', clearingDate: '' });
```

- [ ] **Step 3: Update payment loading from booking API response (around line 2056)**

Find the payment mapping block. Add `reference` and `clearingDate`:

```typescript
payments: (booking.payments || []).map((payment: any) => {
  const mode = payment.method || payment.paymentMethod || '';
  const narration = payment.narration || '';
  const date = payment.paymentDate ? payment.paymentDate.slice(0, 10) : '';
  const receivedBy = payment.receiver?.name || '';
  const reference = payment.reference || '';
  const clearingDate = payment.clearingDate ? payment.clearingDate.slice(0, 10) : '';
  const amount =
    payment.amount !== null && payment.amount !== undefined
      ? String(payment.amount)
      : '';
  return {
    id: payment.id || undefined,
    mode,
    narration,
    date,
    receivedBy,
    amount,
    reference,
    clearingDate,
    _original: { mode, narration, date, receivedBy, amount, reference, clearingDate },
  };
}),
```

- [ ] **Step 4: Update dirty detection in changedPayments filter (around line 2501)**

Add `reference` and `clearingDate` to the dirty check:

```typescript
const changedPayments = formData.payments.filter((p) => {
  if (!p.id || !p._original) return false;
  return (
    p.amount !== p._original.amount ||
    p.mode !== p._original.mode ||
    p.date !== p._original.date ||
    p.narration !== p._original.narration ||
    p.receivedBy !== p._original.receivedBy ||
    p.reference !== p._original.reference ||
    p.clearingDate !== p._original.clearingDate
  );
});
```

- [ ] **Step 5: Pass reference and clearingDate in PATCH and POST payment calls (around line 2517)**

```typescript
await Promise.all([
  ...changedPayments.map((p) =>
    api.updatePayment(savedBookingId, p.id!, {
      amount: parseFloat(p.amount),
      method: p.mode,
      narration: p.narration || undefined,
      paymentDate: p.date,
      reference: p.reference || undefined,
      clearingDate: p.clearingDate || undefined,
    })
  ),
  ...newPayments.map((p) =>
    api.addPayment(savedBookingId, {
      amount: parseFloat(p.amount),
      method: p.mode,
      narration: p.narration || undefined,
      paymentDate: p.date,
      reference: p.reference || undefined,
      clearingDate: p.clearingDate || undefined,
    })
  ),
]);
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/dashboard/bookings/page.tsx
git commit -m "feat: extend PaymentRow with reference and clearingDate fields"
```

---

## Task 5: Create BookingPaymentsLedger component

**Files:**
- Create: `client/src/components/BookingPaymentsLedger.tsx`

This component renders the payments table in the new ledger style. It receives `formData.payments` and callbacks to add/update/remove.

- [ ] **Step 1: Create the component file**

```typescript
// client/src/components/BookingPaymentsLedger.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface PaymentRow {
  id?: string;
  mode: string;
  narration: string;
  date: string;
  receivedBy: string;
  amount: string;
  reference: string;
  clearingDate: string;
  _original?: {
    mode: string; narration: string; date: string; receivedBy: string;
    amount: string; reference: string; clearingDate: string;
  };
}

interface Props {
  payments: PaymentRow[];
  isReadOnly: boolean;
  onAdd: (payment: PaymentRow) => void;
  onUpdate: (index: number, patch: Partial<PaymentRow>) => void;
  onRemove: (index: number) => void;
}

const PAYMENT_MODES = ['Cash', 'Cheque', 'Card', 'Online (UPI)', 'Bank Transfer'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const emptyDraft = (): PaymentRow => ({
  mode: 'Cash', amount: '', date: todayStr(), receivedBy: '',
  narration: '', reference: '', clearingDate: '',
});

export default function BookingPaymentsLedger({
  payments, isReadOnly, onAdd, onUpdate, onRemove,
}: Props) {
  const [showDraft, setShowDraft] = useState(false);
  const [draft, setDraft] = useState<PaymentRow>(emptyDraft());

  const handleAddConfirm = () => {
    if (!draft.amount || !draft.date) return;
    onAdd({ ...draft });
    setDraft(emptyDraft());
    setShowDraft(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-1)]">Payments Ledger</h3>
        {!isReadOnly && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-primary-600 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
            onClick={() => { setDraft(emptyDraft()); setShowDraft(true); }}
          >
            <Plus className="w-3 h-3" /> Add Payment
          </button>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border-2)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-[var(--surface-3)] border-b border-[var(--border)]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)]">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)]">Method</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)]">Ledger</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)]">Cashier</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)]">Clearing Date</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)]">Amount (₹)</th>
                {!isReadOnly && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 6 : 7} className="px-3 py-6 text-center text-sm text-[var(--text-4)]">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
              {payments.map((payment, index) => {
                const isExisting = Boolean(payment.id);
                const patch = (p: Partial<PaymentRow>) => onUpdate(index, p);
                const showClearing = payment.mode.toLowerCase() === 'cheque';

                return (
                  <tr
                    key={payment.id || `new-${index}`}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]"
                  >
                    <td className="px-2 py-1.5">
                      {isReadOnly ? (
                        <span className="text-[var(--text-2)]">{payment.date}</span>
                      ) : (
                        <input
                          type="date"
                          className="input py-1 text-sm w-36"
                          value={payment.date}
                          onChange={(e) => patch({ date: e.target.value })}
                        />
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {isReadOnly ? (
                        <span className="text-[var(--text-2)]">{payment.mode}</span>
                      ) : (
                        <select
                          className="input py-1 text-sm"
                          value={payment.mode}
                          onChange={(e) => patch({ mode: e.target.value, clearingDate: e.target.value !== 'Cheque' ? '' : payment.clearingDate })}
                        >
                          {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {isReadOnly ? (
                        <span className="text-[var(--text-2)]">{payment.reference || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          className="input py-1 text-sm w-40"
                          placeholder="Bank / ledger name"
                          value={payment.reference}
                          onChange={(e) => patch({ reference: e.target.value })}
                        />
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {isReadOnly ? (
                        <span className="text-[var(--text-2)]">{payment.receivedBy || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          className="input py-1 text-sm w-28"
                          placeholder="Staff name"
                          value={payment.receivedBy}
                          onChange={(e) => patch({ receivedBy: e.target.value })}
                        />
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {showClearing ? (
                        isReadOnly ? (
                          <span className="text-[var(--text-2)]">{payment.clearingDate || '—'}</span>
                        ) : (
                          <input
                            type="date"
                            className="input py-1 text-sm w-36"
                            value={payment.clearingDate}
                            onChange={(e) => patch({ clearingDate: e.target.value })}
                          />
                        )
                      ) : (
                        <span className="text-[var(--text-4)] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {isReadOnly ? (
                        <span className="font-medium text-[var(--text-1)]">
                          ₹{Number(payment.amount || 0).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          className="input py-1 text-sm w-28 text-right"
                          value={payment.amount}
                          onChange={(e) => patch({ amount: e.target.value })}
                        />
                      )}
                    </td>
                    {!isReadOnly && (
                      <td className="px-2 py-1.5 text-right">
                        {isExisting ? (
                          <span className="text-xs text-[var(--text-4)]">saved</span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:text-red-700"
                            onClick={() => onRemove(index)}
                          >Remove</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Draft row for adding a new payment */}
        {showDraft && !isReadOnly && (
          <div className="border-t border-[var(--border)] bg-primary-50 dark:bg-primary-900/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">New Payment Entry</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Date *</label>
                <input
                  type="date" className="input py-1 text-sm"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Method</label>
                <select
                  className="input py-1 text-sm"
                  value={draft.mode}
                  onChange={(e) => setDraft((d) => ({ ...d, mode: e.target.value, clearingDate: e.target.value !== 'Cheque' ? '' : d.clearingDate }))}
                >
                  {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Ledger</label>
                <input
                  type="text" className="input py-1 text-sm"
                  placeholder="Bank / cash ledger"
                  value={draft.reference}
                  onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Cashier</label>
                <input
                  type="text" className="input py-1 text-sm"
                  placeholder="Staff name"
                  value={draft.receivedBy}
                  onChange={(e) => setDraft((d) => ({ ...d, receivedBy: e.target.value }))}
                />
              </div>
              {draft.mode === 'Cheque' && (
                <div>
                  <label className="text-xs text-[var(--text-4)] block mb-1">Clearing Date</label>
                  <input
                    type="date" className="input py-1 text-sm"
                    value={draft.clearingDate}
                    onChange={(e) => setDraft((d) => ({ ...d, clearingDate: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Amount (₹) *</label>
                <input
                  type="number" min={0} className="input py-1 text-sm"
                  placeholder="0"
                  value={draft.amount}
                  onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowDraft(false)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary text-sm"
                disabled={!draft.amount || !draft.date}
                onClick={handleAddConfirm}
              >Add to Ledger</button>
            </div>
          </div>
        )}

        {/* Totals footer */}
        {payments.length > 0 && (() => {
          const todayDate = new Date().toISOString().slice(0, 10);
          const credited = payments.reduce((sum, p) => {
            if (p.mode.toLowerCase() === 'cheque' && p.clearingDate && p.clearingDate > todayDate) {
              return sum;
            }
            return sum + (parseFloat(p.amount) || 0);
          }, 0);
          const total = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
          const pending = total - credited;

          return (
            <div className="border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 space-y-1 text-sm">
              <div className="flex justify-between text-[var(--text-2)]">
                <span>Total Received</span>
                <span className="font-semibold">₹{credited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {pending > 0 && (
                <div className="flex justify-between text-amber-600 text-xs">
                  <span>Pending (cheque not cleared)</span>
                  <span>₹{pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <p className="text-xs text-[var(--text-4)] mt-1">
                Cheque payments credited only on/after clearing date.
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/BookingPaymentsLedger.tsx
git commit -m "feat: add BookingPaymentsLedger component with ledger/cashier/clearing-date columns"
```

---

## Task 6: Create BookingFinancialSummary component

**Files:**
- Create: `client/src/components/BookingFinancialSummary.tsx`

- [ ] **Step 1: Create the component**

```typescript
// client/src/components/BookingFinancialSummary.tsx
'use client';

interface PackSummary {
  ratePerPlate: number;
  packCount: number;     // MG Pax
}

interface PaymentRow {
  mode: string;
  amount: string;
  clearingDate: string;
}

interface Props {
  packs: PackSummary[];
  payments: PaymentRow[];
  functionDate: string;       // ISO date string e.g. "2026-05-15"
  discountPercent: number;    // booking-level discount %
  settlementDiscountAmount?: number;
  settlementTotalAmount?: number;
  isPartyOver: boolean;       // true after partyOverBooking is submitted
  totalBilledAmount?: number; // computed after party over (sum of billedPax * discRate)
}

function getDuePercent(functionDate: string, isPartyOver: boolean): number {
  if (isPartyOver) return 100;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const funcDay = new Date(functionDate);
  funcDay.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((funcDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 2) return 100;
  return 40;
}

export default function BookingFinancialSummary({
  packs, payments, functionDate, discountPercent,
  settlementDiscountAmount, settlementTotalAmount, isPartyOver, totalBilledAmount,
}: Props) {
  const discRate = (rpp: number) => rpp * (1 - discountPercent / 100);

  const totalQuoteAmount = packs.reduce((sum, p) => sum + p.ratePerPlate * p.packCount, 0);
  const totalDiscountedAmount = packs.reduce((sum, p) => sum + discRate(p.ratePerPlate) * p.packCount, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const credited = payments.reduce((sum, p) => {
    if (p.mode.toLowerCase() === 'cheque' && p.clearingDate && p.clearingDate > todayStr) return sum;
    return sum + (parseFloat(p.amount) || 0);
  }, 0);

  const duePercent = getDuePercent(functionDate, isPartyOver);

  let currentDueBasis = totalDiscountedAmount;
  let currentDueLabel = `${duePercent}% of Discounted Amount`;
  if (isPartyOver && totalBilledAmount !== undefined) {
    currentDueBasis = settlementTotalAmount ?? totalBilledAmount;
    currentDueLabel = settlementTotalAmount ? '100% of Settlement Amount' : '100% of Billed Amount';
  }
  const currentDue = currentDueBasis * (duePercent / 100);
  const amountShort = Math.max(0, currentDue - credited);
  const shortPercent = totalDiscountedAmount > 0
    ? ((amountShort / totalDiscountedAmount) * 100).toFixed(0)
    : '0';
  const receivedPercent = totalDiscountedAmount > 0
    ? ((credited / totalDiscountedAmount) * 100).toFixed(0)
    : '0';

  return (
    <div className="rounded-xl border border-[var(--border-2)] overflow-hidden">
      <div className="bg-slate-100 dark:bg-[var(--surface-3)] px-4 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-semibold text-[var(--text-2)]">Financial Summary</span>
      </div>
      <div className="p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-[var(--text-2)]">
          <span>Total Quote Amount</span>
          <span>₹{totalQuoteAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between text-[var(--text-2)]">
          <span>Total Discounted Amount ({discountPercent}%)</span>
          <span>₹{totalDiscountedAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
        </div>
        {totalBilledAmount !== undefined && (
          <div className="flex justify-between text-[var(--text-2)]">
            <span>Total Billed Amount</span>
            <span>₹{totalBilledAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
          </div>
        )}
        {settlementTotalAmount !== undefined && (
          <div className="flex justify-between text-[var(--text-2)]">
            <span>Total Settlement Amount</span>
            <span>₹{settlementTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[var(--border)] rounded-lg bg-[var(--surface-2)] px-3 py-2 space-y-1">
          <div className="flex justify-between font-medium text-[var(--text-1)]">
            <span>Current Due ({currentDueLabel})</span>
            <span>₹{currentDue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between text-green-700 dark:text-green-400">
            <span>Received ({receivedPercent}%)</span>
            <span>₹{credited.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
          </div>
          <div className={`flex justify-between font-semibold ${amountShort > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            <span>Amount Short ({shortPercent}%)</span>
            <span>₹{amountShort.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
          </div>
        </div>

        <p className="text-xs text-[var(--text-4)] mt-2">
          Before party: 40% of discounted amount due up to 2 days before, then 100% due.
          After party over: billed amount is 100% due. After settlement: settlement amount is 100% due.
          Cheques not credited until clearing date.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/BookingFinancialSummary.tsx
git commit -m "feat: add BookingFinancialSummary component with dynamic due % logic"
```

---

## Task 7: Create BookingPartyOverForm component

**Files:**
- Create: `client/src/components/BookingPartyOverForm.tsx`

This replaces the separate `showPartyOverModal` + `FormPromptModal`. Rendered inline in Tab 2.

- [ ] **Step 1: Create the component**

```typescript
// client/src/components/BookingPartyOverForm.tsx
'use client';

import { useState } from 'react';
import { Flag, Lock } from 'lucide-react';

interface PackRow {
  id: string;
  packName: string;
  menuPoint?: number | null;
  ratePerPlate: number;
  packCount: number;   // MG Pax
  extraPlate?: number | null;
  extraRateValue?: number | null;
}

interface Props {
  booking: any | null;  // full booking object from api.getBooking
  functionDate: string; // ISO date
  discountPercent: number;
  isPartyOverSubmitted: boolean;
  saving: boolean;
  onSubmit: (payload: {
    packs: Array<{ bookingPackId: string; extraPlate: number; extraRate: number }>;
    settlementDiscountPercent: number;
    settlementDiscountAmount: number;
    settlementTotalAmount: number;
  }) => Promise<void>;
}

function isDatePassed(functionDate: string): boolean {
  if (!functionDate) return false;
  const funcDay = new Date(functionDate);
  funcDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return funcDay.getTime() <= today.getTime();
}

export default function BookingPartyOverForm({
  booking, functionDate, discountPercent, isPartyOverSubmitted, saving, onSubmit,
}: Props) {
  const [actualPax, setActualPax] = useState<Record<string, number>>({});
  const [settlementDiscountPct, setSettlementDiscountPct] = useState('0');

  const unlocked = isDatePassed(functionDate);
  const packs: PackRow[] = booking?.packs || [];

  const discRate = (rpp: number) => rpp * (1 - discountPercent / 100);

  const getBilledPax = (pack: PackRow): number => {
    const actual = actualPax[pack.id] ?? (pack.packCount + (pack.extraPlate || 0));
    return Math.max(pack.packCount, actual);
  };

  const rows = packs.map((pack) => {
    const qr = pack.ratePerPlate;
    const disc = discountPercent;
    const dr = discRate(qr);
    const discAmt = dr * pack.packCount;
    const actualP = actualPax[pack.id] ?? (pack.packCount + (pack.extraPlate || 0));
    const billedP = Math.max(pack.packCount, actualP);
    const billedAmt = dr * billedP;
    return { pack, qr, disc, dr, discAmt, actualP, billedP, billedAmt };
  });

  const totalDiscAmt = rows.reduce((s, r) => s + r.discAmt, 0);
  const totalBilledAmt = rows.reduce((s, r) => s + r.billedAmt, 0);
  const settlePct = parseFloat(settlementDiscountPct) || 0;
  const settleDiscAmt = totalBilledAmt * (settlePct / 100);
  const settleTotalAmt = totalBilledAmt - settleDiscAmt;

  const handleSubmit = async () => {
    if (!window.confirm('Mark party as over? All versions will be permanently locked.')) return;
    await onSubmit({
      packs: rows.map((r) => ({
        bookingPackId: r.pack.id,
        extraPlate: Math.max(0, r.billedP - r.pack.packCount),
        extraRate: r.dr,
      })),
      settlementDiscountPercent: settlePct,
      settlementDiscountAmount: settleDiscAmt,
      settlementTotalAmount: settleTotalAmt,
    });
  };

  if (isPartyOverSubmitted) {
    return (
      <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-500/10 p-4">
        <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
          <Flag className="w-4 h-4" /> Party finalized. All versions are locked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-red-500" />
        <h3 className="text-lg font-semibold text-[var(--text-1)]">Party Over</h3>
      </div>

      {!unlocked && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Party Over unlocks on or after the function date ({functionDate ? new Date(functionDate).toLocaleDateString('en-IN') : '—'}).
            You can record payments above in the meantime.
          </p>
        </div>
      )}

      {unlocked && packs.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] p-6 text-center text-sm text-[var(--text-4)]">
          No packs configured on this booking.
        </div>
      )}

      {unlocked && packs.length > 0 && (
        <>
          <div className="rounded-xl border border-[var(--border-2)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[var(--surface-3)] border-b border-[var(--border)]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Agreement</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Menu pts</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Quote Rate</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Disc %</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Disc Rate</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap bg-orange-50 dark:bg-orange-900/20">Disc Amt</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">MG Pax</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 whitespace-nowrap">Actual Pax ✏</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Billed Pax</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-2)] whitespace-nowrap">Billed Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ pack, qr, disc, dr, discAmt, actualP, billedP, billedAmt }) => (
                    <tr key={pack.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2 font-medium text-[var(--text-1)]">{pack.packName}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{pack.menuPoint ?? 0}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{qr.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{disc.toFixed(2)}%</td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{Math.round(dr).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200">
                        {Math.round(discAmt).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--text-2)]">{pack.packCount}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          className="input py-1 text-sm w-24 text-center"
                          value={actualPax[pack.id] ?? actualP}
                          onChange={(e) =>
                            setActualPax((prev) => ({
                              ...prev,
                              [pack.id]: parseInt(e.target.value) || 0,
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-[var(--text-1)]">{billedP}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--text-1)]">
                        {Math.round(billedAmt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-2)] font-semibold">
                    <td colSpan={5} className="px-3 py-2 text-right text-xs text-[var(--text-2)]">Totals</td>
                    <td className="px-3 py-2 text-right bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200">
                      {Math.round(totalDiscAmt).toLocaleString('en-IN')}
                    </td>
                    <td colSpan={3} />
                    <td className="px-3 py-2 text-right text-[var(--text-1)]">
                      {Math.round(totalBilledAmt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement section */}
          <div className="rounded-xl border border-[var(--border-2)] p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-1)]">Settlement</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Settlement Discount %</label>
                <input
                  type="number" min={0} max={100} step="0.01"
                  className="input py-1 text-sm"
                  value={settlementDiscountPct}
                  onChange={(e) => setSettlementDiscountPct(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-4)] block mb-1">Settlement Discount Amt</label>
                <div className="input py-1 text-sm bg-[var(--surface-2)] cursor-not-allowed">
                  ₹{Math.round(settleDiscAmt).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[var(--text-4)] block mb-1">Settlement Amount</label>
                <div className="input py-1 text-sm bg-[var(--surface-2)] cursor-not-allowed font-semibold">
                  ₹{Math.round(settleTotalAmt).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 p-3">
            <p className="text-xs text-red-700 dark:text-red-200">
              ⚠ Marking party as over permanently locks ALL booking versions. This action cannot be reversed.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="btn bg-red-600 hover:bg-red-700 text-white shadow-sm"
              disabled={saving}
              onClick={handleSubmit}
            >
              <span className="inline-flex items-center gap-2">
                <Flag className="w-4 h-4" />
                {saving ? 'Processing…' : 'Settle & Lock Party'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/BookingPartyOverForm.tsx
git commit -m "feat: add BookingPartyOverForm with full Excel-style table and settlement section"
```

---

## Task 8: Wire Tab 2 into booking form — tab shell + remove old payment/party-over UI

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx`

This is the largest change. We add a tab state, wrap the form in tabs, move the payment section to Tab 2, and remove the old party-over modal.

- [ ] **Step 1: Add imports for new components near the top of the file**

After the existing `import StatusBadge from '@/components/StatusBadge';` line, add:

```typescript
import BookingPaymentsLedger from '@/components/BookingPaymentsLedger';
import BookingFinancialSummary from '@/components/BookingFinancialSummary';
import BookingPartyOverForm from '@/components/BookingPartyOverForm';
```

- [ ] **Step 2: Add activeBookingTab state**

Near the other state declarations (around line 486, with `showPartyOverModal` etc.), add:

```typescript
const [activeBookingTab, setActiveBookingTab] = useState<'details' | 'payments'>('details');
```

Also reset it when the booking form opens/closes. Find `closeBookingForm` and ensure it calls `setActiveBookingTab('details')`. Find `openEditBooking` and ensure it calls `setActiveBookingTab('details')`.

- [ ] **Step 3: Add tab header UI inside the FormPromptModal, before the form**

The `FormPromptModal` content starts with `<fieldset disabled={isReadOnlyBooking}>`. Before that fieldset, insert the tab bar:

```tsx
{/* Tab bar */}
<div className="flex border-b border-[var(--border)] mb-4 -mt-2">
  <button
    type="button"
    className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      activeBookingTab === 'details'
        ? 'border-primary-600 text-primary-700 dark:text-primary-400'
        : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
    }`}
    onClick={() => setActiveBookingTab('details')}
  >
    Booking Details
  </button>
  <button
    type="button"
    className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      activeBookingTab === 'payments'
        ? 'border-primary-600 text-primary-700 dark:text-primary-400'
        : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
    }`}
    onClick={() => setActiveBookingTab('payments')}
  >
    Payments & Party Over
    {formData.payments.length > 0 && (
      <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
        {formData.payments.length}
      </span>
    )}
  </button>
</div>
```

- [ ] **Step 4: Wrap existing form content in `activeBookingTab === 'details'` condition**

The form content currently is all inside `<form onSubmit=...>`. Wrap everything inside the form (except the final `form-actions` div) in:

```tsx
{activeBookingTab === 'details' && (
  // ... existing booking detail sections ...
)}
```

The `form-actions` div at the bottom (with Save/Cancel/Party Over buttons) should stay visible on both tabs — keep it outside the condition but still inside the `<form>`.

- [ ] **Step 5: Add Tab 2 content after the Tab 1 condition block (still inside the form)**

```tsx
{activeBookingTab === 'payments' && (
  <div className="space-y-6">
    <BookingPaymentsLedger
      payments={formData.payments}
      isReadOnly={isReadOnlyBooking}
      onAdd={(payment) =>
        setFormData((prev) => ({ ...prev, payments: [...prev.payments, payment] }))
      }
      onUpdate={(index, patch) =>
        setFormData((prev) => ({
          ...prev,
          payments: prev.payments.map((p, i) => i === index ? { ...p, ...patch } : p),
        }))
      }
      onRemove={(index) =>
        setFormData((prev) => ({
          ...prev,
          payments: prev.payments.filter((_, i) => i !== index),
        }))
      }
    />

    <BookingFinancialSummary
      packs={Object.values(formData.packs)
        .filter((p) => p.enabled)
        .map((p) => ({
          ratePerPlate: parseFloat(p.ratePerPlate || '0') || 0,
          packCount: parseInt(p.pax || '0') || 0,
        }))}
      payments={formData.payments}
      functionDate={formData.functionDate}
      discountPercent={parseFloat(formData.finalDiscountPercent || '0') || 0}
      isPartyOver={activeBookingObj?.status === 'completed'}
      totalBilledAmount={activeBookingObj ? computeTotalBilledAmount(activeBookingObj) : undefined}
      settlementTotalAmount={activeBookingObj?.settlementTotalAmount ?? undefined}
      settlementDiscountAmount={activeBookingObj?.settlementDiscountAmount ?? undefined}
    />

    <BookingPartyOverForm
      booking={activePartyOverBooking}
      functionDate={formData.functionDate}
      discountPercent={parseFloat(formData.finalDiscountPercent || '0') || 0}
      isPartyOverSubmitted={activeBookingObj?.status === 'completed'}
      saving={saving}
      onSubmit={async (payload) => {
        try {
          setSaving(true);
          const response = await api.partyOverBooking(editingBookingId!, payload);
          toast.success('Party finalized permanently!');
          await loadBookings();
          if (response.data?.data?.newBookingId) {
            await openEditBooking(response.data.data.newBookingId);
          } else {
            closeBookingForm();
          }
        } catch (error: any) {
          toast.error(error?.response?.data?.error || 'Failed to submit party over');
        } finally {
          setSaving(false);
        }
      }}
    />
  </div>
)}
```

Note: `activeBookingObj` is a reference to the current booking object loaded from API (already available as the booking passed to `openEditBooking`). You may need to add a `const [activeBookingObj, setActiveBookingObj] = useState<any>(null)` and set it in `openEditBooking`.

`computeTotalBilledAmount` is a local helper function:

```typescript
function computeTotalBilledAmount(booking: any): number {
  return (booking.packs || []).reduce((sum: number, pack: any) => {
    const discountPct = booking.discountPercentageValue ?? booking.discountPercentage ?? 0;
    const dr = pack.ratePerPlate * (1 - discountPct / 100);
    const billed = Math.max(pack.packCount, pack.packCount + (pack.extraPlate || 0));
    return sum + dr * billed;
  }, 0);
}
```

- [ ] **Step 6: Remove old payment section from Tab 1 form body**

In the existing form, find the `<section>` that contains the `<h3>Payment</h3>` heading (around line 3061). Remove:
- The entire `<div className="space-y-3"><h3 className="text-2xl font-semibold ...">Payment</h3>...` block including Advance Required, % Payment Received, Due Amount, the payment modal, the payments table, and the Settlement Calculation section.

These are now rendered in Tab 2.

- [ ] **Step 7: Remove old Party Over modal and related state**

Remove the `<FormPromptModal open={showPartyOverModal} ...>` party over modal JSX (around line 5904–6024). This is now handled by `BookingPartyOverForm` inside Tab 2.

Also remove from Tab 1 form-actions the `Party Over` button (around line 4159–4171) and the sticky actions version (around line 4201–4213). The party over action now lives in Tab 2.

Keep: `showPartyOverModal`, `partyOverPlates`, `partyOverRates`, `activePartyOverBooking` state — they can be removed once you verify the new form works, OR rename `activePartyOverBooking` to `activeBookingObj` and reuse it for Tab 2.

- [ ] **Step 8: Load booking detail into `activePartyOverBooking` when form opens**

In `openEditBooking` (the function that loads a booking for editing), after the booking data is loaded, also call:

```typescript
setActivePartyOverBooking(booking); // booking = the full API response object
```

This ensures Tab 2's `BookingPartyOverForm` always has fresh pack data.

- [ ] **Step 9: Verify TypeScript**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors (fix any type mismatches found).

- [ ] **Step 10: Commit**

```bash
git add client/src/app/dashboard/bookings/page.tsx
git commit -m "feat: two-tab booking form — payments and party over moved to Tab 2"
```

---

## Task 9: Remove settlementDiscountAmount and settlementAmount orphan fields from Tab 1

**Files:**
- Modify: `client/src/app/dashboard/bookings/page.tsx`

These fields existed in the form UI but were never sent to the API. Now that settlement is handled in Tab 2 via `BookingPartyOverForm`, remove the orphan fields.

- [ ] **Step 1: Remove settlementDiscountAmount and settlementAmount from BookingFormData interface**

Find in the interface:
```typescript
settlementDiscountAmount: string;
settlementAmount: string;
```
Remove both lines.

- [ ] **Step 2: Remove from initialFormData**

```typescript
settlementDiscountAmount: '0',
settlementAmount: '0',
```
Remove both lines.

- [ ] **Step 3: The Settlement Calculation section in the form was already removed in Task 8 Step 6**

Verify it's gone. If any remaining references to `formData.settlementDiscountAmount` or `formData.settlementAmount` exist, remove them.

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/app/dashboard/bookings/page.tsx
git commit -m "chore: remove orphan settlement fields from booking form interface"
```

---

## Task 10: Visual QA and polish

- [ ] **Step 1: Start dev server**

```bash
cd /Users/harshitgoyal/Downloads/files/bika-banquet/client && npm run dev
```

- [ ] **Step 2: Test Tab 1 (Booking Details)**

Open any existing booking. Verify:
- Tab 1 shows all booking detail fields (customer, function type/date, packs, notes, terms)
- No payment section visible on Tab 1
- No Party Over button on Tab 1 form actions
- Save button still works — saving from Tab 1 works normally

- [ ] **Step 3: Test Tab 2 (Payments & Party Over)**

Click Tab 2. Verify:
- Payments Ledger table shows existing payments with correct columns: Date, Method, Ledger, Cashier, Clearing Date, Amount
- Clearing Date cell only shows/is editable when Method = Cheque
- "Add to Ledger" draft row appears on click
- Financial Summary shows correct totals and due amounts
- Party Over section shows lock message when functionDate is in the future
- Party Over section shows the full table when functionDate has passed

- [ ] **Step 4: Test Party Over submission**

For a booking whose functionDate has passed:
- Enter Actual Pax values
- Set settlement discount %
- Verify Billed Pax = max(MG Pax, Actual Pax) auto-updates
- Verify Settlement Amount = Total Billed - Discount
- Click Settle & Lock — confirm it succeeds and booking is marked completed

- [ ] **Step 5: Test new booking creation**

Open "Add Booking". Verify:
- Tab 1 works normally
- Tab 2 shows empty ledger (no payments yet)
- Party Over locked (new booking has no date or future date)

- [ ] **Step 6: Test mobile responsiveness**

On narrow viewport (375px):
- Tab bar is visible and tappable
- Payments table has horizontal scroll
- Party Over table has horizontal scroll
- Financial summary stacks vertically

- [ ] **Step 7: Commit any polish fixes**

```bash
git add -A
git commit -m "fix: visual QA polish for booking tabs UI"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Covered |
|---|---|
| Two-tab booking modal | Task 8 |
| Payments always accessible on Tab 2 | Task 8 Step 5 |
| Party Over locked until function date passed | Task 7 |
| Party Over full Excel-style table (Agreement/Menu pts/Quote Rate/Disc%/Disc Rate/Disc Amt/MG Pax/Actual Pax/Billed Pax/Billed Amount) | Task 7 |
| Settlement section in Party Over form | Task 7 |
| Payments ledger with Ledger/Cashier/Clearing Date columns | Task 5 |
| Clearing Date only for Cheque | Task 5 |
| Cheque not credited until clearing date | Task 5 + 6 |
| Financial Summary with dynamic due % (40% before, 100% after) | Task 6 |
| DB migration for clearingDate | Task 1 |
| DB migration for settlement fields | Task 1 |
| Backend accepts clearingDate | Task 2 |
| Backend accepts settlement data in party over | Task 3 |
| Remove orphan settlement fields from Tab 1 | Task 9 |

**Type consistency check:**
- `PaymentRow` extended in Task 4, consumed in Tasks 5, 8
- `BookingPartyOverForm.onSubmit` payload shape matches `api.partyOverBooking` extended in Task 3
- `BookingFinancialSummary.packs` takes `{ ratePerPlate, packCount }` — used with filtered formData packs in Task 8

**Placeholder check:** None — all code blocks are complete and specific.
