import { describe, it, expect, vi } from 'vitest';

// Stub the axios-based api + sonner so importing hooks.ts is side-effect free
// in the node test env. We only exercise the pure cache-shape patcher.
vi.mock('@/lib/api', () => ({ api: {}, fetchAllCustomers: async () => [] }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { applyOptimisticToCacheValue, type AddPaymentInput } from '../query/hooks';

const input: AddPaymentInput = {
  bookingId: 'b1',
  amount: 500,
  method: 'cash',
};

describe('applyOptimisticToCacheValue (re-keyed optimistic add still applies)', () => {
  it('patches the legacy array cache shape', () => {
    const cache = [
      { id: 'b1', grandTotal: 1000, paymentReceivedAmountValue: 0, _count: { payments: 0 } },
      { id: 'b2', grandTotal: 2000, paymentReceivedAmountValue: 0, _count: { payments: 0 } },
    ];
    const next = applyOptimisticToCacheValue(cache, input) as typeof cache;
    expect(next[0].paymentReceivedAmountValue).toBe(500);
    expect(next[0].dueAmountValue).toBe(500);
    expect(next[0]._count.payments).toBe(1);
    // untouched row preserved
    expect(next[1].paymentReceivedAmountValue).toBe(0);
  });

  it('patches the server-paginated { rows, pagination } shape', () => {
    const cache = {
      rows: [
        { id: 'b1', grandTotal: 1000, paymentReceivedAmountValue: 100, _count: { payments: 1 } },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    };
    const next = applyOptimisticToCacheValue(cache, input) as typeof cache;
    expect(next.rows[0].paymentReceivedAmountValue).toBe(600);
    expect(next.rows[0].dueAmountValue).toBe(400);
    expect(next.rows[0]._count.payments).toBe(2);
    // pagination meta preserved
    expect(next.pagination.total).toBe(1);
  });

  it('leaves unrelated cache values untouched', () => {
    expect(applyOptimisticToCacheValue(null, input)).toBeNull();
    expect(applyOptimisticToCacheValue({ foo: 1 }, input)).toEqual({ foo: 1 });
  });

  it('ignores invalid amounts', () => {
    const cache = [{ id: 'b1', grandTotal: 1000, paymentReceivedAmountValue: 0 }];
    const next = applyOptimisticToCacheValue(cache, { ...input, amount: 0 }) as typeof cache;
    expect(next[0].paymentReceivedAmountValue).toBe(0);
  });
});
