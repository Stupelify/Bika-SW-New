import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import {
  removeEnquiryEventFromGoogleCalendar,
  syncEnquiryEventToGoogleCalendar,
} from '../services/googleCalendar.service';

export const createEnquirySchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer ID'),
    functionName: z.string().min(2, 'Function name is required'),
    functionType: z.string().min(2, 'Function type is required'),
    functionDate: z.string().min(1, 'Function date is required'),
    functionTime: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    expectedGuests: z.number().int().min(1).default(1),
    budgetPerPlate: z.number().optional(),
    specialRequirements: z.string().optional(),
    quotation: z.boolean().optional(),
    quotationSent: z.boolean().optional(),
    quotationValidUntil: z.string().optional(),
    pencilBooking: z.boolean().optional(),
    isPencilBooked: z.boolean().optional(),
    validity: z.string().optional(),
    pencilBookedUntil: z.string().optional(),
    note: z.string().optional(),
    notes: z.string().optional(),
    hallIds: z.array(z.string().uuid()).optional(),
    packs: z
      .array(
        z.object({
          mealSlotId: z.string().uuid(),
          templateMenuId: z.string().uuid(),
          packCount: z.number().int().min(1).optional(),
          noOfPack: z.number().int().min(1).optional(),
          timeSlot: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const updateEnquirySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid enquiry ID'),
  }),
  body: createEnquirySchema.shape.body.partial(),
});

function toDate(input?: string): Date | undefined {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export async function createEnquiry(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body;

    const enquiry = await prisma.$transaction(async (tx) => {
      const created = await tx.enquiry.create({
        data: {
          customerId: payload.customerId,
          functionName: payload.functionName,
          functionType: payload.functionType,
          functionDate: new Date(payload.functionDate),
          functionTime: payload.functionTime,
          startTime: payload.startTime,
          endTime: payload.endTime,
          expectedGuests: payload.expectedGuests ?? 1,
          budgetPerPlate: payload.budgetPerPlate,
          specialRequirements: payload.specialRequirements,
          quotation: payload.quotation ?? payload.quotationSent ?? false,
          quotationSent: payload.quotationSent ?? payload.quotation ?? false,
          quotationValidUntil: toDate(payload.quotationValidUntil),
          pencilBooking:
            payload.pencilBooking ?? payload.isPencilBooked ?? false,
          isPencilBooked:
            payload.isPencilBooked ?? payload.pencilBooking ?? false,
          validity: toDate(payload.validity),
          pencilBookedUntil: toDate(payload.pencilBookedUntil),
          note: payload.note,
          notes: payload.notes ?? payload.note,
          status: 'pending',
        },
      });

      if (Array.isArray(payload.hallIds) && payload.hallIds.length > 0) {
        await tx.enquiryHall.createMany({
          data: payload.hallIds.map((hallId: string) => ({
            enquiryId: created.id,
            hallId,
          })),
          skipDuplicates: true,
        });
      }

      if (Array.isArray(payload.packs) && payload.packs.length > 0) {
        await tx.enquiryPack.createMany({
          data: payload.packs.map(
            (pack: {
              mealSlotId: string;
              templateMenuId: string;
              packCount?: number;
              noOfPack?: number;
              timeSlot?: string;
              notes?: string;
            }) => ({
              enquiryId: created.id,
              mealSlotId: pack.mealSlotId,
              templateMenuId: pack.templateMenuId,
              packCount: pack.packCount ?? pack.noOfPack ?? 1,
              noOfPack: pack.noOfPack ?? pack.packCount ?? 1,
              timeSlot: pack.timeSlot,
              notes: pack.notes,
            })
          ),
        });
      }

      return tx.enquiry.findUnique({
        where: { id: created.id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          halls: {
            include: {
              hall: true,
            },
          },
          packs: {
            include: {
              mealSlot: true,
              templateMenu: true,
            },
          },
        },
      });
    });

    if (enquiry) {
      await syncEnquiryEventToGoogleCalendar(enquiry);
    }

    sendSuccess(res, { enquiry }, 'Enquiry created successfully', 201);
  } catch (error) {
    sendError(res, 'Failed to create enquiry');
  }
}

export async function getEnquiries(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { functionName: { contains: search, mode: 'insensitive' } },
        { functionType: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { functionDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
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
          packs: {
            include: {
              mealSlot: {
                select: {
                  id: true,
                  name: true,
                },
              },
              templateMenu: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.enquiry.count({ where }),
    ]);

    sendSuccess(res, {
      enquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch enquiries');
  }
}

export async function getEnquiryById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        customer: true,
        halls: {
          include: {
            hall: true,
          },
        },
        packs: {
          include: {
            mealSlot: true,
            templateMenu: {
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
      },
    });

    if (!enquiry) {
      sendNotFound(res, 'Enquiry not found');
      return;
    }

    sendSuccess(res, { enquiry });
  } catch (error) {
    sendError(res, 'Failed to fetch enquiry');
  }
}

export async function updateEnquiry(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const payload = req.body;

    const exists = await prisma.enquiry.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      sendNotFound(res, 'Enquiry not found');
      return;
    }

    const enquiry = await prisma.$transaction(async (tx) => {
      await tx.enquiry.update({
        where: { id },
        data: {
          customerId: payload.customerId,
          functionName: payload.functionName,
          functionType: payload.functionType,
          functionDate: payload.functionDate
            ? new Date(payload.functionDate)
            : undefined,
          functionTime: payload.functionTime,
          startTime: payload.startTime,
          endTime: payload.endTime,
          expectedGuests: payload.expectedGuests,
          budgetPerPlate: payload.budgetPerPlate,
          specialRequirements: payload.specialRequirements,
          quotation:
            payload.quotation ?? payload.quotationSent ?? undefined,
          quotationSent:
            payload.quotationSent ?? payload.quotation ?? undefined,
          quotationValidUntil: toDate(payload.quotationValidUntil),
          pencilBooking:
            payload.pencilBooking ?? payload.isPencilBooked ?? undefined,
          isPencilBooked:
            payload.isPencilBooked ?? payload.pencilBooking ?? undefined,
          validity: toDate(payload.validity),
          pencilBookedUntil: toDate(payload.pencilBookedUntil),
          note: payload.note,
          notes: payload.notes ?? payload.note,
          status: payload.status,
        },
      });

      if (Array.isArray(payload.hallIds)) {
        await tx.enquiryHall.deleteMany({ where: { enquiryId: id } });
        if (payload.hallIds.length > 0) {
          await tx.enquiryHall.createMany({
            data: payload.hallIds.map((hallId: string) => ({
              enquiryId: id,
              hallId,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (Array.isArray(payload.packs)) {
        await tx.enquiryPack.deleteMany({ where: { enquiryId: id } });
        if (payload.packs.length > 0) {
          await tx.enquiryPack.createMany({
            data: payload.packs.map(
              (pack: {
                mealSlotId: string;
                templateMenuId: string;
                packCount?: number;
                noOfPack?: number;
                timeSlot?: string;
                notes?: string;
              }) => ({
                enquiryId: id,
                mealSlotId: pack.mealSlotId,
                templateMenuId: pack.templateMenuId,
                packCount: pack.packCount ?? pack.noOfPack ?? 1,
                noOfPack: pack.noOfPack ?? pack.packCount ?? 1,
                timeSlot: pack.timeSlot,
                notes: pack.notes,
              })
            ),
          });
        }
      }

      return tx.enquiry.findUnique({
        where: { id },
        include: {
          customer: true,
          halls: {
            include: {
              hall: true,
            },
          },
          packs: {
            include: {
              mealSlot: true,
              templateMenu: true,
            },
          },
        },
      });
    });

    if (enquiry) {
      await syncEnquiryEventToGoogleCalendar(enquiry);
    }

    sendSuccess(res, { enquiry }, 'Enquiry updated successfully');
  } catch (error) {
    sendError(res, 'Failed to update enquiry');
  }
}

export async function deleteEnquiry(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.enquiry.delete({
      where: { id },
    });

    await removeEnquiryEventFromGoogleCalendar(id);

    sendSuccess(res, null, 'Enquiry deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Enquiry not found');
      return;
    }
    sendError(res, 'Failed to delete enquiry');
  }
}
