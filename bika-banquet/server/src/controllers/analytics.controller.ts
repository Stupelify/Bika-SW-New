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

    const [totalCustomers, totalBookings, bookingsInRange, totalRevenue] =
      await Promise.all([
        prisma.customer.count(),
        prisma.booking.count({ where: { isLatest: true } }),
        prisma.booking.findMany({
          where: bookingWhere,
          select: {
            id: true,
            functionDate: true,
            functionType: true,
            grandTotal: true,
            status: true,
            halls: {
              include: {
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
        prisma.booking.aggregate({
          _sum: {
            grandTotal: true,
          },
          where: bookingWhere,
        }),
      ]);

    const monthlyMap = new Map<string, { revenue: number; bookings: number }>();
    const functionTypeMap = new Map<string, number>();
    const hallMap = new Map<string, { name: string; bookings: number }>();

    bookingsInRange.forEach((booking) => {
      const month = new Date(booking.functionDate).toISOString().slice(0, 7);
      const monthStat = monthlyMap.get(month) || { revenue: 0, bookings: 0 };
      monthStat.bookings += 1;
      monthStat.revenue += booking.grandTotal || 0;
      monthlyMap.set(month, monthStat);

      functionTypeMap.set(
        booking.functionType,
        (functionTypeMap.get(booking.functionType) || 0) + 1
      );

      booking.halls.forEach((bookingHall) => {
        const hallId = bookingHall.hall.id;
        const hallStat = hallMap.get(hallId) || {
          name: bookingHall.hall.name,
          bookings: 0,
        };
        hallStat.bookings += 1;
        hallMap.set(hallId, hallStat);
      });
    });

    const monthlyTrends = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, stat]) => ({
        month,
        bookings: stat.bookings,
        revenue: stat.revenue,
      }));

    const functionTypes = Array.from(functionTypeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const hallPerformance = Array.from(hallMap.entries())
      .map(([id, stat]) => ({
        hallId: id,
        hallName: stat.name,
        bookings: stat.bookings,
      }))
      .sort((a, b) => b.bookings - a.bookings);

    const cancelledBookings = bookingsInRange.filter(
      (booking) => booking.status === 'cancelled'
    ).length;

    sendSuccess(res, {
      range: {
        startDate,
        endDate,
      },
      summary: {
        totalCustomers,
        totalBookings,
        bookingsInRange: bookingsInRange.length,
        totalRevenue: totalRevenue._sum.grandTotal || 0,
        cancelledBookings,
      },
      trends: {
        monthly: monthlyTrends,
      },
      breakdown: {
        functionTypes,
        hallPerformance,
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch analytics summary');
  }
}
