import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  cancelBookingEventInGoogleCalendar,
  syncBookingEventToGoogleCalendar,
} from '../services/googleCalendar.service';

// Validation schemas
export const createBookingSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer ID'),
    secondCustomerId: z.string().uuid().optional(),
    referredById: z.string().uuid().optional(),
    functionName: z.string().min(2, 'Function name is required'),
    functionType: z.string().min(2, 'Function type is required'),
    functionDate: z.string(),
    functionTime: z.string(),
    expectedGuests: z.number().min(1, 'Expected guests must be at least 1'),
    confirmedGuests: z.number().optional(),
    isQuotation: z.boolean().optional(),
    halls: z.array(z.object({
      hallId: z.string().uuid(),
      charges: z.number().min(0),
    })).optional(),
    packs: z.array(z.object({
      mealSlotId: z.string().uuid().optional(),
      packName: z.string(),
      noOfPack: z.number().min(1).optional(),
      packCount: z.number().min(1).optional(),
      hallIds: z.array(z.number().int()).optional(),
      ratePerPlate: z.number().min(0),
      setupCost: z.number().min(0).optional(),
      extraCharges: z.number().min(0).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      extraPlate: z.number().int().optional(),
      extraRate: z.string().optional(),
      extraAmount: z.string().optional(),
      menuPoint: z.number().int().optional(),
      hallRate: z.string().optional(),
      boardToRead: z.string().optional(),
      hallName: z.string().optional(),
      timeSlot: z.string().optional(),
      tags: z.array(z.string()).optional(),
      menu: z.object({
        name: z.string(),
        templateMenuId: z.string().uuid().optional(),
        items: z.array(z.object({
          itemId: z.string().uuid(),
          quantity: z.number().min(1),
        })),
      }),
    })).optional(),
    additionalItems: z.array(z.object({
      description: z.string(),
      charges: z.number(),
      quantity: z.number().min(1).optional(),
    })).optional(),
    discountAmount: z.number().min(0).optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
  }),
});

function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function resolveMealSlotId(
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

/**
 * Create new booking
 */
export async function createBooking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data = req.body;

    // Start transaction
    const booking = await prisma.$transaction(async (tx) => {
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
          expectedGuests: data.expectedGuests,
          confirmedGuests: data.confirmedGuests,
          quotation:
            data.quotation !== undefined
              ? data.quotation
              : data.isQuotation || false,
          isQuotation: data.isQuotation || false,
          notes: data.notes,
          internalNotes: data.internalNotes,
        },
      });

      // Create hall associations
      if (data.halls && data.halls.length > 0) {
        await tx.bookingHall.createMany({
          data: data.halls.map((hall: any) => ({
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
              setupCost: pack.setupCost || 0,
              ratePerPlate: pack.ratePerPlate,
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
          await tx.bookingPack.create({
            data: {
              bookingId: newBooking.id,
              mealSlotId,
              bookingMenuId: menu.id,
              packName: pack.packName,
              noOfPack: Math.max(1, toSafeNumber(pack.noOfPack ?? normalizedPackCount)),
              packCount: normalizedPackCount,
              hallIds: pack.hallIds || [],
              ratePerPlate: pack.ratePerPlate,
              setupCost: pack.setupCost || 0,
              startTime: pack.startTime,
              endTime: pack.endTime,
              extraPlate: pack.extraPlate,
              extraRate: pack.extraRate,
              extraAmount: pack.extraAmount,
              menuPoint: pack.menuPoint,
              hallRate: pack.hallRate,
              boardToRead: pack.boardToRead,
              extraCharges: pack.extraCharges || 0,
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
            charges: item.charges,
            quantity: item.quantity || 1,
          })),
        });
      }

      // Calculate totals
      let totalAmount = 0;

      // Add hall charges
      if (data.halls) {
        totalAmount += data.halls.reduce((sum: number, h: any) => sum + h.charges, 0);
      }

      // Add pack charges
      if (data.packs) {
        for (const pack of data.packs) {
          const normalizedPackCount = Math.max(
            1,
            toSafeNumber(pack.packCount ?? pack.noOfPack ?? 1)
          );
          const packTotal =
            (pack.ratePerPlate * normalizedPackCount) +
            (pack.setupCost || 0) +
            (pack.extraCharges || 0);
          totalAmount += packTotal;
        }
      }

      // Add additional items
      if (data.additionalItems) {
        totalAmount += data.additionalItems.reduce(
          (sum: number, item: any) => sum + item.charges * (item.quantity || 1),
          0
        );
      }

      // Calculate discount
      let discountAmount = data.discountAmount || 0;
      if (data.discountPercentage && data.discountPercentage > 0) {
        discountAmount = (totalAmount * data.discountPercentage) / 100;
      }

      const grandTotal = totalAmount - discountAmount;
      const balanceAmount = grandTotal - (data.advanceReceived || 0);

      // Update booking with totals
      return await tx.booking.update({
        where: { id: newBooking.id },
        data: {
          totalAmount,
          totalBillAmount: `${totalAmount}`,
          discountAmount,
          discountPercentage: data.discountPercentage || 0,
          discountAmount2nd:
            data.discountAmount2nd !== undefined
              ? `${data.discountAmount2nd}`
              : undefined,
          discountPercentage2nd:
            data.discountPercentage2nd !== undefined
              ? `${data.discountPercentage2nd}`
              : undefined,
          grandTotal,
          finalAmount: `${grandTotal}`,
          balanceAmount,
          dueAmount: `${balanceAmount}`,
          advanceRequired:
            data.advanceRequired !== undefined
              ? `${data.advanceRequired}`
              : undefined,
          paymentReceivedPercent:
            data.paymentReceivedPercent !== undefined
              ? `${data.paymentReceivedPercent}`
              : undefined,
          paymentReceivedAmount:
            data.paymentReceivedAmount !== undefined
              ? `${data.paymentReceivedAmount}`
              : undefined,
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

    await syncBookingEventToGoogleCalendar(booking);

    sendSuccess(res, { booking }, 'Booking created successfully', 201);
  } catch (error: any) {
    console.error('Booking creation error:', error);
    sendError(res, 'Failed to create booking');
  }
}

/**
 * Get all bookings with filters
 */
export async function getBookings(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const isQuotation = req.query.isQuotation === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isLatest: true };

    if (status) {
      where.status = status;
    }

    if (isQuotation !== undefined) {
      where.isQuotation = isQuotation;
    }

    if (search) {
      where.OR = [
        { functionName: { contains: search, mode: 'insensitive' } },
        { functionType: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    if (fromDate || toDate) {
      where.functionDate = {};
      if (fromDate) {
        where.functionDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.functionDate.lte = new Date(toDate);
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { functionDate: 'desc' },
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
                },
              },
            },
          },
          _count: {
            select: {
              payments: true,
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
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
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
        previousBooking: true,
        nextVersion: true,
      },
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
 * Update booking
 */
export async function updateBooking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      sendNotFound(res, 'Booking not found');
      return;
    }

    // Create new version if not a quotation
    if (!existingBooking.isQuotation && data.createNewVersion) {
      // Mark current as not latest
      await prisma.booking.update({
        where: { id },
        data: { isLatest: false },
      });

      // Create new version
      const newVersion = await prisma.booking.create({
        data: {
          ...existingBooking,
          id: undefined, // Let Prisma generate new ID
          previousBookingId: id,
          versionNumber: existingBooking.versionNumber + 1,
          isLatest: true,
          updatedAt: new Date(),
        } as any,
      });

      await cancelBookingEventInGoogleCalendar(id);
      await syncBookingEventToGoogleCalendar(newVersion);

      sendSuccess(res, { booking: newVersion }, 'New booking version created');
      return;
    }

    const booking = await prisma.$transaction(async (tx) => {
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
          expectedGuests: data.expectedGuests,
          confirmedGuests: data.confirmedGuests,
          quotation:
            data.quotation !== undefined
              ? data.quotation
              : data.isQuotation !== undefined
              ? data.isQuotation
              : undefined,
          isQuotation: data.isQuotation,
          notes: data.notes,
          internalNotes: data.internalNotes,
          advanceRequired:
            data.advanceRequired !== undefined ? `${data.advanceRequired}` : undefined,
          paymentReceivedPercent:
            data.paymentReceivedPercent !== undefined
              ? `${data.paymentReceivedPercent}`
              : undefined,
          paymentReceivedAmount:
            data.paymentReceivedAmount !== undefined
              ? `${data.paymentReceivedAmount}`
              : undefined,
          dueAmount: data.dueAmount !== undefined ? `${data.dueAmount}` : undefined,
        },
      });

      if (Array.isArray(data.halls)) {
        await tx.bookingHall.deleteMany({ where: { bookingId: id } });
        if (data.halls.length > 0) {
          await tx.bookingHall.createMany({
            data: data.halls.map((hall: { hallId: string; charges?: number }) => ({
              bookingId: id,
              hallId: hall.hallId,
              charges: toSafeNumber(hall.charges),
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
                charges: toSafeNumber(item.charges),
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

          const menu = await tx.bookingMenu.create({
            data: {
              name: pack.menu?.name || `${pack.packName || 'Menu'} Menu`,
              setupCost: toSafeNumber(pack.setupCost),
              ratePerPlate: toSafeNumber(pack.ratePerPlate),
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
              ratePerPlate: toSafeNumber(pack.ratePerPlate),
              setupCost: toSafeNumber(pack.setupCost),
              startTime: pack.startTime,
              endTime: pack.endTime,
              extraPlate: pack.extraPlate,
              extraRate: pack.extraRate,
              extraAmount: pack.extraAmount,
              menuPoint: pack.menuPoint,
              hallRate: pack.hallRate,
              boardToRead: pack.boardToRead,
              extraCharges: toSafeNumber(pack.extraCharges),
              hallName: pack.hallName,
              timeSlot: pack.timeSlot,
              tags: pack.tags || [],
            },
          });
        }
      }

      const hallRows = Array.isArray(data.halls)
        ? data.halls
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

      const hallTotal = hallRows.reduce(
        (sum: number, hall: { charges?: number }) => sum + toSafeNumber(hall.charges),
        0
      );
      const packTotal = packRows.reduce(
        (sum: number, pack: any) =>
          sum +
          toSafeNumber(pack.ratePerPlate) *
            Math.max(1, toSafeNumber(pack.packCount ?? pack.noOfPack ?? 1)) +
          toSafeNumber(pack.setupCost) +
          toSafeNumber(pack.extraCharges),
        0
      );
      const additionalItemsTotal = additionalItemRows.reduce(
        (sum: number, item: { charges?: number; quantity?: number }) =>
          sum +
          toSafeNumber(item.charges) *
            Math.max(1, toSafeNumber(item.quantity || 1)),
        0
      );

      const totalAmount = hallTotal + packTotal + additionalItemsTotal;
      let discountAmount = toSafeNumber(data.discountAmount);
      if (toSafeNumber(data.discountPercentage) > 0) {
        discountAmount = (totalAmount * toSafeNumber(data.discountPercentage)) / 100;
      }
      const grandTotal = Math.max(0, totalAmount - discountAmount);
      const paymentReceived = toSafeNumber(data.paymentReceivedAmount);
      const balanceAmount = grandTotal - paymentReceived;

      await tx.booking.update({
        where: { id },
        data: {
          totalAmount,
          totalBillAmount: `${totalAmount}`,
          discountAmount,
          discountPercentage: toSafeNumber(data.discountPercentage),
          grandTotal,
          finalAmount:
            data.finalAmount !== undefined ? `${data.finalAmount}` : `${grandTotal}`,
          balanceAmount,
          dueAmount:
            data.dueAmount !== undefined ? `${data.dueAmount}` : `${balanceAmount}`,
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

    await syncBookingEventToGoogleCalendar(booking);

    sendSuccess(res, { booking }, 'Booking updated successfully');
  } catch (error) {
    sendError(res, 'Failed to update booking');
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
    });

    await cancelBookingEventInGoogleCalendar(id);

    sendSuccess(res, { booking }, 'Booking cancelled successfully');
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
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.booking.delete({
      where: { id },
    });

    await cancelBookingEventInGoogleCalendar(id);

    sendSuccess(res, null, 'Booking deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Booking not found');
      return;
    }
    sendError(res, 'Failed to delete booking');
  }
}

/**
 * Add payment to booking
 */
export async function addPayment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { amount, method, reference, narration, paymentDate } = req.body;

    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.bookingPayments.create({
        data: {
          bookingId: id,
          receivedBy: req.user!.userId,
          amount,
          method,
          reference,
          narration,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        },
      });

      // Update booking balance
      const booking = await tx.booking.findUnique({
        where: { id },
      });

      if (booking) {
        await tx.booking.update({
          where: { id },
          data: {
            advanceReceived: booking.advanceReceived + amount,
            balanceAmount: booking.balanceAmount - amount,
          },
        });
      }

      return newPayment;
    });

    sendSuccess(res, { payment }, 'Payment added successfully', 201);
  } catch (error) {
    sendError(res, 'Failed to add payment');
  }
}
