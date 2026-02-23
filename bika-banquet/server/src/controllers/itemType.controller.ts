import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import { normalizeCaseFields } from '../utils/textCase';

export const createItemTypeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    order: z.number().int().optional(),
    displayOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateItemTypeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid item type ID'),
  }),
  body: createItemTypeSchema.shape.body.partial(),
});

export async function createItemType(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const payload = normalizeCaseFields({ ...req.body }, ['name']);
    const itemType = await prisma.itemType.create({
      data: payload,
    });
    sendSuccess(res, { itemType }, 'Item type created successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'Item type name already exists', 409);
      return;
    }
    sendError(res, 'Failed to create item type');
  }
}

export async function getItemTypes(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || '';

    const where = search
      ? {
          name: { contains: search, mode: 'insensitive' as const },
        }
      : undefined;

    const [itemTypes, total] = await Promise.all([
      prisma.itemType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ order: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.itemType.count({ where }),
    ]);

    sendSuccess(res, {
      itemTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch item types');
  }
}

export async function getItemTypeById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const itemType = await prisma.itemType.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    if (!itemType) {
      sendNotFound(res, 'Item type not found');
      return;
    }
    sendSuccess(res, { itemType });
  } catch (error) {
    sendError(res, 'Failed to fetch item type');
  }
}

export async function updateItemType(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const payload = normalizeCaseFields({ ...req.body }, ['name']);
    const itemType = await prisma.itemType.update({
      where: { id },
      data: payload,
    });
    sendSuccess(res, { itemType }, 'Item type updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Item type not found');
      return;
    }
    if (error?.code === 'P2002') {
      sendError(res, 'Item type name already exists', 409);
      return;
    }
    sendError(res, 'Failed to update item type');
  }
}

export async function deleteItemType(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.itemType.delete({
      where: { id },
    });
    sendSuccess(res, null, 'Item type deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Item type not found');
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Cannot delete item type with linked items', 409);
      return;
    }
    sendError(res, 'Failed to delete item type');
  }
}
