/**
 * booking.read.ts
 * Read-only (GET) booking handlers.
 */
import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { sanitizeSearchTerm } from '../utils/search';
import { parsePagination } from '../utils/pagination';
import { buildOrderBy, SortWhitelist } from '../utils/listQuery';
import { resolveVersionChain } from './booking.helpers';
import {
  BOOKING_RELATION_INCLUDE,
  parseTimeToMinutes,
} from './booking.shared';
import {
  getVenueScope,
  withBookingBanquetScope,
} from '../utils/banquetAccess';

// Maps bookings-page + payments-page sortable column keys → Prisma orderBy.
// Payments sorts by the stored DB *Value columns (NOT JS-recomputed values).
// An `id` tie-breaker is appended centrally by buildOrderBy.
const BOOKING_SORT_WHITELIST: SortWhitelist = {
  // bookings list
  functionName: (order) => [{ functionName: order }, { functionType: order }],
  customer: (order) => [{ customer: { name: order } }],
  functionDate: (order) => [{ functionDate: order }],
  expectedGuests: (order) => [{ expectedGuests: order }],
  status: (order) => [{ status: order }],
  grandTotal: (order) => [{ grandTotal: order }],
  // payments list (booking = composite name/customer; reuse functionName)
  booking: (order) => [{ functionName: order }],
  eventDate: (order) => [{ functionDate: order }],
  total: (order) => [{ grandTotal: order }],
  received: (order) => [{ paymentReceivedAmountValue: order }],
  balance: (order) => [{ dueAmountValue: order }],
  entries: (order) => [{ payments: { _count: order } }],
};

/**
 * GET /bookings/check-hall-availability
 * Query params: hallIds (comma-separated), date (ISO string),
 *               startTime, endTime, excludeBookingId (optional)
 * Returns: { available: boolean, clashes: [...] }
 */
export async function checkHallAvailability(
  req: Request,
  res: Response
): Promise<void> {
  const { date, startTime, endTime, excludeBookingId } = req.query as Record<string, string>;
  const hallIdsRaw = req.query.hallIds;

  if (!hallIdsRaw || !date) {
    sendError(res, 'hallIds and date are required', 400);
    return;
  }

  const hallIds = Array.isArray(hallIdsRaw)
    ? (hallIdsRaw as string[]).map((id) => id.trim()).filter(Boolean)
    : typeof hallIdsRaw === 'string'
      ? hallIdsRaw.split(',').map((id) => id.trim()).filter(Boolean)
      : [];
  if (hallIds.length === 0) {
    sendSuccess(res, { available: true, clashes: [] });
    return;
  }

  // Accept both UUID-style and legacy integer IDs (same pattern as idSchema)
  const VALID_ID_RE = /^[A-Za-z0-9][A-Za-z0-9-]*$/;
  if (!hallIds.every((id) => VALID_ID_RE.test(id))) {
    sendError(res, 'One or more hall IDs are invalid', 400);
    return;
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    sendError(res, 'Invalid date', 400);
    return;
  }

  const dayStart = new Date(parsedDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(parsedDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const nowCheck = new Date();
  const clashing = await prisma.booking.findMany({
    where: {
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      isLatest: true,
      status: { notIn: ['cancelled'] },
      functionDate: { gte: dayStart, lte: dayEnd },
      halls: { some: { hallId: { in: hallIds } } },
      NOT: { isPencilBooking: true, pencilExpiresAt: { lt: nowCheck } },
    },
    select: {
      id: true,
      functionName: true,
      functionType: true,
      startTime: true,
      endTime: true,
      functionTime: true,
      status: true,
      isPencilBooking: true,
      pencilExpiresAt: true,
      halls: { select: { hall: { select: { id: true, name: true } } } },
    },
  });

  const newStart = startTime ? parseTimeToMinutes(startTime) : null;
  const newEnd   = endTime   ? parseTimeToMinutes(endTime)   : null;

  const clashes = clashing.filter((existing) => {
    const existStart = existing.startTime ? parseTimeToMinutes(existing.startTime) : null;
    const existEnd   = existing.endTime   ? parseTimeToMinutes(existing.endTime)   : null;
    const sharedHalls = existing.halls.filter((bh) => hallIds.includes(bh.hall.id));
    if (sharedHalls.length === 0) return false;
    if (newStart === null || newEnd === null || existStart === null || existEnd === null) return true;
    const effectiveNewEnd   = newEnd   > newStart   ? newEnd   : newEnd   + 24 * 60;
    const effectiveExistEnd = existEnd > existStart ? existEnd : existEnd + 24 * 60;
    return newStart < effectiveExistEnd && effectiveNewEnd > existStart;
  }).map((b) => ({
    bookingId: b.id,
    functionName: b.functionName,
    functionType: b.functionType,
    startTime: b.startTime,
    endTime: b.endTime,
    functionTime: b.functionTime,
    status: b.status,
    isPencilBooking: b.isPencilBooking,
    pencilExpiresAt: b.pencilExpiresAt,
    clashingHalls: b.halls
      .filter((bh) => hallIds.includes(bh.hall.id))
      .map((bh) => ({ id: bh.hall.id, name: bh.hall.name })),
  }));

  sendSuccess(res, { available: clashes.length === 0, clashes });
}

/**
 * Count bookings — lightweight endpoint for nav badges
 * ?status=outstanding → confirmed bookings with dueAmountValue > 0
 * ?status=<any>       → bookings matching that status
 */
export async function getBookingCount(req: Request, res: Response): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const where: any = { isLatest: true };
    if (status === 'outstanding') {
      where.status = { in: ['confirmed', 'pending'] };
      where.dueAmountValue = { gt: 0 };
    } else if (status) {
      where.status = status;
    }
    const count = await prisma.booking.count({ where });
    sendSuccess(res, { count });
  } catch (error) {
    sendError(res, 'Failed to get booking count');
  }
}

/**
 * Get all bookings with filters
 */
export async function getBookings(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(
      req.query.page,
      req.query.limit,
      20,
      200
    );
    const status = req.query.status as string;
    const search = sanitizeSearchTerm(req.query.search);
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    // Only filter by isQuotation when the param is explicitly provided.
    // The boolean conversion `=== 'true'` always produces false when the param
    // is absent, which incorrectly excludes all quotation bookings by default.
    const isQuotationRaw = req.query.isQuotation as string | undefined;

    // Build where clause
    const where: any = { isLatest: true };

    // Banquet access restriction: if user has specific banquets, only show bookings for those halls
    const authReq = req as AuthRequest;
    const scope = getVenueScope(authReq);
    if (!scope.allVenues) {
      where.halls = { some: { hall: { banquetId: { in: scope.banquetIds } } } };
    }

    if (status) {
      where.status = status;
    }

    if (isQuotationRaw !== undefined) {
      where.isQuotation = isQuotationRaw === 'true';
    }

    if (search) {
      where.OR = [
        { functionName: { contains: search, mode: 'insensitive' } },
        { functionType: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        // customer.email added so server search is a strict SUPERSET of the
        // client-side search (the customer column accessor includes email).
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
        { customer: { phoneE164: { contains: search } } },
        { customer: { alterPhone: { contains: search } } },
        { customer: { alternatePhone: { contains: search } } },
        { customer: { alternatePhoneE164: { contains: search } } },
        { customer: { whatsapp: { contains: search } } },
        { customer: { whatsappNumber: { contains: search } } },
        { customer: { whatsappE164: { contains: search } } },
      ];
    }

    const parseDateParam = (value?: string) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const fromParsed = parseDateParam(fromDate);
    const toParsed = parseDateParam(toDate);
    if (fromDate && !fromParsed) {
      sendError(res, 'Invalid fromDate', 400);
      return;
    }
    if (toDate && !toParsed) {
      sendError(res, 'Invalid toDate', 400);
      return;
    }

    if (fromParsed || toParsed) {
      where.functionDate = {};
      if (fromParsed) {
        where.functionDate.gte = fromParsed;
      }
      if (toParsed) {
        where.functionDate.lte = toParsed;
      }
    }

    // Stable, whitelisted server sort with `id` tie-breaker. Default order
    // (functionDate desc) is preserved when no sort param is supplied — both
    // the bookings list and the payments list drive this endpoint.
    const orderBy = buildOrderBy(
      req.query.sort,
      req.query.order,
      BOOKING_SORT_WHITELIST,
      [{ functionDate: 'desc' }]
    );

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy as any,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          halls: {
            include: {
              hall: {
                select: {
                  id: true,
                  name: true,
                  banquet: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              payments: true,
              packs: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    sendSuccess(res, {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch bookings');
  }
}

/**
 * Get booking by ID
 */
export async function getBookingById(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const scope = getVenueScope(req);

    const booking = await prisma.booking.findFirst({
      where: withBookingBanquetScope({ id }, scope),
      include: BOOKING_RELATION_INCLUDE,
    });

    if (!booking) {
      sendNotFound(res, 'Booking not found');
      return;
    }

    sendSuccess(res, { booking });
  } catch (error) {
    sendError(res, 'Failed to fetch booking');
  }
}

/**
 * Get complete booking version history (latest to oldest).
 */
export async function getBookingHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const scope = getVenueScope(req);

    const anchor = await prisma.booking.findFirst({
      where: withBookingBanquetScope({ id }, scope),
      select: {
        id: true,
      },
    });

    if (!anchor) {
      sendNotFound(res, 'Booking not found');
      return;
    }

    const lineageIds = await resolveVersionChain(anchor.id);

    const versions = await prisma.booking.findMany({
      where: {
        id: {
          in: lineageIds,
        },
      },
      include: BOOKING_RELATION_INCLUDE,
      orderBy: {
        versionNumber: 'desc',
      },
    });

    const history = versions.map((version) => {
      const finalizedByUser =
        ((version.finalizedBooking as any)?.finalizedByUser as
          | { id: string; name: string | null; email: string }
          | null
          | undefined) ??
        ((version.finalizedBooking as any)?.user as
          | { id: string; name: string | null; email: string }
          | null
          | undefined) ??
        null;

      return {
        ...version,
        finalizedMeta: version.finalizedBooking
          ? {
              finalizedAt: version.finalizedBooking.finalizedAt,
              finalizedBy: finalizedByUser
                ? {
                    id: finalizedByUser.id,
                    name: finalizedByUser.name,
                    email: finalizedByUser.email,
                  }
                : null,
            }
          : null,
        snapshotData: version.finalizedBooking?.data || null,
      };
    });

    sendSuccess(res, {
      bookingId: id,
      history,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch booking history');
  }
}
