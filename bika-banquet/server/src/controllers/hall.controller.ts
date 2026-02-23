import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import { normalizeCaseFields } from '../utils/textCase';
import { idSchema } from '../utils/validation';

export const createHallSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    banquetId: idSchema('banquet ID').optional(),
    location: z.string().optional(),
    rate: z.string().optional(),
    capacity: z.number().int().min(1, 'Capacity is required'),
    floatingCapacity: z.number().int().optional(),
    area: z.number().optional(),
    photo: z.string().optional(),
    order: z.number().int().optional(),
    floorNumber: z.number().int().optional(),
    amenities: z.string().optional(),
    description: z.string().optional(),
    basePrice: z.number().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateHallSchema = z.object({
  params: z.object({
    id: idSchema('hall ID'),
  }),
  body: createHallSchema.shape.body.partial(),
});

export async function createHall(req: Request, res: Response): Promise<void> {
  try {
    const payload = normalizeCaseFields({ ...req.body }, [
      'name',
      'location',
      'amenities',
    ]);
    const hall = await prisma.hall.create({
      data: {
        ...payload,
        images: payload.images || [],
      },
    });
    sendSuccess(res, { hall }, 'Hall created successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'Hall name already exists', 409);
      return;
    }
    sendError(res, 'Failed to create hall');
  }
}

export async function getHalls(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || '';
    const banquetId = req.query.banquetId as string | undefined;

    const where: Record<string, unknown> = {};
    if (banquetId) {
      where.banquetId = banquetId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        {
          banquet: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [halls, total] = await Promise.all([
      prisma.hall.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: {
          banquet: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          _count: {
            select: {
              enquiryHalls: true,
              bookingHalls: true,
            },
          },
        },
      }),
      prisma.hall.count({ where }),
    ]);

    sendSuccess(res, {
      halls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch halls');
  }
}

export async function getHallById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const hall = await prisma.hall.findUnique({
      where: { id },
      include: {
        banquet: true,
      },
    });
    if (!hall) {
      sendNotFound(res, 'Hall not found');
      return;
    }
    sendSuccess(res, { hall });
  } catch (error) {
    sendError(res, 'Failed to fetch hall');
  }
}

export async function updateHall(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const payload = normalizeCaseFields({ ...req.body }, [
      'name',
      'location',
      'amenities',
    ]);
    const hall = await prisma.hall.update({
      where: { id },
      data: payload,
      include: {
        banquet: true,
      },
    });
    sendSuccess(res, { hall }, 'Hall updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Hall not found');
      return;
    }
    if (error?.code === 'P2002') {
      sendError(res, 'Hall name already exists', 409);
      return;
    }
    sendError(res, 'Failed to update hall');
  }
}

export async function deleteHall(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.hall.delete({
      where: { id },
    });
    sendSuccess(res, null, 'Hall deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Hall not found');
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Cannot delete hall linked to bookings or enquiries', 409);
      return;
    }
    sendError(res, 'Failed to delete hall');
  }
}
