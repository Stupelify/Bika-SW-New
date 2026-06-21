import {
  auditCateringPax,
  auditPaymentConsolidation,
  consolidatePaymentsForLatest,
  runBackfillFinalizePayments,
} from '../scripts/backfillFinalizePayments.lib';

const mockResolveVersionChain = jest.fn();
const mockBookingFindMany = jest.fn();
const mockBookingPaymentsFindMany = jest.fn();
const mockBookingPaymentsCount = jest.fn();
const mockBookingPaymentsUpdateMany = jest.fn();
const mockBookingFindUnique = jest.fn();
const mockBookingUpdate = jest.fn();
const mockBookingPackFindMany = jest.fn();
const mockBookingPackUpdateMany = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../controllers/booking.helpers', () => ({
  resolveVersionChain: (...args: unknown[]) => mockResolveVersionChain(...args),
}));

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    booking: {
      findMany: (...args: unknown[]) => mockBookingFindMany(...args),
      findUnique: (...args: unknown[]) => mockBookingFindUnique(...args),
      update: (...args: unknown[]) => mockBookingUpdate(...args),
    },
    bookingPayments: {
      findMany: (...args: unknown[]) => mockBookingPaymentsFindMany(...args),
      count: (...args: unknown[]) => mockBookingPaymentsCount(...args),
      updateMany: (...args: unknown[]) => mockBookingPaymentsUpdateMany(...args),
    },
    bookingPack: {
      findMany: (...args: unknown[]) => mockBookingPackFindMany(...args),
      updateMany: (...args: unknown[]) => mockBookingPackUpdateMany(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

jest.mock('../controllers/booking.shared', () => ({
  recalculateBookingFinancials: jest.fn(),
  toStoredNumberString: (value: number) => String(value),
}));

describe('auditPaymentConsolidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('counts stranded payments on non-latest versions in a chain', async () => {
    mockBookingFindMany.mockResolvedValue([{ id: 'v3-latest' }]);
    mockResolveVersionChain.mockResolvedValue(['v1', 'v2', 'v3-latest']);
    mockBookingPaymentsFindMany.mockResolvedValue([
      { id: 'p1', amount: 200_000 },
      { id: 'p2', amount: 300_000 },
    ]);

    const audit = await auditPaymentConsolidation();

    expect(audit.latestIds).toEqual(['v3-latest']);
    expect(audit.stats.chainsWithStrandedPayments).toBe(1);
    expect(audit.stats.paymentRowsToMove).toBe(2);
    expect(audit.stats.rupeesToMove).toBe(500_000);
    expect(mockBookingPaymentsFindMany).toHaveBeenCalledWith({
      where: { bookingId: { in: ['v1', 'v2'] } },
      select: { id: true, amount: true },
    });
  });

  it('returns empty when latest already holds all payments', async () => {
    mockBookingFindMany.mockResolvedValue([{ id: 'v2-latest' }]);
    mockResolveVersionChain.mockResolvedValue(['v1', 'v2-latest']);
    mockBookingPaymentsFindMany.mockResolvedValue([]);

    const audit = await auditPaymentConsolidation();

    expect(audit.latestIds).toEqual([]);
    expect(audit.stats.paymentRowsToMove).toBe(0);
  });
});

describe('auditCateringPax (Repair B guards)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries hall-only spurious pax with rate=0 and empty menu on live bookings', async () => {
    mockBookingPackFindMany.mockResolvedValue([
      { id: 'pack-1', bookingId: 'b-1' },
    ]);

    const audit = await auditCateringPax();

    expect(audit.packIds).toEqual(['pack-1']);
    expect(audit.bookingIds).toEqual(['b-1']);
    expect(mockBookingPackFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ratePerPlate: 0,
          booking: { isLatest: true, status: { not: 'completed' } },
          bookingMenu: { items: { none: {} } },
        }),
      })
    );
  });
});

describe('consolidatePaymentsForLatest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dry-run returns stranded count without mutating', async () => {
    mockResolveVersionChain.mockResolvedValue(['v1', 'v2-latest']);
    mockBookingPaymentsCount.mockResolvedValue(2);

    const moved = await consolidatePaymentsForLatest('v2-latest', false);

    expect(moved).toBe(2);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockBookingPaymentsUpdateMany).not.toHaveBeenCalled();
  });

  it('apply moves payments and recomputes received/due on latest', async () => {
    mockResolveVersionChain.mockResolvedValue(['v1', 'v2-latest']);
    mockBookingPaymentsCount.mockResolvedValue(1);

    const tx = {
      bookingPayments: {
        updateMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          { method: 'cash', amount: 500_000, clearingDate: null },
        ]),
      },
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          grandTotal: 1_400_000,
          finalAmountValue: 1_400_000,
        }),
        update: jest.fn(),
      },
    };
    mockTransaction.mockImplementation(async (fn: (t: typeof tx) => Promise<void>) => fn(tx));

    const moved = await consolidatePaymentsForLatest('v2-latest', true);

    expect(moved).toBe(1);
    expect(tx.bookingPayments.updateMany).toHaveBeenCalledWith({
      where: { bookingId: { in: ['v1'] } },
      data: { bookingId: 'v2-latest' },
    });
    expect(tx.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'v2-latest' },
        data: expect.objectContaining({
          paymentReceivedAmountValue: 500_000,
          dueAmountValue: 900_000,
        }),
      })
    );
  });
});

describe('runBackfillFinalizePayments idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('second apply pass is a no-op when audit finds nothing stranded', async () => {
    mockBookingFindMany.mockResolvedValue([{ id: 'v2-latest' }]);
    mockResolveVersionChain.mockResolvedValue(['v1', 'v2-latest']);
    mockBookingPaymentsFindMany.mockResolvedValue([]);
    mockBookingPackFindMany.mockResolvedValue([]);

    const first = await runBackfillFinalizePayments(true);
    const second = await runBackfillFinalizePayments(true);

    expect(first.movedRows).toBe(0);
    expect(second.movedRows).toBe(0);
    expect(first.postPaymentAudit.stats.chainsWithStrandedPayments).toBe(0);
    expect(second.postPaymentAudit.stats.chainsWithStrandedPayments).toBe(0);
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
