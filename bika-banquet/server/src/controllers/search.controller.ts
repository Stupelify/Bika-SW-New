import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendError, sendSuccess } from '../utils/response';

export async function searchAll(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string ?? '').trim();
    if (q.length < 2) {
      sendSuccess(res, { bookings: [], customers: [], enquiries: [] });
      return;
    }

    const [bookings, customers, enquiries] = await Promise.all([
      // Bookings — search by function name OR customer name
      prisma.booking.findMany({
        where: {
          isLatest: true,
          OR: [
            { functionName: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        orderBy: { functionDate: 'desc' },
        select: {
          id: true,
          functionName: true,
          functionDate: true,
          customer: { select: { name: true, phone: true } },
        },
      }),

      // Customers — search by name or phone
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { alternatePhone: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, name: true, phone: true },
      }),

      // Enquiries — search by function name or customer name
      prisma.enquiry.findMany({
        where: {
          OR: [
            { functionName: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        orderBy: { functionDate: 'desc' },
        select: {
          id: true,
          functionName: true,
          functionDate: true,
          customer: { select: { name: true } },
        },
      }),
    ]);

    sendSuccess(res, {
      bookings: bookings.map((b) => ({
        id: b.id,
        label: b.functionName,
        secondary: b.customer?.name,
        href: `/dashboard/bookings/${b.id}`,
        type: 'booking',
      })),
      customers: customers.map((c) => ({
        id: c.id,
        label: c.name,
        secondary: c.phone,
        href: `/dashboard/customers/${c.id}`,
        type: 'customer',
      })),
      enquiries: enquiries.map((e) => ({
        id: e.id,
        label: e.functionName,
        secondary: e.customer?.name,
        href: `/dashboard/enquiries/${e.id}`,
        type: 'enquiry',
      })),
    });
  } catch (error) {
    sendError(res, 'Search failed');
  }
}
