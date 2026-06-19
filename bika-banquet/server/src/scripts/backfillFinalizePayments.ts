/**
 * One-time repair for finalize payment scatter + catering-off spurious pax.
 *
 * Usage:
 *   npx tsx src/scripts/backfillFinalizePayments.ts           # dry-run (default)
 *   npx tsx src/scripts/backfillFinalizePayments.ts --apply
 */
import prisma from '../config/database';
import { resolveVersionChain } from '../controllers/booking.helpers';
import { recalculateBookingFinancials, toStoredNumberString } from '../controllers/booking.shared';
import { resolvePayableTotal, resolvePaymentTotals } from '@bika/booking-core';

interface AuditStats {
  chainsWithStrandedPayments: number;
  paymentRowsToMove: number;
  rupeesToMove: number;
  cateringPacksToZero: number;
  bookingsToRecalc: number;
}

function parseArgs(): { apply: boolean } {
  return { apply: process.argv.includes('--apply') };
}

async function auditPaymentConsolidation(): Promise<{
  latestIds: string[];
  stats: Pick<AuditStats, 'chainsWithStrandedPayments' | 'paymentRowsToMove' | 'rupeesToMove'>;
}> {
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

async function auditCateringPax(): Promise<{
  packIds: string[];
  bookingIds: string[];
}> {
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

async function consolidatePaymentsForLatest(
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

async function zeroCateringPax(packIds: string[], bookingIds: string[], apply: boolean): Promise<void> {
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

async function run(): Promise<void> {
  const { apply } = parseArgs();
  console.log(`[backfill-finalize] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);

  const paymentAudit = await auditPaymentConsolidation();
  const cateringAudit = await auditCateringPax();

  console.log('[backfill-finalize] Repair A — payment consolidation');
  console.log(
    `  chains=${paymentAudit.stats.chainsWithStrandedPayments}, rows=${paymentAudit.stats.paymentRowsToMove}, rupees≈${Math.round(paymentAudit.stats.rupeesToMove)}`
  );

  console.log('[backfill-finalize] Repair B — catering-off spurious pax');
  console.log(
    `  packs=${cateringAudit.packIds.length}, bookings=${cateringAudit.bookingIds.length}`
  );

  if (!apply) {
    console.log('[backfill-finalize] Dry-run complete. Re-run with --apply to execute.');
    return;
  }

  let movedRows = 0;
  for (const latestId of paymentAudit.latestIds) {
    movedRows += await consolidatePaymentsForLatest(latestId, true);
  }

  await zeroCateringPax(cateringAudit.packIds, cateringAudit.bookingIds, true);

  const postPaymentAudit = await auditPaymentConsolidation();
  const postCateringAudit = await auditCateringPax();

  console.log('[backfill-finalize] Apply complete');
  console.log(`  moved payment rows=${movedRows}`);
  console.log(
    `  post-audit stranded chains=${postPaymentAudit.stats.chainsWithStrandedPayments}, spurious packs=${postCateringAudit.packIds.length}`
  );

  if (
    postPaymentAudit.stats.chainsWithStrandedPayments > 0 ||
    postCateringAudit.packIds.length > 0
  ) {
    process.exitCode = 1;
  }
}

run()
  .catch((error) => {
    console.error('[backfill-finalize] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
