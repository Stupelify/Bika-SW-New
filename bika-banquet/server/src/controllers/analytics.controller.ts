import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendError, sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getVenueScope,
  withBookingBanquetScope,
} from '../utils/banquetAccess';

function parseRange(range?: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);

  switch (range) {
    case '1m':
      start.setMonth(end.getMonth() - 1);
      break;
    case '3m':
      start.setMonth(end.getMonth() - 3);
      break;
    case '6m':
      start.setMonth(end.getMonth() - 6);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2000);
      break;
    default:
      start.setMonth(end.getMonth() - 1);
      break;
  }

  return { start, end };
}

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function getDashboardSummary(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const scope = getVenueScope(authReq);
    const range = (req.query.range as string) || '1m';
    const { start, end } = parseRange(range);

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : start;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : end;

    const scopedLatestWhere = withBookingBanquetScope(
      {
        isLatest: true,
      },
      scope
    );

    const scopedRangeWhere = withBookingBanquetScope(
      {
        isLatest: true,
        functionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      scope
    );

    const [allScopedBookings, rangedBookings] = await Promise.all([
      prisma.booking.findMany({
        where: scopedLatestWhere,
        select: {
          id: true,
          customerId: true,
        },
      }),
      prisma.booking.findMany({
        where: scopedRangeWhere,
        select: {
          id: true,
          functionDate: true,
          functionType: true,
          grandTotal: true,
          status: true,
          halls: {
            select: {
              hall: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const monthlyMap = new Map<string, { bookings: number; revenue: number }>();
    const functionTypeMap = new Map<string, number>();
    const hallMap = new Map<string, { hallName: string; bookings: number }>();

    let totalRevenue = 0;
    let cancelledBookings = 0;

    for (const booking of rangedBookings) {
      const monthKey = toMonthKey(new Date(booking.functionDate));
      const monthEntry = monthlyMap.get(monthKey) || { bookings: 0, revenue: 0 };
      monthEntry.bookings += 1;
      monthEntry.revenue += Number(booking.grandTotal || 0);
      monthlyMap.set(monthKey, monthEntry);

      const functionType = booking.functionType || 'Unknown';
      functionTypeMap.set(functionType, (functionTypeMap.get(functionType) || 0) + 1);

      for (const hallEntry of booking.halls) {
        if (!hallEntry.hall) continue;
        const current = hallMap.get(hallEntry.hall.id) || {
          hallName: hallEntry.hall.name,
          bookings: 0,
        };
        current.bookings += 1;
        hallMap.set(hallEntry.hall.id, current);
      }

      totalRevenue += Number(booking.grandTotal || 0);
      if (booking.status === 'cancelled') {
        cancelledBookings += 1;
      }
    }

    sendSuccess(res, {
      range: {
        startDate,
        endDate,
      },
      summary: {
        totalCustomers: new Set(allScopedBookings.map((booking) => booking.customerId)).size,
        totalBookings: allScopedBookings.length,
        bookingsInRange: rangedBookings.length,
        totalRevenue,
        cancelledBookings,
      },
      trends: {
        monthly: Array.from(monthlyMap.entries())
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([month, value]) => ({
            month,
            bookings: value.bookings,
            revenue: value.revenue,
          })),
      },
      breakdown: {
        functionTypes: Array.from(functionTypeMap.entries())
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .map(([name, count]) => ({
            name,
            count,
          })),
        hallPerformance: Array.from(hallMap.entries())
          .sort((left, right) => right[1].bookings - left[1].bookings || left[1].hallName.localeCompare(right[1].hallName))
          .map(([hallId, value]) => ({
            hallId,
            hallName: value.hallName,
            bookings: value.bookings,
          })),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch analytics summary');
  }
}
