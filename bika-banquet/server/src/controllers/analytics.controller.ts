import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendError, sendSuccess } from '../utils/response';

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

export async function getDashboardSummary(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const range = (req.query.range as string) || '1m';
    const { start, end } = parseRange(range);

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : start;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : end;

    const bookingWhere = {
      functionDate: {
        gte: startDate,
        lte: endDate,
      },
      isLatest: true,
    };

    const [totalCustomers, totalBookings, monthlyTrendsRaw, functionTypesRaw, hallPerformanceRaw, totalRevenue, cancelledBookings] =
      await Promise.all([
        prisma.customer.count(),
        prisma.booking.count({ where: { isLatest: true } }),
        prisma.$queryRaw<Array<{ month: string; bookings: bigint; revenue: number | null }>>`
          SELECT
            to_char("functionDate", 'YYYY-MM') AS month,
            COUNT(*)::bigint AS bookings,
            COALESCE(SUM("grandTotal"), 0) AS revenue
          FROM bookings
          WHERE "isLatest" = true
            AND "functionDate" >= ${startDate}
            AND "functionDate" <= ${endDate}
          GROUP BY to_char("functionDate", 'YYYY-MM')
          ORDER BY month ASC
        `,
        prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
          SELECT
            COALESCE("functionType", 'Unknown') AS name,
            COUNT(*)::bigint AS count
          FROM bookings
          WHERE "isLatest" = true
            AND "functionDate" >= ${startDate}
            AND "functionDate" <= ${endDate}
          GROUP BY "functionType"
          ORDER BY count DESC, name ASC
        `,
        prisma.$queryRaw<Array<{ hallId: string; hallName: string; bookings: bigint }>>`
          SELECT
            h.id AS "hallId",
            h.name AS "hallName",
            COUNT(*)::bigint AS bookings
          FROM booking_halls bh
          INNER JOIN bookings b ON b.id = bh."bookingId"
          INNER JOIN halls h ON h.id = bh."hallId"
          WHERE b."isLatest" = true
            AND b."functionDate" >= ${startDate}
            AND b."functionDate" <= ${endDate}
          GROUP BY h.id, h.name
          ORDER BY bookings DESC, h.name ASC
        `,
        prisma.booking.aggregate({
          _sum: {
            grandTotal: true,
          },
          where: bookingWhere,
        }),
        prisma.booking.count({
          where: {
            ...bookingWhere,
            status: 'cancelled',
          },
        }),
      ]);

    sendSuccess(res, {
      range: {
        startDate,
        endDate,
      },
      summary: {
        totalCustomers,
        totalBookings,
        bookingsInRange: monthlyTrendsRaw.reduce(
          (sum, row) => sum + Number(row.bookings),
          0
        ),
        totalRevenue: totalRevenue._sum.grandTotal || 0,
        cancelledBookings,
      },
      trends: {
        monthly: monthlyTrendsRaw.map((row) => ({
          month: row.month,
          bookings: Number(row.bookings),
          revenue: Number(row.revenue || 0),
        })),
      },
      breakdown: {
        functionTypes: functionTypesRaw.map((row) => ({
          name: row.name,
          count: Number(row.count),
        })),
        hallPerformance: hallPerformanceRaw.map((row) => ({
          hallId: row.hallId,
          hallName: row.hallName,
          bookings: Number(row.bookings),
        })),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch analytics summary');
  }
}
