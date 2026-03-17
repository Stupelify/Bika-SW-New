import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import { normalizeCaseFields } from '../utils/textCase';
import { idSchema } from '../utils/validation';
import { sanitizeSearchTerm } from '../utils/search';
import { parsePagination } from '../utils/pagination';

export const createBanquetSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    location: z.string().min(2, 'Location is required'),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    facilities: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateBanquetSchema = z.object({
  params: z.object({
    id: idSchema('banquet ID'),
  }),
  body: createBanquetSchema.shape.body.partial(),
});

export async function createBanquet(req: Request, res: Response): Promise<void> {
  try {
    const payload = normalizeCaseFields({ ...req.body }, [
      'name',
      'location',
      'address',
      'city',
      'state',
      'facilities',
    ]);
    const banquet = await prisma.banquet.create({
      data: payload,
    });
    sendSuccess(res, { banquet }, 'Banquet created successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'Banquet name already exists', 409);
      return;
    }
    sendError(res, 'Failed to create banquet');
  }
}

export async function getBanquets(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(
      req.query.page,
      req.query.limit,
      20,
      200
    );
    const search = sanitizeSearchTerm(req.query.search);

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [banquets, total] = await Promise.all([
      prisma.banquet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          halls: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.banquet.count({ where }),
    ]);

    sendSuccess(res, {
      banquets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch banquets');
  }
}

export async function getBanquetById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const banquet = await prisma.banquet.findUnique({
      where: { id },
      include: {
        halls: true,
      },
    });

    if (!banquet) {
      sendNotFound(res, 'Banquet not found');
      return;
    }

    sendSuccess(res, { banquet });
  } catch (error) {
    sendError(res, 'Failed to fetch banquet');
  }
}

export async function updateBanquet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const payload = normalizeCaseFields({ ...req.body }, [
      'name',
      'location',
      'address',
      'city',
      'state',
      'facilities',
    ]);
    const banquet = await prisma.banquet.update({
      where: { id },
      data: payload,
    });
    sendSuccess(res, { banquet }, 'Banquet updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Banquet not found');
      return;
    }
    if (error?.code === 'P2002') {
      sendError(res, 'Banquet name already exists', 409);
      return;
    }
    sendError(res, 'Failed to update banquet');
  }
}

export async function deleteBanquet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.banquet.delete({
      where: { id },
    });
    sendSuccess(res, null, 'Banquet deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Banquet not found');
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Cannot delete banquet with linked halls', 409);
      return;
    }
    sendError(res, 'Failed to delete banquet');
  }
}
