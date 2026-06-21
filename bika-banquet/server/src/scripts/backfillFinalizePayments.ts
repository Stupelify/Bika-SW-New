/**
 * One-time repair for finalize payment scatter + catering-off spurious pax.
 *
 * Usage:
 *   npx tsx src/scripts/backfillFinalizePayments.ts           # dry-run (default)
 *   npx tsx src/scripts/backfillFinalizePayments.ts --apply
 */
import prisma from '../config/database';
import {
  auditCateringPax,
  auditPaymentConsolidation,
  runBackfillFinalizePayments,
} from './backfillFinalizePayments.lib';

function parseArgs(): { apply: boolean } {
  return { apply: process.argv.includes('--apply') };
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

  const result = await runBackfillFinalizePayments(true);

  console.log('[backfill-finalize] Apply complete');
  console.log(`  moved payment rows=${result.movedRows}`);
  console.log(
    `  post-audit stranded chains=${result.postPaymentAudit.stats.chainsWithStrandedPayments}, spurious packs=${result.postCateringAudit.packIds.length}`
  );

  if (
    result.postPaymentAudit.stats.chainsWithStrandedPayments > 0 ||
    result.postCateringAudit.packIds.length > 0
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
