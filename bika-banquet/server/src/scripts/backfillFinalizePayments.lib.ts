/**
 * Backfill helpers for finalize payment scatter + catering-off spurious pax.
 * Exported for unit tests; CLI script wraps these with prisma.
 */
import prisma from '../config/database';
import { resolveVersionChain } from '../controllers/booking.helpers';
import {
  recalculateBookingFinancials,
  toStoredNumberString,
} from '../controllers/booking.shared';
import { resolvePayableTotal, resolvePaymentTotals } from '@bika/booking-core';

export interface PaymentConsolidationAudit {
  latestIds: string[];
  stats: {
    chainsWithStrandedPayments: number;
    paymentRowsToMove: number;
    rupeesToMove: number;
  };
}

export interface CateringPaxAudit {
  packIds: string[];
  bookingIds: string[];
}

export async function auditPaymentConsolidation(): Promise<PaymentConsolidationAudit> {
  const latestBookings = await prisma.booking.findMany({
    where: { isLatest: true },
    select: { id: true },
  });

  const latestIds: string[] = [];
  let chainsWithStrandedPayments = 0;
  let paymentRowsToMove = 0;
  let rupeesToMove = 0;

  for (const latest of latestBookings) {
    const chain = await resolveVersionChain(latest.id);
    const nonLatestIds = chain.filter((id) => id !== latest.id);
    if (nonLatestIds.length === 0) continue;

    const stranded = await prisma.bookingPayments.findMany({
      where: { bookingId: { in: nonLatestIds } },
      select: { id: true, amount: true },
    });
    if (stranded.length === 0) continue;

    chainsWithStrandedPayments += 1;
    paymentRowsToMove += stranded.length;
    rupeesToMove += stranded.reduce((sum, row) => sum + row.amount, 0);
    latestIds.push(latest.id);
  }

  return {
    latestIds,
    stats: { chainsWithStrandedPayments, paymentRowsToMove, rupeesToMove },
  };
}

export async function auditCateringPax(): Promise<CateringPaxAudit> {
  const packs = await prisma.bookingPack.findMany({
    where: {
      ratePerPlate: 0,
      OR: [{ packCount: 1 }, { noOfPack: 1 }],
      booking: {
        isLatest: true,
        status: { not: 'completed' },
      },
      bookingMenu: {
        items: { none: {} },
      },
    },
    select: { id: true, bookingId: true },
  });

  return {
    packIds: packs.map((p) => p.id),
    bookingIds: [...new Set(packs.map((p) => p.bookingId))],
  };
}

export async function consolidatePaymentsForLatest(
  latestId: string,
  apply: boolean
): Promise<number> {
  const chain = await resolveVersionChain(latestId);
  const nonLatestIds = chain.filter((id) => id !== latestId);
  if (nonLatestIds.length === 0) return 0;

  const strandedCount = await prisma.bookingPayments.count({
    where: { bookingId: { in: nonLatestIds } },
  });
  if (strandedCount === 0) return 0;

  if (!apply) return strandedCount;

  await prisma.$transaction(async (tx) => {
    await tx.bookingPayments.updateMany({
      where: { bookingId: { in: nonLatestIds } },
      data: { bookingId: latestId },
    });

    const latest = await tx.booking.findUnique({
      where: { id: latestId },
      select: {
        grandTotal: true,
        finalAmountValue: true,
      },
    });
    if (!latest) return;

    const payable = resolvePayableTotal(latest);
    const payments = await tx.bookingPayments.findMany({
      where: { bookingId: latestId },
      select: { method: true, amount: true, clearingDate: true },
    });
    const { grossReceived, dueAmount } = resolvePaymentTotals(payable, payments);

    await tx.booking.update({
      where: { id: latestId },
      data: {
        paymentReceivedAmount: toStoredNumberString(grossReceived),
        paymentReceivedAmountValue: grossReceived,
        dueAmount: toStoredNumberString(dueAmount),
        dueAmountValue: dueAmount,
      },
    });
  });

  return strandedCount;
}

export async function zeroCateringPax(
  packIds: string[],
  bookingIds: string[],
  apply: boolean
): Promise<void> {
  if (packIds.length === 0) return;

  if (apply) {
    await prisma.bookingPack.updateMany({
      where: { id: { in: packIds } },
      data: { packCount: 0, noOfPack: 0 },
    });

    for (const bookingId of bookingIds) {
      await prisma.$transaction(async (tx) => {
        await recalculateBookingFinancials(tx, bookingId);
      });
    }
  }
}

export async function runBackfillFinalizePayments(apply: boolean): Promise<{
  movedRows: number;
  postPaymentAudit: PaymentConsolidationAudit;
  postCateringAudit: CateringPaxAudit;
}> {
  const paymentAudit = await auditPaymentConsolidation();
  const cateringAudit = await auditCateringPax();

  if (!apply) {
    return {
      movedRows: 0,
      postPaymentAudit: paymentAudit,
      postCateringAudit: cateringAudit,
    };
  }

  let movedRows = 0;
  for (const latestId of paymentAudit.latestIds) {
    movedRows += await consolidatePaymentsForLatest(latestId, true);
  }

  await zeroCateringPax(cateringAudit.packIds, cateringAudit.bookingIds, true);

  return {
    movedRows,
    postPaymentAudit: await auditPaymentConsolidation(),
    postCateringAudit: await auditCateringPax(),
  };
}
