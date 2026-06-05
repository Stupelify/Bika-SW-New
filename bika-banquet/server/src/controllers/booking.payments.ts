/**
 * booking.payments.ts
 * Payment handlers: add, update payments on a booking.
 */
import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { idSchema } from '../utils/validation';
import { createAuditLog } from '../utils/auditLog';
import { resolvePaymentTotals, resolvePayableTotal } from '@bika/booking-core';
import {
  toSafeMoney,
  toStoredNumberString,
  bookingIsImmutable,
  bookingImmutableMessage,
} from './booking.shared';
import {
  getVenueScope,
  withBookingBanquetScope,
} from '../utils/banquetAccess';

const PAYMENT_METHODS = ['cash', 'card', 'upi', 'cheque', 'bank_transfer'] as const;

export const addPaymentSchema = z.object({
  params: z.object({ id: idSchema('booking ID') }),
  body: z.object({
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than zero'),
    method: z
      .enum(PAYMENT_METHODS, {
        errorMap: () => ({
          message: `Method must be one of: ${PAYMENT_METHODS.join(', ')}`,
        }),
      })
      .optional()
      .default('cash'),
    reference: z.string().max(200, 'Reference must be at most 200 characters').optional(),
    narration: z.string().max(500, 'Narration must be at most 500 characters').optional(),
    paymentDate: z
      .string()
      .refine((v) => !Number.isNaN(new Date(v).getTime()), {
        message: 'Payment date must be a valid date',
      })
      .optional(),
    clearingDate: z
      .string()
      .refine((v) => !Number.isNaN(new Date(v).getTime()), {
        message: 'Clearing date must be a valid date',
      })
      .optional(),
  }),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    id: idSchema('booking ID'),
    paymentId: idSchema('payment ID'),
  }),
  body: z.object({
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than zero')
      .optional(),
    method: z
      .enum(PAYMENT_METHODS, {
        errorMap: () => ({
          message: `Method must be one of: ${PAYMENT_METHODS.join(', ')}`,
        }),
      })
      .optional(),
    reference: z.string().max(200, 'Reference must be at most 200 characters').optional(),
    narration: z.string().max(500, 'Narration must be at most 500 characters').optional(),
    paymentDate: z
      .string()
      .refine((v) => !Number.isNaN(new Date(v).getTime()), {
        message: 'Payment date must be a valid date',
      })
      .optional(),
    clearingDate: z
      .string()
      .refine((v) => !Number.isNaN(new Date(v).getTime()), {
        message: 'Clearing date must be a valid date',
      })
      .optional(),
  }),
});

/**
 * Add payment to booking
 */
export async function addPayment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { amount, method, reference, narration, paymentDate, clearingDate } = req.body;
    const normalizedAmount = toSafeMoney(amount);
    const scope = getVenueScope(req);

    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Verify booking exists and is mutable BEFORE creating the payment so we
      // never leave an orphaned payment record on a non-latest or immutable booking.
      const booking = await tx.booking.findFirst({
        where: withBookingBanquetScope({ id }, scope),
        select: {
          id: true,
          status: true,
          isLatest: true,
          finalAmountValue: true,
          finalAmount: true,
          grandTotal: true,
        },
      });

      if (!booking) {
        throw Object.assign(new Error('Booking not found'), { status: 404 });
      }
      if (!booking.isLatest) {
        throw Object.assign(
          new Error('Only latest booking versions can be modified'),
          { status: 400 }
        );
      }
      if (bookingIsImmutable(booking)) {
        throw Object.assign(new Error(bookingImmutableMessage(booking)), { status: 400 });
      }

      // Create payment
      const newPayment = await tx.bookingPayments.create({
        data: {
          bookingId: id,
          receivedBy: req.user!.userId,
          amount: normalizedAmount,
          method,
          reference,
          narration,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          clearingDate: clearingDate ? new Date(clearingDate) : undefined,
        },
      });

      // Authoritative totals: gross received vs credited toward due (cheque clearing).
      const dbPayments = await tx.bookingPayments.findMany({
        where: { bookingId: id },
        select: { method: true, amount: true, clearingDate: true },
      });
      const currentFinal = resolvePayableTotal(booking);
      const { grossReceived, dueAmount: updatedDue } = resolvePaymentTotals(
        currentFinal,
        dbPayments
      );

      await tx.booking.update({
        where: { id },
        data: {
          paymentReceivedAmount: toStoredNumberString(grossReceived),
          paymentReceivedAmountValue: grossReceived,
          dueAmount: toStoredNumberString(updatedDue),
          dueAmountValue: updatedDue,
        },
      });

      return newPayment;
    });

    void createAuditLog(req, 'CREATE', 'payment', payment.id, `Payment for booking ${id}`);
    sendSuccess(res, { payment }, 'Payment added successfully', 201);
  } catch (error: any) {
    if (error?.status === 404) {
      sendError(res, error.message, 404);
      return;
    }
    if (
      error?.status === 400 ||
      (error instanceof Error &&
        (error.message === 'Completed (party over) bookings are read-only' ||
          error.message === 'Only latest booking versions can be modified'))
    ) {
      sendError(res, error.message, 400);
      return;
    }
    sendError(res, 'Failed to add payment');
  }
}

/**
 * Correct an existing payment record (no hard deletes — ledger is append-only).
 * PATCH /bookings/:id/payments/:paymentId
 *
 * Accepts: amount, method, narration (correction note), paymentDate, reference.
 * After update the booking's paymentReceivedAmountValue is recalculated from the
 * authoritative SUM of all payment records so it can never drift.
 */
export async function updatePayment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id, paymentId } = req.params;
    const scope = getVenueScope(req);

    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { amount, method, narration, paymentDate, reference, clearingDate } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Confirm the payment belongs to this booking.
      const existing = await tx.bookingPayments.findFirst({
        where: { id: paymentId, bookingId: id },
      });
      if (!existing) {
        throw Object.assign(new Error('Payment not found'), { status: 404 });
      }

      const booking = await tx.booking.findFirst({
        where: withBookingBanquetScope({ id, isLatest: true }, scope),
      });
      if (!booking) {
        throw Object.assign(new Error('Booking not found'), { status: 404 });
      }
      if (bookingIsImmutable(booking)) {
        throw Object.assign(new Error(bookingImmutableMessage(booking)), { status: 400 });
      }

      const updatedPayment = await tx.bookingPayments.update({
        where: { id: paymentId },
        data: {
          ...(amount !== undefined && { amount: toSafeMoney(amount) }),
          ...(method !== undefined && { method }),
          ...(narration !== undefined && { narration }),
          ...(paymentDate !== undefined && { paymentDate: new Date(paymentDate) }),
          ...(reference !== undefined && { reference }),
          ...(clearingDate !== undefined && { clearingDate: new Date(clearingDate) }),
        },
      });

      // Recalculate from authoritative payment rows — never accumulate.
      const dbPayments = await tx.bookingPayments.findMany({
        where: { bookingId: id },
        select: { method: true, amount: true, clearingDate: true },
      });
      const currentFinal = resolvePayableTotal(booking);
      const { grossReceived, dueAmount: updatedDue } = resolvePaymentTotals(
        currentFinal,
        dbPayments
      );

      await tx.booking.update({
        where: { id },
        data: {
          paymentReceivedAmount: toStoredNumberString(grossReceived),
          paymentReceivedAmountValue: grossReceived,
          dueAmount: toStoredNumberString(updatedDue),
          dueAmountValue: updatedDue,
        },
      });

      return updatedPayment;
    });

    void createAuditLog(req, 'UPDATE', 'payment', paymentId, `Payment for booking ${id}`);
    sendSuccess(res, { payment: result }, 'Payment updated successfully');
  } catch (error: any) {
    if (error?.status === 404) {
      sendError(res, error.message, 404);
      return;
    }
    if (error?.status === 400) {
      sendError(res, error.message, 400);
      return;
    }
    sendError(res, 'Failed to update payment');
  }
}
