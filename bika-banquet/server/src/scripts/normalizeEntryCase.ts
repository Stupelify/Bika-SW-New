import prisma from '../config/database';
import { toEntryCase } from '../utils/textCase';

type RowWithId = Record<string, unknown> & { id: string };

interface NormalizationStats {
  scanned: number;
  updated: number;
  skipped: number;
  conflicts: number;
  failed: number;
}

const EMPTY_STATS: NormalizationStats = {
  scanned: 0,
  updated: 0,
  skipped: 0,
  conflicts: 0,
  failed: 0,
};

function mergeStats(base: NormalizationStats, next: NormalizationStats): NormalizationStats {
  return {
    scanned: base.scanned + next.scanned,
    updated: base.updated + next.updated,
    skipped: base.skipped + next.skipped,
    conflicts: base.conflicts + next.conflicts,
    failed: base.failed + next.failed,
  };
}

function buildNormalizedUpdate(row: RowWithId, fields: string[]): Record<string, string> {
  const data: Record<string, string> = {};
  fields.forEach((field) => {
    const rawValue = row[field];
    if (typeof rawValue !== 'string') return;
    const normalizedValue = toEntryCase(rawValue);
    if (normalizedValue && normalizedValue !== rawValue) {
      data[field] = normalizedValue;
    }
  });
  return data;
}

async function normalizeRows(
  label: string,
  rows: RowWithId[],
  fields: string[],
  update: (id: string, data: Record<string, string>) => Promise<unknown>
): Promise<NormalizationStats> {
  const stats: NormalizationStats = { ...EMPTY_STATS };

  for (const row of rows) {
    stats.scanned += 1;
    const data = buildNormalizedUpdate(row, fields);
    if (Object.keys(data).length === 0) {
      stats.skipped += 1;
      continue;
    }

    try {
      await update(row.id, data);
      stats.updated += 1;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        stats.conflicts += 1;
        continue;
      }
      stats.failed += 1;
      console.error(`[normalize-case] ${label} row ${row.id} failed`, error?.message || error);
    }
  }

  console.log(
    `[normalize-case] ${label}: scanned=${stats.scanned}, updated=${stats.updated}, skipped=${stats.skipped}, conflicts=${stats.conflicts}, failed=${stats.failed}`
  );
  return stats;
}

async function run(): Promise<void> {
  let total = { ...EMPTY_STATS };

  total = mergeStats(
    total,
    await normalizeRows(
      'users',
      await prisma.user.findMany({
        select: { id: true, name: true },
      }),
      ['name'],
      (id, data) => prisma.user.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'roles',
      await prisma.role.findMany({
        select: { id: true, name: true },
      }),
      ['name'],
      (id, data) => prisma.role.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'customers',
      await prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          country: true,
          address: true,
          street1: true,
          street2: true,
          city: true,
          state: true,
          caste: true,
          occupation: true,
          companyName: true,
        },
      }),
      [
        'name',
        'country',
        'address',
        'street1',
        'street2',
        'city',
        'state',
        'caste',
        'occupation',
        'companyName',
      ],
      (id, data) => prisma.customer.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'banquets',
      await prisma.banquet.findMany({
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
          city: true,
          state: true,
          facilities: true,
        },
      }),
      ['name', 'location', 'address', 'city', 'state', 'facilities'],
      (id, data) => prisma.banquet.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'halls',
      await prisma.hall.findMany({
        select: {
          id: true,
          name: true,
          location: true,
          amenities: true,
        },
      }),
      ['name', 'location', 'amenities'],
      (id, data) => prisma.hall.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'meal_slots',
      await prisma.mealSlot.findMany({
        select: {
          id: true,
          name: true,
        },
      }),
      ['name'],
      (id, data) => prisma.mealSlot.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'item_types',
      await prisma.itemType.findMany({
        select: {
          id: true,
          name: true,
        },
      }),
      ['name'],
      (id, data) => prisma.itemType.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'items',
      await prisma.item.findMany({
        select: {
          id: true,
          name: true,
        },
      }),
      ['name'],
      (id, data) => prisma.item.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'template_menus',
      await prisma.templateMenu.findMany({
        select: {
          id: true,
          name: true,
          category: true,
        },
      }),
      ['name', 'category'],
      (id, data) => prisma.templateMenu.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'enquiries',
      await prisma.enquiry.findMany({
        select: {
          id: true,
          functionName: true,
          functionType: true,
          specialRequirements: true,
        },
      }),
      ['functionName', 'functionType', 'specialRequirements'],
      (id, data) => prisma.enquiry.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'bookings',
      await prisma.booking.findMany({
        select: {
          id: true,
          functionName: true,
          functionType: true,
        },
      }),
      ['functionName', 'functionType'],
      (id, data) => prisma.booking.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'booking_packs',
      await prisma.bookingPack.findMany({
        select: {
          id: true,
          packName: true,
          hallName: true,
          boardToRead: true,
          timeSlot: true,
        },
      }),
      ['packName', 'hallName', 'boardToRead', 'timeSlot'],
      (id, data) => prisma.bookingPack.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'booking_menus',
      await prisma.bookingMenu.findMany({
        select: {
          id: true,
          name: true,
        },
      }),
      ['name'],
      (id, data) => prisma.bookingMenu.update({ where: { id }, data })
    )
  );

  total = mergeStats(
    total,
    await normalizeRows(
      'additional_booking_items',
      await prisma.additionalBookingItems.findMany({
        select: {
          id: true,
          description: true,
        },
      }),
      ['description'],
      (id, data) => prisma.additionalBookingItems.update({ where: { id }, data })
    )
  );

  console.log(
    `[normalize-case] TOTAL: scanned=${total.scanned}, updated=${total.updated}, skipped=${total.skipped}, conflicts=${total.conflicts}, failed=${total.failed}`
  );
}

run()
  .catch((error) => {
    console.error('[normalize-case] fatal error', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
