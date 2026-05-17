import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { sendError, sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllowedBanquetIds,
  withBookingBanquetScope,
  withEnquiryBanquetScope,
} from '../utils/banquetAccess';

function buildBookingEditorHref(id: string): string {
  return `/dashboard/bookings?section=edit&id=${encodeURIComponent(id)}`;
}

function buildEnquiryEditorHref(id: string): string {
  return `/dashboard/enquiries?section=edit&id=${encodeURIComponent(id)}`;
}

export async function searchAll(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const permissions = authReq.user?.permissions || [];
    const allowedBanquetIds = getAllowedBanquetIds(authReq);
    const q = (req.query.q as string ?? '').trim();
    if (q.length < 2) {
      sendSuccess(res, { bookings: [], customers: [], enquiries: [] });
      return;
    }

    const canSearchBookings = permissions.some((permission) =>
      ['view_booking', 'add_booking', 'edit_booking', 'manage_bookings'].includes(permission)
    );
    const canSearchCustomers = permissions.some((permission) =>
      ['view_customer', 'add_customer', 'edit_customer', 'manage_customers'].includes(permission)
    );
    const canSearchEnquiries = permissions.some((permission) =>
      ['view_enquiry', 'add_enquiry', 'edit_enquiry', 'manage_enquiries'].includes(permission)
    );

    const bookingWhere = withBookingBanquetScope(
      {
        isLatest: true,
        OR: [
          { functionName: { contains: q, mode: 'insensitive' as const } },
          { customer: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      },
      allowedBanquetIds
    ) as Prisma.BookingWhereInput;

    const enquiryWhere = withEnquiryBanquetScope(
      {
        OR: [
          { functionName: { contains: q, mode: 'insensitive' as const } },
          { customer: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      },
      allowedBanquetIds
    ) as Prisma.EnquiryWhereInput;

    const bookings = canSearchBookings
      ? await prisma.booking.findMany({
          where: bookingWhere,
          take: 5,
          orderBy: { functionDate: 'desc' },
          select: {
            id: true,
            functionName: true,
            functionDate: true,
            customer: { select: { name: true, phone: true } },
          },
        })
      : [];

    const customers = canSearchCustomers
      ? await prisma.customer.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q } },
              { alternatePhone: { contains: q } },
            ],
          },
          take: 5,
          select: { id: true, name: true, phone: true },
        })
      : [];

    const enquiries = canSearchEnquiries
      ? await prisma.enquiry.findMany({
          where: enquiryWhere,
          take: 5,
          orderBy: { functionDate: 'desc' },
          select: {
            id: true,
            functionName: true,
            functionDate: true,
            customer: { select: { name: true } },
          },
        })
      : [];

    sendSuccess(res, {
      bookings: bookings.map((b) => ({
        id: b.id,
        label: b.functionName,
        secondary: b.customer?.name,
        href: buildBookingEditorHref(b.id),
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
        href: buildEnquiryEditorHref(e.id),
        type: 'enquiry',
      })),
    });
  } catch (error) {
    sendError(res, 'Search failed');
  }
}
