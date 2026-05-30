/**
 * booking.shared.ts
 * Shared utilities, types, and constants used across booking controller modules.
 */
import path from 'path';
import fs from 'fs';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { parseTimeToHoursMinutes } from '../utils/dateTime';
import { getPdfAsset } from './booking.helpers';
import {
  cancelBookingEventInGoogleCalendar,
  syncBookingEventToGoogleCalendar,
} from '../services/googleCalendar.service';
import { broadcastBookingEvent } from '../sse';
import logger from '../utils/logger';
import { resolvePaymentTotals, resolvePayableTotal } from '@bika/booking-core';

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

export const MONEY_DECIMALS = 2;
export const PERCENT_DECIMALS = 4;

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toOptionalSafeNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function toSafeMoney(value: unknown): number {
  return roundTo(toSafeNumber(value), MONEY_DECIMALS);
}

export function toOptionalSafeMoney(value: unknown): number | undefined {
  const parsed = toOptionalSafeNumber(value);
  if (parsed === undefined) return undefined;
  return roundTo(parsed, MONEY_DECIMALS);
}

export function toOptionalSafePercent(value: unknown): number | undefined {
  const parsed = toOptionalSafeNumber(value);
  if (parsed === undefined) return undefined;
  return roundTo(parsed, PERCENT_DECIMALS);
}

export function firstDefinedValue(...values: unknown[]): unknown {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

export function readDualMoney(
  source: Record<string, unknown>,
  valueKey: string,
  legacyKey: string
): number | undefined {
  return toOptionalSafeMoney(firstDefinedValue(source[valueKey], source[legacyKey]));
}

export function readDualPercent(
  source: Record<string, unknown>,
  valueKey: string,
  legacyKey: string
): number | undefined {
  return toOptionalSafePercent(firstDefinedValue(source[valueKey], source[legacyKey]));
}

export function toStoredNumberString(value: number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return `${value}`;
}

export function toJsonSnapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

// ---------------------------------------------------------------------------
// Transaction helpers
// ---------------------------------------------------------------------------

export async function runSerializableBookingTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const isSerializationFailure =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034';

      if (!isSerializationFailure || attempt === maxAttempts) {
        throw error;
      }

      // Exponential backoff: 50ms, 100ms, 200ms, 400ms between retries
      await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** (attempt - 1)));
    }
  }

  throw new Error('Serializable transaction failed after max retries');
}

export function isHallClashConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2004' &&
    String(error.message).includes('booking_halls_hall_time_range_excl')
  );
}

export function isRetryableSerializableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}

// ---------------------------------------------------------------------------
// Calendar / broadcast helpers
// ---------------------------------------------------------------------------

export function emitBookingCalendarSync(booking: {
  id: string;
  functionName: string;
  functionDate: Date | string;
}): void {
  syncBookingEventToGoogleCalendar(booking).catch((err) =>
    logger.error('Calendar sync failed (non-blocking)', {
      bookingId: booking.id,
      err,
    })
  );
}

export function emitBookingCalendarCancel(bookingId: string): void {
  cancelBookingEventInGoogleCalendar(bookingId).catch((err) =>
    logger.error('Calendar sync failed (non-blocking)', {
      bookingId,
      err,
    })
  );
}

export function emitBookingBroadcast(eventType: string, payload: Record<string, unknown>): void {
  broadcastBookingEvent(eventType, payload);
}

// ---------------------------------------------------------------------------
// Hall input normalization
// ---------------------------------------------------------------------------

export type BookingHallInputRow = {
  hallId: string;
  charges: number;
};

export function normalizeBookingHallRows(value: unknown): BookingHallInputRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const rows = new Map<string, BookingHallInputRow>();
  value.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const hallIdRaw = (entry as { hallId?: unknown }).hallId;
    const hallId = typeof hallIdRaw === 'string' ? hallIdRaw.trim() : '';
    if (!hallId) {
      return;
    }

    const charges = toSafeMoney((entry as { charges?: unknown }).charges);
    const current = rows.get(hallId);
    if (!current) {
      rows.set(hallId, { hallId, charges });
      return;
    }

    // Keep the maximum charge for duplicate hall selections in payload.
    rows.set(hallId, { hallId, charges: Math.max(current.charges, charges) });
  });

  return Array.from(rows.values());
}

export function normalizePackHallIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    )
  );
}

export async function assertSingleBanquetHallSelection(
  tx: Prisma.TransactionClient,
  hallRows: BookingHallInputRow[]
): Promise<void> {
  if (hallRows.length === 0) {
    return;
  }

  const hallIds = hallRows.map((row) => row.hallId);
  const halls = await tx.hall.findMany({
    where: {
      id: {
        in: hallIds,
      },
    },
    select: {
      id: true,
      banquetId: true,
    },
  });

  if (halls.length !== hallIds.length) {
    throw new Error('One or more selected halls are invalid');
  }

  const banquetIds = new Set(halls.map((hall) => hall.banquetId));
  if (banquetIds.size > 1) {
    throw new Error('Selected halls must belong to the same banquet');
  }
}

/** Convert "HH:MM" or "HH:MM:SS" or "H:MM AM/PM" to minutes-since-midnight */
export function parseTimeToMinutes(time: string): number | null {
  if (!time) return null;
  const parsed = parseTimeToHoursMinutes(time);
  if (!parsed) return null;
  return parsed.hours * 60 + parsed.minutes;
}

/**
 * Asserts that none of the given halls are already booked on the same date
 * with an overlapping time window. Cancelled bookings are ignored.
 * When excludeBookingId is provided (update flow), that booking is skipped.
 */
export async function assertNoHallClash(
  tx: Prisma.TransactionClient,
  hallIds: string[],
  functionDate: Date | string,
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  excludeBookingId?: string
): Promise<void> {
  if (hallIds.length === 0) return;

  const date = new Date(functionDate);
  if (Number.isNaN(date.getTime())) return;

  // Build the day boundaries in UTC (dates are stored as UTC midnight)
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  // Fetch existing confirmed/completed bookings on the same date that share a hall
  const now = new Date();
  const clashing = await tx.booking.findMany({
    where: {
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      isLatest: true,
      status: { notIn: ['cancelled'] },
      functionDate: { gte: dayStart, lte: dayEnd },
      halls: { some: { hallId: { in: hallIds } } },
      NOT: { isPencilBooking: true, pencilExpiresAt: { lt: now } },
    },
    select: {
      id: true,
      functionName: true,
      startTime: true,
      endTime: true,
      functionTime: true,
      startDateTime: true,
      endDateTime: true,
      halls: { select: { hall: { select: { id: true, name: true } } } },
    },
  });

  if (clashing.length === 0) return;

  // If we have time info on both the new booking and an existing one, do a
  // proper overlap check. If times are missing, any same-day same-hall booking
  // is treated as a clash (conservative / safe default).
  const newStart = startTime ? parseTimeToMinutes(startTime) : null;
  const newEnd   = endTime   ? parseTimeToMinutes(endTime)   : null;

  const actualClashes = clashing.filter((existing) => {
    const existStart = existing.startTime ? parseTimeToMinutes(existing.startTime) : null;
    const existEnd   = existing.endTime   ? parseTimeToMinutes(existing.endTime)   : null;

    // Shared hall check
    const sharedHallNames = existing.halls
      .filter((bh) => hallIds.includes(bh.hall.id))
      .map((bh) => bh.hall.name);
    if (sharedHallNames.length === 0) return false;

    // If either side has no time info → conservative clash
    if (newStart === null || newEnd === null || existStart === null || existEnd === null) {
      return true;
    }

    // Standard interval overlap: A starts before B ends AND A ends after B starts
    const effectiveNewEnd   = newEnd   > newStart   ? newEnd   : newEnd   + 24 * 60; // overnight
    const effectiveExistEnd = existEnd > existStart ? existEnd : existEnd + 24 * 60;
    return newStart < effectiveExistEnd && effectiveNewEnd > existStart;
  });

  if (actualClashes.length === 0) return;

  const clashDescriptions = actualClashes.map((b) => {
    const timeRange = b.startTime && b.endTime
      ? ` (${b.startTime}–${b.endTime})`
      : b.functionTime ? ` (${b.functionTime})` : '';
    const hallNames = b.halls
      .filter((bh) => hallIds.includes(bh.hall.id))
      .map((bh) => bh.hall.name)
      .join(', ');
    return `"${b.functionName}"${timeRange} in hall(s): ${hallNames}`;
  });

  throw new Error(
    `Hall timing clash detected with existing booking(s): ${clashDescriptions.join(' | ')}. ` +
    'Please choose a different hall or time slot.'
  );
}

// ---------------------------------------------------------------------------
// BOOKING_RELATION_INCLUDE and derived types
// ---------------------------------------------------------------------------

export const BOOKING_RELATION_INCLUDE = {
  customer: true,
  secondCustomer: true,
  halls: {
    include: {
      hall: {
        include: {
          banquet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
  packs: {
    include: {
      mealSlot: true,
      bookingMenu: {
        include: {
          items: {
            include: {
              item: {
                include: {
                  itemType: true,
                },
              },
            },
          },
        },
      },
    },
  },
  additionalItems: true,
  payments: {
    include: {
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  finalizedBooking: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  previousBooking: {
    select: {
      id: true,
      versionNumber: true,
      functionDate: true,
      functionName: true,
      status: true,
      isLatest: true,
    },
  },
  nextVersion: {
    select: {
      id: true,
      versionNumber: true,
      functionDate: true,
      functionName: true,
      status: true,
      isLatest: true,
    },
  },
} as const;

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: typeof BOOKING_RELATION_INCLUDE;
}>;

export function bookingIsImmutable(booking: {
  status: string;
  isLatest: boolean;
}): boolean {
  return booking.status === 'completed' || !booking.isLatest;
}

export function bookingImmutableMessage(booking: {
  status: string;
  isLatest: boolean;
}): string {
  if (booking.status === 'completed') {
    return 'Completed (party over) bookings are read-only';
  }
  return 'Only latest booking versions can be modified';
}

export async function fetchBookingSnapshot(
  tx: Prisma.TransactionClient,
  bookingId: string
): Promise<BookingWithRelations | null> {
  return tx.booking.findUnique({
    where: { id: bookingId },
    include: BOOKING_RELATION_INCLUDE,
  });
}

export async function cloneBookingVersion(
  tx: Prisma.TransactionClient,
  sourceBookingId: string,
  options?: {
    status?: string;
    isQuotation?: boolean;
    quotation?: boolean;
  }
): Promise<BookingWithRelations> {
  const source = await tx.booking.findUnique({
    where: { id: sourceBookingId },
    include: {
      halls: true,
      packs: {
        include: {
          bookingMenu: {
            include: {
              items: true,
            },
          },
        },
      },
      additionalItems: true,
    },
  });

  if (!source) {
    throw new Error('Booking not found');
  }

  const replicaPayable = toSafeMoney(resolvePayableTotal(source));

  const clonedBooking = await tx.booking.create({
    data: {
      customerId: source.customerId,
      secondCustomerId: source.secondCustomerId,
      referredById: source.referredById,
      rating: source.rating,
      secondRating: source.secondRating,
      priority: source.priority,
      secondPriority: source.secondPriority,
      functionName: source.functionName,
      functionType: source.functionType,
      functionDate: source.functionDate,
      functionTime: source.functionTime,
      startTime: source.startTime,
      endTime: source.endTime,
      startDateTime: source.startDateTime,
      endDateTime: source.endDateTime,
      expectedGuests: source.expectedGuests,
      confirmedGuests: source.confirmedGuests,
      totalAmount: source.totalAmount,
      totalBillAmount: source.totalBillAmount,
      totalBillAmountValue: source.totalBillAmountValue,
      finalAmount: source.finalAmount,
      finalAmountValue: source.finalAmountValue,
      discountAmount: source.discountAmount,
      discountPercentage: source.discountPercentage,
      discountAmount2nd: source.discountAmount2nd,
      discountAmount2ndValue: source.discountAmount2ndValue,
      discountPercentage2nd: source.discountPercentage2nd,
      discountPercentage2ndValue: source.discountPercentage2ndValue,
      taxAmount: source.taxAmount,
      grandTotal: source.grandTotal,
      advanceReceived: 0,
      advanceRequired: source.advanceRequired,
      advanceRequiredValue: source.advanceRequiredValue,
      paymentReceivedPercent: toStoredNumberString(0),
      paymentReceivedPercentValue: 0,
      paymentReceivedAmount: toStoredNumberString(0),
      paymentReceivedAmountValue: 0,
      dueAmount: toStoredNumberString(replicaPayable),
      dueAmountValue: replicaPayable,
      balanceAmount: replicaPayable,
      status: options?.status ?? source.status,
      quotation: options?.quotation ?? source.quotation,
      isQuotation: options?.isQuotation ?? source.isQuotation,
      isLatest: true,
      previousBookingId: source.id,
      versionNumber: source.versionNumber + 1,
      notes: source.notes,
      internalNotes: source.internalNotes,
    },
  });

  if (source.halls.length > 0) {
    await tx.bookingHall.createMany({
      data: source.halls.map((hall) => ({
        bookingId: clonedBooking.id,
        hallId: hall.hallId,
        charges: hall.charges,
      })),
    });
  }

  if (source.additionalItems.length > 0) {
    await tx.additionalBookingItems.createMany({
      data: source.additionalItems.map((item) => ({
        bookingId: clonedBooking.id,
        description: item.description,
        charges: item.charges,
        quantity: item.quantity,
        notes: item.notes,
      })),
    });
  }

  for (const pack of source.packs) {
    const newMenu = await tx.bookingMenu.create({
      data: {
        name: pack.bookingMenu?.name || `${pack.packName || 'Menu'} Menu`,
        description: pack.bookingMenu?.description,
        mealSlotId: pack.bookingMenu?.mealSlotId || pack.mealSlotId,
        setupCost: pack.bookingMenu?.setupCost || pack.setupCost || 0,
        ratePerPlate: pack.bookingMenu?.ratePerPlate || pack.ratePerPlate || 0,
      },
    });

    if (pack.bookingMenu?.items?.length) {
      await tx.bookingMenuItems.createMany({
        data: pack.bookingMenu.items.map((entry) => ({
          bookingMenuId: newMenu.id,
          itemId: entry.itemId,
          quantity: entry.quantity || 1,
        })),
      });
    }

    await tx.bookingPack.create({
      data: {
        bookingId: clonedBooking.id,
        mealSlotId: pack.mealSlotId,
        bookingMenuId: newMenu.id,
        noOfPack: pack.noOfPack,
        packName: pack.packName,
        packCount: pack.packCount,
        hallIds: pack.hallIds,
        hallName: pack.hallName,
        ratePerPlate: pack.ratePerPlate,
        setupCost: pack.setupCost,
        startTime: pack.startTime,
        endTime: pack.endTime,
        startDateTime: pack.startDateTime,
        endDateTime: pack.endDateTime,
        extraPlate: pack.extraPlate,
        extraRate: pack.extraRate,
        extraRateValue: pack.extraRateValue,
        extraAmount: pack.extraAmount,
        extraAmountValue: pack.extraAmountValue,
        menuPoint: pack.menuPoint,
        hallRate: pack.hallRate,
        hallRateValue: pack.hallRateValue,
        boardToRead: pack.boardToRead,
        extraCharges: pack.extraCharges,
        timeSlot: pack.timeSlot,
        tags: pack.tags,
        notes: pack.notes,
      },
    });
  }

  // Payments intentionally NOT copied to the new version.
  // Each booking version owns only the payments recorded during its own lifetime.
  // The financial summary (paymentReceivedAmountValue) is already carried forward
  // in the cloned booking row above, which preserves the "balance from prior version".

  const hydratedClone = await tx.booking.findUnique({
    where: { id: clonedBooking.id },
    include: BOOKING_RELATION_INCLUDE,
  });

  if (!hydratedClone) {
    throw new Error('Failed to clone booking');
  }

  return hydratedClone;
}

export async function recalculateBookingFinancials(
  tx: Prisma.TransactionClient,
  bookingId: string,
  options?: {
    carryForwardMealsDiscount?: number;
  }
): Promise<void> {
  const {
    mapPackLineForSumBooking,
    resolveBookingFinancials,
    splitMealsAndExtrasSubtotals,
  } = await import('./booking.financials');
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: {
      halls: {
        select: {
          charges: true,
        },
      },
      packs: {
        select: {
          packCount: true,
          noOfPack: true,
          ratePerPlate: true,
          setupCost: true,
          extraCharges: true,
          hallRate: true,
          hallRateValue: true,
        },
      },
      additionalItems: {
        select: {
          charges: true,
          quantity: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  const lineTotals = splitMealsAndExtrasSubtotals({
    halls: booking.halls,
    packs: booking.packs.map((p) => mapPackLineForSumBooking(p)),
    additionalItems: booking.additionalItems,
  });
  const effectiveDiscountPercent = toOptionalSafePercent(booking.discountPercentage) || 0;
  const financials = resolveBookingFinancials({
    totalAmount: lineTotals.totalAmount,
    extrasSubtotal: lineTotals.extrasSubtotal,
    discountPercentage: effectiveDiscountPercent,
    discountAmountInput: toSafeMoney(booking.discountAmount),
    ...(options?.carryForwardMealsDiscount != null
      ? { carryForwardMealsDiscount: options.carryForwardMealsDiscount }
      : {
          finalAmountInput:
            booking.finalAmountValue ??
            toOptionalSafeMoney(booking.finalAmount) ??
            undefined,
        }),
  });
  const { discountAmount, discountPercentage, grandTotal, finalAmountValue } =
    financials;
  const dbPayments = await tx.bookingPayments.findMany({
    where: { bookingId },
    select: { method: true, amount: true, clearingDate: true },
  });
  const { grossReceived, dueAmount: dueAmountValue } = resolvePaymentTotals(
    finalAmountValue,
    dbPayments
  );
  const balanceAmount = dueAmountValue;

  await tx.booking.update({
    where: { id: bookingId },
    data: {
      totalAmount: lineTotals.totalAmount,
      totalBillAmount: toStoredNumberString(lineTotals.totalAmount),
      totalBillAmountValue: lineTotals.totalAmount,
      discountAmount,
      discountPercentage,
      grandTotal,
      finalAmount: toStoredNumberString(finalAmountValue),
      finalAmountValue,
      dueAmount: toStoredNumberString(dueAmountValue),
      dueAmountValue,
      balanceAmount,
      paymentReceivedAmount: toStoredNumberString(grossReceived),
      paymentReceivedAmountValue: grossReceived,
      advanceReceived: grossReceived,
    },
  });
}

export async function resolveMealSlotId(
  tx: Prisma.TransactionClient,
  pack: {
    mealSlotId?: string;
    packName?: string;
    startTime?: string;
    endTime?: string;
  }
): Promise<string> {
  if (pack.mealSlotId) {
    return pack.mealSlotId;
  }

  const normalizedPackName = (pack.packName || 'General').trim();
  const existingByName = await tx.mealSlot.findFirst({
    where: {
      name: {
        equals: normalizedPackName,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  if (existingByName) {
    return existingByName.id;
  }

  const created = await tx.mealSlot.create({
    data: {
      name: normalizedPackName || `Slot-${Date.now()}`,
      startTime: pack.startTime || '00:00',
      endTime: pack.endTime || '23:59',
      isActive: true,
      displayOrder: 0,
    },
    select: { id: true },
  });

  return created.id;
}

// ---------------------------------------------------------------------------
// PDF asset helpers (used in booking.pdf.ts)
// ---------------------------------------------------------------------------

// Directory for locally stored PDF assets (background + logo).
// Place background.png and logo.png here — the uploads volume is already mounted
// on the VPS so images survive container rebuilds.
export const PDF_ASSETS_DIR =
  process.env.PDF_ASSETS_DIR || path.join(process.cwd(), 'uploads', 'pdf');

// Fallback URLs used only when local files are missing.
export const MENU_BACKGROUND_IMAGE_URL = process.env.MENU_PDF_BACKGROUND_URL || '';
export const MENU_LOGO_IMAGE_URL = process.env.MENU_PDF_LOGO_URL || '';

export async function loadPdfAsset(localFilename: string, fallbackUrl: string): Promise<Buffer | null> {
  try {
    const localPath = path.join(PDF_ASSETS_DIR, localFilename);
    if (fs.existsSync(localPath)) {
      logger.debug('Loaded PDF asset from local file', { path: localPath });
      return fs.readFileSync(localPath);
    }
  } catch (error) {
    logger.error('Failed to load local PDF asset', { filename: localFilename, error });
  }

  if (!fallbackUrl) return null;
  try {
    const response = await fetch(fallbackUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BikaBanquet/1.0)' },
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export function getMenuBackgroundImage(): Promise<Buffer | null> {
  return getPdfAsset('background.png', () =>
    loadPdfAsset('background.png', MENU_BACKGROUND_IMAGE_URL)
  );
}

export function getMenuLogoImage(): Promise<Buffer | null> {
  return getPdfAsset('logo.png', () =>
    loadPdfAsset('logo.png', MENU_LOGO_IMAGE_URL)
  );
}
