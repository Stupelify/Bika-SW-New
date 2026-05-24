/**
 * booking.write.ts
 * Mutating booking handlers: create, update, cancel, delete, finalize, partyOver.
 */
import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendSuccess, sendError, sendNotFound, sendForbidden } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { normalizeCaseFields, normalizeCaseInArrayObjects } from '../utils/textCase';
import { idSchema } from '../utils/validation';
import { resolveEventDateTimes } from '../utils/dateTime';
import { createAuditLog } from '../utils/auditLog';
import {
  getAllowedBanquetIds,
  withBookingBanquetScope,
} from '../utils/banquetAccess';
import {
  assertFinancialsWithinCeiling,
  resolveBookingFinancials,
  sumBookingLines,
} from './booking.helpers';
import {
  toSafeNumber,
  toSafeMoney,
  toOptionalSafeMoney,
  toOptionalSafePercent,
  toStoredNumberString,
  toJsonSnapshot,
  firstDefinedValue,
  readDualMoney,
  readDualPercent,
  runSerializableBookingTransaction,
  isHallClashConstraintError,
  isRetryableSerializableError,
  emitBookingCalendarSync,
  emitBookingCalendarCancel,
  emitBookingBroadcast,
  normalizeBookingHallRows,
  normalizePackHallIds,
  assertSingleBanquetHallSelection,
  assertNoHallClash,
  bookingIsImmutable,
  bookingImmutableMessage,
  fetchBookingSnapshot,
  cloneBookingVersion,
  recalculateBookingFinancials,
  resolveMealSlotId,
} from './booking.shared';
import logger from '../utils/logger';

// ---------------------------------------------------------------------------
// Validation schemas (exported for use in routes)
// ---------------------------------------------------------------------------

export const createBookingSchema = z.object({
  body: z.object({
    customerId: idSchema('customer ID'),
    secondCustomerId: idSchema('second customer ID').optional(),
    referredById: idSchema('referred by customer ID').optional(),
    functionName: z.preprocess(
      (value) => (typeof value === 'string' ? value.trim() : value),
      z
        .string()
        .min(2, 'Function name is required')
        .max(120, 'Function name must be at most 120 characters')
    ),
    functionType: z.preprocess(
      (value) => (typeof value === 'string' ? value.trim() : value),
      z
        .string()
        .min(2, 'Function type is required')
        .max(120, 'Function type must be at most 120 characters')
    ),
    functionDate: z.string(),
    functionTime: z.string(),
    expectedGuests: z.number().min(1, 'Expected guests must be at least 1').max(10000, 'Expected guests must be at most 10000'),
    confirmedGuests: z.number().min(0, 'Confirmed guests must be non-negative').max(10000, 'Confirmed guests must be at most 10000').optional(),
    isQuotation: z.boolean().optional(),
    halls: z.array(z.object({
      hallId: idSchema('hall ID'),
      charges: z.number().min(0),
    })).optional(),
    packs: z.array(z.object({
      mealSlotId: idSchema('meal slot ID').optional(),
      packName: z.string().min(1).max(120, 'Pack name must be at most 120 characters'),
      noOfPack: z.number().min(1).optional(),
      packCount: z.number().min(1).optional(),
      hallIds: z.array(idSchema('hall ID')).optional(),
      ratePerPlate: z.number().min(0),
      setupCost: z.number().min(0).optional(),
      extraCharges: z.number().min(0).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      extraPlate: z.number().int().min(0, 'Extra plate count must be non-negative').optional(),
      extraRate: z.string().max(50).optional(),
      extraAmount: z.string().max(50).optional(),
      menuPoint: z.number().optional(),
      hallRate: z.string().max(50).optional(),
      boardToRead: z.string().max(200).optional(),
      hallName: z.string().max(120).optional(),
      timeSlot: z.string().max(50).optional(),
      tags: z.array(z.string()).optional(),
      menu: z.object({
        name: z.string().min(1).max(120, 'Menu name must be at most 120 characters'),
        templateMenuId: idSchema('template menu ID').optional(),
        items: z.array(z.object({
          itemId: idSchema('item ID'),
          quantity: z.number().min(1),
        })),
      }),
    })).optional(),
    additionalItems: z.array(z.object({
      description: z.string().min(1).max(200, 'Description must be at most 200 characters'),
      charges: z.number().min(0, 'Charges must be non-negative'),
      quantity: z.number().min(1).optional(),
    })).optional(),
    discountAmount: z.number().min(0).optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
    internalNotes: z
      .string()
      .max(2000, 'Internal notes must be at most 2000 characters')
      .optional(),
  }).refine(
    (data) => !data.secondCustomerId || data.secondCustomerId !== data.customerId,
    { message: 'Secondary customer must be different from primary customer', path: ['secondCustomerId'] }
  ),
});

export const updateBookingSchema = z.object({
  body: z
    .object({
      customerId: idSchema('customer ID').optional(),
      secondCustomerId: idSchema('second customer ID').optional(),
      referredById: idSchema('referred by customer ID').optional(),
      functionName: z
        .preprocess(
          (value) => (typeof value === 'string' ? value.trim() : value),
          z
            .string()
            .min(2, 'Function name is required')
            .max(120, 'Function name must be at most 120 characters')
        )
        .optional(),
      functionType: z
        .preprocess(
          (value) => (typeof value === 'string' ? value.trim() : value),
          z
            .string()
            .min(2, 'Function type is required')
            .max(120, 'Function type must be at most 120 characters')
        )
        .optional(),
      functionDate: z.string().optional(),
      functionTime: z.string().optional(),
      expectedGuests: z.number().min(1, 'Expected guests must be at least 1').max(10000, 'Expected guests must be at most 10000').optional(),
      confirmedGuests: z.number().min(0, 'Confirmed guests must be non-negative').max(10000, 'Confirmed guests must be at most 10000').optional(),
      isQuotation: z.boolean().optional(),
      halls: z
        .array(
          z.object({
            hallId: idSchema('hall ID'),
            charges: z.number().min(0),
          })
        )
        .optional(),
      packs: z
        .array(
          z.object({
            mealSlotId: idSchema('meal slot ID').optional(),
            packName: z
              .string()
              .min(1)
              .max(120, 'Pack name must be at most 120 characters'),
            noOfPack: z.number().min(1).optional(),
            packCount: z.number().min(1).optional(),
            hallIds: z.array(idSchema('hall ID')).optional(),
            ratePerPlate: z.number().min(0),
            setupCost: z.number().min(0).optional(),
            extraCharges: z.number().min(0).optional(),
            startTime: z.string().optional(),
            endTime: z.string().optional(),
            extraPlate: z.number().int().min(0, 'Extra plate count must be non-negative').optional(),
            extraRate: z.string().max(50).optional(),
            extraAmount: z.string().max(50).optional(),
            menuPoint: z.number().optional(),
            hallRate: z.string().max(50).optional(),
            boardToRead: z.string().max(200).optional(),
            hallName: z.string().max(120).optional(),
            timeSlot: z.string().max(50).optional(),
            tags: z.array(z.string()).optional(),
            menu: z.object({
              name: z
                .string()
                .min(1)
                .max(120, 'Menu name must be at most 120 characters'),
              templateMenuId: idSchema('template menu ID').optional(),
              items: z.array(
                z.object({
                  itemId: idSchema('item ID'),
                  quantity: z.number().min(1),
                })
              ),
            }),
          })
        )
        .optional(),
      additionalItems: z
        .array(
          z.object({
            description: z
              .string()
              .min(1)
              .max(200, 'Description must be at most 200 characters'),
            charges: z.number().min(0, 'Charges must be non-negative'),
            quantity: z.number().min(1).optional(),
          })
        )
        .optional(),
      discountAmount: z.number().min(0).optional(),
      discountPercentage: z.number().min(0).max(100).optional(),
      notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
      internalNotes: z
        .string()
        .max(2000, 'Internal notes must be at most 2000 characters')
        .optional(),
      createNewVersion: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    })
    .refine(
      (data) => !data.secondCustomerId || !data.customerId || data.secondCustomerId !== data.customerId,
      { message: 'Secondary customer must be different from primary customer', path: ['secondCustomerId'] }
    ),
});

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * Create new booking
 */
export async function createBooking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data: any = normalizeCaseFields({ ...req.body }, [
      'functionName',
      'functionType',
    ]);

    if (Array.isArray(data.additionalItems)) {
      data.additionalItems = normalizeCaseInArrayObjects(data.additionalItems, [
        'description',
      ]);
    }

    if (Array.isArray(data.packs)) {
      data.packs = data.packs.map((pack: any) => {
        const normalizedPack = normalizeCaseFields({ ...pack }, [
          'packName',
          'hallName',
          'boardToRead',
          'timeSlot',
        ]);
        if (normalizedPack.menu && typeof normalizedPack.menu === 'object') {
          normalizedPack.menu = normalizeCaseFields(
            { ...normalizedPack.menu },
            ['name']
          );
        }
        normalizedPack.hallIds = normalizePackHallIds(normalizedPack.hallIds);
        return normalizedPack;
      });
    }

    const hallRowsInput = normalizeBookingHallRows(data.halls);

    // Banquet access check: restricted users can only book halls in their allowed banquets
    const createAuthReq = req as AuthRequest;
    const createAllowedBanquetIds = createAuthReq.user?.banquetIds;
    if (createAllowedBanquetIds && createAllowedBanquetIds.length > 0 && hallRowsInput.length > 0) {
      const selectedHalls = await prisma.hall.findMany({
        where: { id: { in: hallRowsInput.map((h) => h.hallId) } },
        select: { id: true, name: true, banquetId: true },
      });
      const forbidden = selectedHalls.filter(
        (h) => h.banquetId && !createAllowedBanquetIds.includes(h.banquetId)
      );
      if (forbidden.length > 0) {
        sendForbidden(res, `Access denied: halls not in your allowed banquets (${forbidden.map((h) => h.name).join(', ')})`);
        return;
      }
    }

    // Start transaction
    const booking = await runSerializableBookingTransaction(async (tx) => {
      await assertSingleBanquetHallSelection(tx, hallRowsInput);
      await assertNoHallClash(
        tx,
        hallRowsInput.map((h) => h.hallId),
        data.functionDate,
        data.startTime,
        data.endTime
      );
      const bookingDateTimes = resolveEventDateTimes(
        data.functionDate,
        data.startTime,
        data.endTime,
        data.functionTime
      );

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          customerId: data.customerId,
          secondCustomerId: data.secondCustomerId,
          referredById: data.referredById,
          rating: data.rating,
          secondRating: data.secondRating,
          priority: data.priority,
          secondPriority: data.secondPriority,
          functionName: data.functionName,
          functionType: data.functionType,
          functionDate: new Date(data.functionDate),
          functionTime: data.functionTime,
          startTime: data.startTime,
          endTime: data.endTime,
          startDateTime: bookingDateTimes.startDateTime || undefined,
          endDateTime: bookingDateTimes.endDateTime || undefined,
          expectedGuests: data.expectedGuests,
          confirmedGuests: data.confirmedGuests,
          quotation:
            data.quotation !== undefined
              ? data.quotation
              : data.isQuotation || false,
          isQuotation: data.isQuotation || false,
          isPencilBooking: data.isPencilBooking || false,
          pencilExpiresAt: data.isPencilBooking && data.pencilExpiresAt
            ? new Date(data.pencilExpiresAt)
            : null,
          notes: data.notes,
          internalNotes: data.internalNotes,
        },
      });

      // Create hall associations
      if (hallRowsInput.length > 0) {
        await tx.bookingHall.createMany({
          data: hallRowsInput.map((hall) => ({
            bookingId: newBooking.id,
            hallId: hall.hallId,
            charges: hall.charges,
          })),
        });
      }

      // Create packs with menus
      if (data.packs && data.packs.length > 0) {
        for (const pack of data.packs) {
          const mealSlotId = await resolveMealSlotId(tx, pack);
          const normalizedPackCount = Math.max(
            1,
            toSafeNumber(pack.packCount ?? pack.noOfPack ?? 1)
          );

          // Create menu
          const menu = await tx.bookingMenu.create({
            data: {
              name: pack.menu?.name || `${pack.packName || 'Menu'} Menu`,
              setupCost: toSafeMoney(pack.setupCost),
              ratePerPlate: toSafeMoney(pack.ratePerPlate),
              mealSlotId,
            },
          });

          // Add menu items
          if (pack.menu?.items && pack.menu.items.length > 0) {
            await tx.bookingMenuItems.createMany({
              data: pack.menu.items.map((item: any) => ({
                bookingMenuId: menu.id,
                itemId: item.itemId,
                quantity: item.quantity,
              })),
            });
          }

          // Create pack
          const packDateTimes = resolveEventDateTimes(
            data.functionDate,
            pack.startTime,
            pack.endTime,
            pack.timeSlot || data.startTime || data.functionTime
          );

          await tx.bookingPack.create({
            data: {
              bookingId: newBooking.id,
              mealSlotId,
              bookingMenuId: menu.id,
              packName: pack.packName,
              noOfPack: Math.max(1, toSafeNumber(pack.noOfPack ?? normalizedPackCount)),
              packCount: normalizedPackCount,
              hallIds: pack.hallIds || [],
              ratePerPlate: toSafeMoney(pack.ratePerPlate),
              setupCost: toSafeMoney(pack.setupCost),
              startTime: pack.startTime,
              endTime: pack.endTime,
              startDateTime: packDateTimes.startDateTime || undefined,
              endDateTime: packDateTimes.endDateTime || undefined,
              extraPlate: pack.extraPlate,
              extraRate: toStoredNumberString(
                readDualMoney(pack as Record<string, unknown>, 'extraRateValue', 'extraRate')
              ),
              extraRateValue: readDualMoney(
                pack as Record<string, unknown>,
                'extraRateValue',
                'extraRate'
              ),
              extraAmount: toStoredNumberString(
                readDualMoney(
                  pack as Record<string, unknown>,
                  'extraAmountValue',
                  'extraAmount'
                )
              ),
              extraAmountValue: readDualMoney(
                pack as Record<string, unknown>,
                'extraAmountValue',
                'extraAmount'
              ),
              menuPoint: pack.menuPoint,
              hallRate: toStoredNumberString(
                readDualMoney(pack as Record<string, unknown>, 'hallRateValue', 'hallRate')
              ),
              hallRateValue: readDualMoney(
                pack as Record<string, unknown>,
                'hallRateValue',
                'hallRate'
              ),
              boardToRead: pack.boardToRead,
              extraCharges: toSafeMoney(pack.extraCharges),
              hallName: pack.hallName,
              timeSlot: pack.timeSlot,
              tags: pack.tags || [],
            },
          });
        }
      }

      // Create additional items
      if (data.additionalItems && data.additionalItems.length > 0) {
        await tx.additionalBookingItems.createMany({
          data: data.additionalItems.map((item: any) => ({
            bookingId: newBooking.id,
            description: item.description,
            charges: toSafeMoney(item.charges),
            quantity: item.quantity || 1,
          })),
        });
      }

      // Calculate totals
      const totalAmount = sumBookingLines({
        halls: hallRowsInput.map((h: any) => ({ charges: h.charges })),
        packs: (data.packs ?? []).map((p: any) => ({
          ratePerPlate: p.ratePerPlate,
          packCount: p.packCount,
          noOfPack: p.noOfPack,
          setupCost: p.setupCost,
          extraCharges: p.extraCharges,
        })),
        additionalItems: (data.additionalItems ?? []).map((a: any) => ({
          charges: a.charges,
          quantity: a.quantity,
        })),
      });

      const discountPercentage =
        readDualPercent(data, 'discountPercentageValue', 'discountPercentage') || 0;
      const financials = resolveBookingFinancials({
        totalAmount,
        discountPercentage,
        discountAmountInput:
          readDualMoney(data, 'discountAmountValue', 'discountAmount') || 0,
        finalAmountInput: readDualMoney(data, 'finalAmountValue', 'finalAmount'),
      });
      if (financials.exceededCeiling) {
        throw new Error('BOOKING_NET_EXCEEDS_BILL');
      }
      const { discountAmount, grandTotal, finalAmountValue } = financials;
      const balanceAmount = toSafeMoney(
        grandTotal - toSafeMoney(firstDefinedValue(data.advanceReceivedValue, data.advanceReceived))
      );
      const discountAmount2ndValue = readDualMoney(
        data,
        'discountAmount2ndValue',
        'discountAmount2nd'
      );
      const discountPercentage2ndValue = readDualPercent(
        data,
        'discountPercentage2ndValue',
        'discountPercentage2nd'
      );
      const advanceRequiredValue = readDualMoney(
        data,
        'advanceRequiredValue',
        'advanceRequired'
      );
      const paymentReceivedPercentValue = readDualPercent(
        data,
        'paymentReceivedPercentValue',
        'paymentReceivedPercent'
      );
      const paymentReceivedAmountValue = readDualMoney(
        data,
        'paymentReceivedAmountValue',
        'paymentReceivedAmount'
      );
      const dueAmountValue =
        readDualMoney(data, 'dueAmountValue', 'dueAmount') ?? balanceAmount;

      // Update booking with totals
      return await tx.booking.update({
        where: { id: newBooking.id },
        data: {
          totalAmount,
          totalBillAmount: toStoredNumberString(totalAmount),
          totalBillAmountValue: totalAmount,
          discountAmount,
          discountPercentage,
          discountAmount2nd: toStoredNumberString(discountAmount2ndValue),
          discountAmount2ndValue,
          discountPercentage2nd: toStoredNumberString(discountPercentage2ndValue),
          discountPercentage2ndValue,
          grandTotal,
          finalAmount: toStoredNumberString(finalAmountValue),
          finalAmountValue,
          balanceAmount,
          dueAmount: toStoredNumberString(dueAmountValue),
          dueAmountValue,
          advanceRequired: toStoredNumberString(advanceRequiredValue),
          advanceRequiredValue,
          paymentReceivedPercent: toStoredNumberString(paymentReceivedPercentValue),
          paymentReceivedPercentValue,
          paymentReceivedAmount: toStoredNumberString(paymentReceivedAmountValue),
          paymentReceivedAmountValue,
        },
        include: {
          customer: true,
          secondCustomer: true,
          halls: {
            include: {
              hall: true,
            },
          },
          packs: {
            include: {
              mealSlot: true,
              bookingMenu: {
                include: {
                  items: {
                    include: {
                      item: true,
                    },
                  },
                },
              },
            },
          },
          additionalItems: true,
        },
      });
    });

    void createAuditLog(req, 'CREATE', 'booking', booking.id, [(booking as any).customer?.name, booking.functionName].filter(Boolean).join(' – '));
    sendSuccess(res, { booking }, 'Booking created successfully', 201);
    emitBookingBroadcast('booking:created', {
      id: booking.id,
      status: booking.status,
      functionDate: booking.functionDate,
      functionType: booking.functionType,
    });
    emitBookingCalendarSync(booking);
  } catch (error: any) {
    logger.error('Booking creation error:', error);
    if (error instanceof Error) {
      if (
        error.message === 'Selected halls must belong to the same banquet' ||
        error.message === 'One or more selected halls are invalid'
      ) {
        sendError(res, error.message, 400);
        return;
      }
      if (error.message.startsWith('Hall timing clash detected')) {
        sendError(res, error.message, 409);
        return;
      }
      if (error.message === 'BOOKING_NET_EXCEEDS_BILL') {
        sendError(
          res,
          'Billing total is higher than hall, catering, and extra items. Adjust amounts and try again.',
          400
        );
        return;
      }
    }
    if (isHallClashConstraintError(error)) {
      sendError(
        res,
        'Hall timing clash detected with an existing booking. Please choose a different hall or time slot.',
        409
      );
      return;
    }
    if (isRetryableSerializableError(error)) {
      sendError(res, 'Booking conflict detected. Please retry the request.', 409);
      return;
    }
    sendError(res, 'Failed to create booking');
  }
}

/**
 * Finalize booking version and create a new editable replica.
 */
export async function finalizeBookingVersion(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    const allowedBanquetIds = getAllowedBanquetIds(req);

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: withBookingBanquetScope({ id }, allowedBanquetIds),
        select: {
          id: true,
          isLatest: true,
          status: true,
          versionNumber: true,
        },
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }
      if (!booking.isLatest) {
        throw new Error('BOOKING_NOT_LATEST');
      }
      if (booking.status === 'completed') {
        throw new Error('BOOKING_COMPLETED');
      }

      const existingFinalized = await tx.finalizedBooking.findUnique({
        where: { bookingId: id },
        select: { id: true },
      });
      if (existingFinalized) {
        throw new Error('BOOKING_ALREADY_FINALIZED');
      }

      await recalculateBookingFinancials(tx, id);
      const financialCheck = await tx.booking.findUnique({
        where: { id },
        select: {
          totalAmount: true,
          grandTotal: true,
          finalAmountValue: true,
        },
      });
      if (financialCheck) {
        assertFinancialsWithinCeiling({
          totalAmount: financialCheck.totalAmount,
          grandTotal: financialCheck.grandTotal,
          finalAmountValue:
            financialCheck.finalAmountValue ?? financialCheck.grandTotal,
        });
      }

      const snapshot = await fetchBookingSnapshot(tx, id);
      if (!snapshot) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      await tx.finalizedBooking.create({
        data: {
          bookingId: id,
          data: toJsonSnapshot(snapshot),
          finalizedBy: req.user!.userId,
        },
      });

      await tx.booking.update({
        where: { id },
        data: { isLatest: false },
      });

      const replica = await cloneBookingVersion(tx, id);
      return {
        replica,
      };
    });

    void createAuditLog(req, 'FINALIZE', 'booking', id, result.replica.functionName);
    sendSuccess(
      res,
      {
        booking: result.replica,
        newBookingId: result.replica.id,
      },
      'Booking finalized and new editable version created'
    );
    emitBookingBroadcast('booking:updated', {
      id: result.replica.id,
      previousBookingId: id,
      status: result.replica.status,
      versionNumber: result.replica.versionNumber,
    });
    emitBookingCalendarCancel(id);
    emitBookingCalendarSync(result.replica);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BOOKING_NOT_FOUND') {
        sendNotFound(res, 'Booking not found');
        return;
      }
      if (error.message === 'BOOKING_NOT_LATEST') {
        sendError(res, 'Only latest booking version can be finalized', 400);
        return;
      }
      if (error.message === 'BOOKING_COMPLETED') {
        sendError(res, 'Completed (party over) bookings cannot be finalized again', 400);
        return;
      }
      if (error.message === 'BOOKING_ALREADY_FINALIZED') {
        sendError(res, 'This booking version is already finalized', 409);
        return;
      }
      if (error.message === 'BOOKING_NET_EXCEEDS_BILL') {
        sendError(
          res,
          'Billing total is higher than hall, catering, and extra items. Save again after adjusting amounts.',
          400
        );
        return;
      }
    }
    sendError(res, 'Failed to finalize booking');
  }
}

/**
 * Party over: apply extra plates, finalize current version, and create completed replica.
 */
export async function partyOverBooking(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    const allowedBanquetIds = getAllowedBanquetIds(req);

    const payloadSchema = z.object({
      packs: z
        .array(
          z.object({
            bookingPackId: idSchema('booking pack ID'),
            extraPlate: z.number().int().min(0),
            extraRate: z.number().min(0).optional(),
          })
        )
        .default([]),
      settlementDiscountPercent: z.number().min(0).max(100).optional(),
      settlementDiscountAmount: z.number().min(0).optional(),
      settlementTotalAmount: z.number().min(0).optional(),
    });

    const parsed = payloadSchema.safeParse(req.body || {});
    if (!parsed.success) {
      sendError(res, 'Invalid party over payload', 400);
      return;
    }
    const payload = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: withBookingBanquetScope({ id }, allowedBanquetIds),
        include: {
          packs: {
            select: {
              id: true,
              packName: true,
              ratePerPlate: true,
              extraRate: true,
              extraRateValue: true,
              extraPlate: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }
      if (!booking.isLatest) {
        throw new Error('BOOKING_NOT_LATEST');
      }
      if (bookingIsImmutable(booking)) {
        throw new Error(bookingImmutableMessage(booking));
      }

      const functionDay = new Date(booking.functionDate);
      functionDay.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (functionDay.getTime() > today.getTime()) {
        throw new Error('BOOKING_DATE_IN_FUTURE');
      }

      const packIds = new Set(booking.packs.map((pack) => pack.id));
      const requestedPackMap = new Map(
        payload.packs.map((entry) => [entry.bookingPackId, entry])
      );
      for (const entry of payload.packs) {
        if (!packIds.has(entry.bookingPackId)) {
          throw new Error('INVALID_PACK_ID');
        }
      }

      for (const pack of booking.packs) {
        const input = requestedPackMap.get(pack.id);
        const extraPlate = Math.max(0, input?.extraPlate ?? pack.extraPlate ?? 0);
        const resolvedRate =
          input?.extraRate ??
          pack.extraRateValue ??
          toOptionalSafeMoney(pack.extraRate) ??
          toSafeMoney(pack.ratePerPlate);
        const extraRateValue = toSafeMoney(resolvedRate);
        const extraAmountValue = toSafeMoney(extraPlate * extraRateValue);

        await tx.bookingPack.update({
          where: { id: pack.id },
          data: {
            extraPlate,
            extraRate: toStoredNumberString(extraRateValue),
            extraRateValue,
            extraAmount: toStoredNumberString(extraAmountValue),
            extraAmountValue,
            extraCharges: extraAmountValue,
          },
        });
      }

      await recalculateBookingFinancials(tx, id, {
        forceFinalAmountToGrandTotal: true,
      });

      const snapshot = await fetchBookingSnapshot(tx, id);
      if (!snapshot) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      await tx.finalizedBooking.upsert({
        where: { bookingId: id },
        create: {
          bookingId: id,
          data: toJsonSnapshot(snapshot),
          finalizedBy: req.user!.userId,
        },
        update: {
          data: toJsonSnapshot(snapshot),
          finalizedBy: req.user!.userId,
          finalizedAt: new Date(),
        },
      });

      await tx.booking.update({
        where: { id },
        data: { isLatest: false },
      });

      const completedReplica = await cloneBookingVersion(tx, id, {
        status: 'completed',
      });

      if (
        payload.settlementDiscountPercent !== undefined ||
        payload.settlementDiscountAmount !== undefined ||
        payload.settlementTotalAmount !== undefined
      ) {
        await tx.booking.update({
          where: { id: completedReplica.id },
          data: {
            ...(payload.settlementDiscountPercent !== undefined && {
              settlementDiscountPercent: payload.settlementDiscountPercent,
            }),
            ...(payload.settlementDiscountAmount !== undefined && {
              settlementDiscountAmount: payload.settlementDiscountAmount,
            }),
            ...(payload.settlementTotalAmount !== undefined && {
              settlementTotalAmount: payload.settlementTotalAmount,
            }),
          },
        });
      }

      await tx.finalizedBooking.create({
        data: {
          bookingId: completedReplica.id,
          data: toJsonSnapshot(completedReplica),
          finalizedBy: req.user!.userId,
        },
      });

      return {
        completedReplica,
      };
    });

    void createAuditLog(req, 'PARTY_OVER', 'booking', id, result.completedReplica.functionName);
    sendSuccess(
      res,
      {
        booking: result.completedReplica,
        newBookingId: result.completedReplica.id,
      },
      'Party over applied and booking chain locked'
    );
    emitBookingBroadcast('booking:updated', {
      id: result.completedReplica.id,
      previousBookingId: id,
      status: result.completedReplica.status,
      versionNumber: result.completedReplica.versionNumber,
    });
    emitBookingCalendarCancel(id);
    emitBookingCalendarSync(result.completedReplica);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BOOKING_NOT_FOUND') {
        sendNotFound(res, 'Booking not found');
        return;
      }
      if (error.message === 'BOOKING_NOT_LATEST') {
        sendError(res, 'Only latest booking version can be used for party over', 400);
        return;
      }
      if (error.message === 'BOOKING_DATE_IN_FUTURE') {
        sendError(res, 'Party over is available only on or after function date', 400);
        return;
      }
      if (error.message === 'INVALID_PACK_ID') {
        sendError(res, 'One or more packs do not belong to this booking', 400);
        return;
      }
      if (
        error.message === 'Completed (party over) bookings are read-only' ||
        error.message === 'Only latest booking versions can be modified'
      ) {
        sendError(res, error.message, 400);
        return;
      }
    }
    sendError(res, 'Failed to apply party over');
  }
}

/**
 * Update booking
 */
export async function updateBooking(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const allowedBanquetIds = getAllowedBanquetIds(req);
    const data: any = normalizeCaseFields({ ...req.body }, [
      'functionName',
      'functionType',
    ]);

    if (Array.isArray(data.additionalItems)) {
      data.additionalItems = normalizeCaseInArrayObjects(data.additionalItems, [
        'description',
      ]);
    }

    if (Array.isArray(data.packs)) {
      data.packs = data.packs.map((pack: any) => {
        const normalizedPack = normalizeCaseFields({ ...pack }, [
          'packName',
          'hallName',
          'boardToRead',
          'timeSlot',
        ]);
        if (normalizedPack.menu && typeof normalizedPack.menu === 'object') {
          normalizedPack.menu = normalizeCaseFields(
            { ...normalizedPack.menu },
            ['name']
          );
        }
        normalizedPack.hallIds = normalizePackHallIds(normalizedPack.hallIds);
        return normalizedPack;
      });
    }

    const hallRowsInput = Array.isArray(data.halls)
      ? normalizeBookingHallRows(data.halls)
      : null;

    // Check if booking exists
    const existingBooking = await prisma.booking.findFirst({
      where: withBookingBanquetScope({ id, isLatest: true }, allowedBanquetIds),
    });

    if (!existingBooking) {
      sendNotFound(res, 'Booking not found');
      return;
    }
    if (bookingIsImmutable(existingBooking)) {
      sendError(res, bookingImmutableMessage(existingBooking), 400);
      return;
    }

    // Create new version if not a quotation — deep-copy all relations via cloneBookingVersion
    if (!existingBooking.isQuotation && data.createNewVersion) {
      const newVersion = await runSerializableBookingTransaction(async (tx) => {
        // Mark current as not latest atomically with the clone
        await tx.booking.update({
          where: { id },
          data: { isLatest: false },
        });
        return cloneBookingVersion(tx, id);
      });

      sendSuccess(res, { booking: newVersion }, 'New booking version created');
      emitBookingBroadcast('booking:updated', {
        id: newVersion.id,
        previousBookingId: id,
        status: newVersion.status,
        versionNumber: newVersion.versionNumber,
      });
      emitBookingCalendarCancel(id);
      emitBookingCalendarSync(newVersion);
      return;
    }

    const booking = await runSerializableBookingTransaction(async (tx) => {
      if (hallRowsInput) {
        await assertSingleBanquetHallSelection(tx, hallRowsInput);
      }
      const currentHallRows = hallRowsInput
        ? null
        : await tx.bookingHall.findMany({
            where: { bookingId: id },
            select: { hallId: true },
          });
      const effectiveFunctionDate = data.functionDate || existingBooking.functionDate;
      const effectiveHallIds = hallRowsInput
        ? hallRowsInput.map((h) => h.hallId)
        : currentHallRows?.map((row) => row.hallId) ?? [];
      await assertNoHallClash(
        tx,
        effectiveHallIds,
        effectiveFunctionDate,
        data.startTime !== undefined ? data.startTime : existingBooking.startTime,
        data.endTime   !== undefined ? data.endTime   : existingBooking.endTime,
        id  // exclude the booking being updated
      );
      const effectiveStartTime =
        data.startTime !== undefined ? data.startTime : existingBooking.startTime;
      const effectiveEndTime =
        data.endTime !== undefined ? data.endTime : existingBooking.endTime;
      const effectiveFallbackTime =
        data.functionTime !== undefined
          ? data.functionTime
          : existingBooking.functionTime;
      const bookingDateTimes = resolveEventDateTimes(
        effectiveFunctionDate,
        effectiveStartTime,
        effectiveEndTime,
        effectiveFallbackTime
      );
      const discountAmount2ndValue = readDualMoney(
        data,
        'discountAmount2ndValue',
        'discountAmount2nd'
      );
      const discountPercentage2ndValue = readDualPercent(
        data,
        'discountPercentage2ndValue',
        'discountPercentage2nd'
      );
      const advanceRequiredValue = readDualMoney(
        data,
        'advanceRequiredValue',
        'advanceRequired'
      );
      const paymentReceivedPercentValue = readDualPercent(
        data,
        'paymentReceivedPercentValue',
        'paymentReceivedPercent'
      );
      const paymentReceivedAmountValue = readDualMoney(
        data,
        'paymentReceivedAmountValue',
        'paymentReceivedAmount'
      );
      const dueAmountValueInput = readDualMoney(data, 'dueAmountValue', 'dueAmount');

      await tx.booking.update({
        where: { id },
        data: {
          customerId: data.customerId,
          secondCustomerId: data.secondCustomerId,
          referredById: data.referredById,
          rating: data.rating,
          secondRating: data.secondRating,
          priority: data.priority,
          secondPriority: data.secondPriority,
          functionName: data.functionName,
          functionType: data.functionType,
          functionDate: data.functionDate ? new Date(data.functionDate) : undefined,
          functionTime: data.functionTime,
          startTime: data.startTime,
          endTime: data.endTime,
          startDateTime: bookingDateTimes.startDateTime || undefined,
          endDateTime: bookingDateTimes.endDateTime || undefined,
          expectedGuests: data.expectedGuests,
          confirmedGuests: data.confirmedGuests,
          quotation:
            data.quotation !== undefined
              ? data.quotation
              : data.isQuotation !== undefined
                ? data.isQuotation
                : undefined,
          isQuotation: data.isQuotation,
          isPencilBooking: data.isPencilBooking !== undefined ? data.isPencilBooking : undefined,
          pencilExpiresAt: data.isPencilBooking !== undefined
            ? (data.isPencilBooking && data.pencilExpiresAt ? new Date(data.pencilExpiresAt) : null)
            : undefined,
          notes: data.notes,
          internalNotes: data.internalNotes,
          advanceRequired: toStoredNumberString(advanceRequiredValue),
          advanceRequiredValue,
          paymentReceivedPercent: toStoredNumberString(paymentReceivedPercentValue),
          paymentReceivedPercentValue,
          paymentReceivedAmount: toStoredNumberString(paymentReceivedAmountValue),
          paymentReceivedAmountValue,
          dueAmount: toStoredNumberString(dueAmountValueInput),
          dueAmountValue: dueAmountValueInput,
          discountAmount2nd: toStoredNumberString(discountAmount2ndValue),
          discountAmount2ndValue,
          discountPercentage2nd: toStoredNumberString(discountPercentage2ndValue),
          discountPercentage2ndValue,
        },
      });

      if (hallRowsInput) {
        await tx.bookingHall.deleteMany({ where: { bookingId: id } });
        if (hallRowsInput.length > 0) {
          await tx.bookingHall.createMany({
            data: hallRowsInput.map((hall) => ({
              bookingId: id,
              hallId: hall.hallId,
              charges: toSafeMoney(hall.charges),
            })),
          });
        }
      }

      if (Array.isArray(data.additionalItems)) {
        await tx.additionalBookingItems.deleteMany({ where: { bookingId: id } });
        if (data.additionalItems.length > 0) {
          await tx.additionalBookingItems.createMany({
            data: data.additionalItems.map(
              (item: { description: string; charges?: number; quantity?: number }) => ({
                bookingId: id,
                description: item.description,
                charges: toSafeMoney(item.charges),
                quantity: Math.max(1, toSafeNumber(item.quantity || 1)),
              })
            ),
          });
        }
      }

      if (Array.isArray(data.packs)) {
        const existingPacks = await tx.bookingPack.findMany({
          where: { bookingId: id },
          select: {
            bookingMenuId: true,
          },
        });
        const existingMenuIds = existingPacks
          .map((pack) => pack.bookingMenuId)
          .filter(Boolean);

        await tx.bookingPack.deleteMany({ where: { bookingId: id } });
        if (existingMenuIds.length > 0) {
          await tx.bookingMenu.deleteMany({
            where: { id: { in: existingMenuIds } },
          });
        }

        for (const pack of data.packs) {
          const mealSlotId = await resolveMealSlotId(tx, pack);
          const normalizedPackCount = Math.max(
            1,
            toSafeNumber(pack.packCount ?? pack.noOfPack ?? 1)
          );
          const packDateTimes = resolveEventDateTimes(
            effectiveFunctionDate,
            pack.startTime,
            pack.endTime,
            pack.timeSlot || effectiveStartTime || effectiveFallbackTime
          );

          const menu = await tx.bookingMenu.create({
            data: {
              name: pack.menu?.name || `${pack.packName || 'Menu'} Menu`,
              setupCost: toSafeMoney(pack.setupCost),
              ratePerPlate: toSafeMoney(pack.ratePerPlate),
              mealSlotId,
            },
          });

          if (pack.menu?.items && pack.menu.items.length > 0) {
            await tx.bookingMenuItems.createMany({
              data: pack.menu.items.map(
                (item: { itemId: string; quantity?: number }) => ({
                  bookingMenuId: menu.id,
                  itemId: item.itemId,
                  quantity: Math.max(1, toSafeNumber(item.quantity || 1)),
                })
              ),
            });
          }

          await tx.bookingPack.create({
            data: {
              bookingId: id,
              mealSlotId,
              bookingMenuId: menu.id,
              packName: pack.packName,
              noOfPack: Math.max(1, toSafeNumber(pack.noOfPack ?? normalizedPackCount)),
              packCount: normalizedPackCount,
              hallIds: pack.hallIds || [],
              ratePerPlate: toSafeMoney(pack.ratePerPlate),
              setupCost: toSafeMoney(pack.setupCost),
              startTime: pack.startTime,
              endTime: pack.endTime,
              startDateTime: packDateTimes.startDateTime || undefined,
              endDateTime: packDateTimes.endDateTime || undefined,
              extraPlate: pack.extraPlate,
              extraRate: toStoredNumberString(
                readDualMoney(pack as Record<string, unknown>, 'extraRateValue', 'extraRate')
              ),
              extraRateValue: readDualMoney(
                pack as Record<string, unknown>,
                'extraRateValue',
                'extraRate'
              ),
              extraAmount: toStoredNumberString(
                readDualMoney(
                  pack as Record<string, unknown>,
                  'extraAmountValue',
                  'extraAmount'
                )
              ),
              extraAmountValue: readDualMoney(
                pack as Record<string, unknown>,
                'extraAmountValue',
                'extraAmount'
              ),
              menuPoint: pack.menuPoint,
              hallRate: toStoredNumberString(
                readDualMoney(pack as Record<string, unknown>, 'hallRateValue', 'hallRate')
              ),
              hallRateValue: readDualMoney(
                pack as Record<string, unknown>,
                'hallRateValue',
                'hallRate'
              ),
              boardToRead: pack.boardToRead,
              extraCharges: toSafeMoney(pack.extraCharges),
              hallName: pack.hallName,
              timeSlot: pack.timeSlot,
              tags: pack.tags || [],
            },
          });
        }
      }

      const hallRows = hallRowsInput
        ? hallRowsInput
        : await tx.bookingHall.findMany({
          where: { bookingId: id },
          select: {
            charges: true,
          },
        });
      const packRows = Array.isArray(data.packs)
        ? data.packs
        : await tx.bookingPack.findMany({
          where: { bookingId: id },
          select: {
            packCount: true,
            noOfPack: true,
            ratePerPlate: true,
            setupCost: true,
            extraCharges: true,
          },
        });
      const additionalItemRows = Array.isArray(data.additionalItems)
        ? data.additionalItems
        : await tx.additionalBookingItems.findMany({
          where: { bookingId: id },
          select: {
            charges: true,
            quantity: true,
          },
        });

      const totalAmount = sumBookingLines({
        halls: hallRows.map((h: any) => ({ charges: h.charges })),
        packs: packRows.map((p: any) => ({
          ratePerPlate: p.ratePerPlate,
          packCount: p.packCount,
          noOfPack: p.noOfPack,
          setupCost: p.setupCost,
          extraCharges: p.extraCharges,
        })),
        additionalItems: additionalItemRows.map((a: any) => ({
          charges: a.charges,
          quantity: a.quantity,
        })),
      });
      const inputDiscountPercentage = readDualPercent(
        data,
        'discountPercentageValue',
        'discountPercentage'
      );
      const effectiveDiscountPercentage =
        inputDiscountPercentage !== undefined
          ? inputDiscountPercentage
          : toOptionalSafePercent(existingBooking.discountPercentage) || 0;
      const financials = resolveBookingFinancials({
        totalAmount,
        discountPercentage: effectiveDiscountPercentage,
        discountAmountInput:
          readDualMoney(data, 'discountAmountValue', 'discountAmount') ||
          toSafeMoney(existingBooking.discountAmount),
        finalAmountInput: readDualMoney(data, 'finalAmountValue', 'finalAmount'),
      });
      if (financials.exceededCeiling) {
        throw new Error('BOOKING_NET_EXCEEDS_BILL');
      }
      const { discountAmount, grandTotal, finalAmountValue } = financials;
      // Always derive paymentReceived from actual payment records — ignore any
      // client-supplied value, which can drift when versions are cloned.
      const paymentAgg = await tx.bookingPayments.aggregate({
        where: { bookingId: id },
        _sum: { amount: true },
      });
      const paymentReceived = toSafeMoney(Number(paymentAgg._sum.amount ?? 0));
      const balanceAmount = toSafeMoney(grandTotal - paymentReceived);
      const totalBillAmountValue = totalAmount;
      const dueAmountValue =
        readDualMoney(data, 'dueAmountValue', 'dueAmount') ?? balanceAmount;

      await tx.booking.update({
        where: { id },
        data: {
          totalAmount,
          totalBillAmount: toStoredNumberString(totalAmount),
          totalBillAmountValue,
          discountAmount,
          discountPercentage: effectiveDiscountPercentage,
          grandTotal,
          finalAmount: toStoredNumberString(finalAmountValue) || toStoredNumberString(grandTotal),
          finalAmountValue,
          balanceAmount,
          dueAmount: toStoredNumberString(dueAmountValue) || toStoredNumberString(balanceAmount),
          dueAmountValue,
          // Always write back the authoritative SUM so the stored value never
          // drifts (e.g. after a version clone carries a stale value forward).
          paymentReceivedAmount: toStoredNumberString(paymentReceived),
          paymentReceivedAmountValue: paymentReceived,
          advanceReceived: paymentReceived,
        },
      });

      return tx.booking.findUnique({
        where: { id },
        include: {
          customer: true,
          secondCustomer: true,
          halls: {
            include: {
              hall: true,
            },
          },
          packs: {
            include: {
              mealSlot: true,
              bookingMenu: {
                include: {
                  items: {
                    include: {
                      item: true,
                    },
                  },
                },
              },
            },
          },
          additionalItems: true,
        },
      });
    });

    if (!booking) {
      sendNotFound(res, 'Booking not found');
      return;
    }

    void createAuditLog(req, 'UPDATE', 'booking', id, [(booking as any).customer?.name, booking.functionName].filter(Boolean).join(' – '));
    sendSuccess(res, { booking }, 'Booking updated successfully');
    emitBookingBroadcast('booking:updated', {
      id: booking.id,
      status: booking.status,
      functionDate: booking.functionDate,
      functionType: booking.functionType,
    });
    emitBookingCalendarSync(booking);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Selected halls must belong to the same banquet' ||
        error.message === 'One or more selected halls are invalid'
      ) {
        sendError(res, error.message, 400);
        return;
      }
      if (error.message === 'BOOKING_NET_EXCEEDS_BILL') {
        sendError(
          res,
          'Billing total is higher than hall, catering, and extra items. Adjust amounts and try again.',
          400
        );
        return;
      }
    }
    if (isHallClashConstraintError(error)) {
      sendError(
        res,
        'Hall timing clash detected with an existing booking. Please choose a different hall or time slot.',
        409
      );
      return;
    }
    if (isRetryableSerializableError(error)) {
      sendError(res, 'Booking conflict detected. Please retry the request.', 409);
      return;
    }
    sendError(res, 'Failed to update booking');
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const allowedBanquetIds = getAllowedBanquetIds(req);
    const existing = await prisma.booking.findFirst({
      where: withBookingBanquetScope({ id, isLatest: true }, allowedBanquetIds),
      select: { id: true, status: true, isLatest: true },
    });
    if (!existing) {
      sendNotFound(res, 'Booking not found');
      return;
    }
    if (bookingIsImmutable(existing)) {
      sendError(res, bookingImmutableMessage(existing), 400);
      return;
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
    });

    void createAuditLog(req, 'CANCEL', 'booking', id, '');
    sendSuccess(res, { booking }, 'Booking cancelled successfully');
    emitBookingBroadcast('booking:cancelled', {
      id: booking.id,
      status: booking.status,
    });
    emitBookingCalendarCancel(id);
  } catch (error: any) {
    if (error.code === 'P2025') {
      sendNotFound(res, 'Booking not found');
    } else {
      sendError(res, 'Failed to cancel booking');
    }
  }
}

/**
 * Delete booking
 */
export async function deleteBooking(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const allowedBanquetIds = getAllowedBanquetIds(req);
    const existing = await prisma.booking.findFirst({
      where: withBookingBanquetScope({ id, isLatest: true }, allowedBanquetIds),
      select: { id: true, status: true, isLatest: true },
    });
    if (!existing) {
      sendNotFound(res, 'Booking not found');
      return;
    }
    if (bookingIsImmutable(existing)) {
      sendError(res, bookingImmutableMessage(existing), 400);
      return;
    }

    await prisma.booking.delete({
      where: { id },
    });

    void createAuditLog(req, 'DELETE', 'booking', id, '');
    sendSuccess(res, null, 'Booking deleted successfully');
    emitBookingCalendarCancel(id);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Booking not found');
      return;
    }
    sendError(res, 'Failed to delete booking');
  }
}
