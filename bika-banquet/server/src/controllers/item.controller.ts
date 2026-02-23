import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import { normalizeCaseFields } from '../utils/textCase';

export const createItemSchema = z.object({
  body: z.object({
    itemTypeId: z.string().uuid('Invalid item type ID'),
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    photo: z.string().optional(),
    setupCost: z.string().optional(),
    itemCost: z.string().optional(),
    point: z.number().int().optional(),
    cost: z.number().optional(),
    points: z.number().int().optional(),
    isVeg: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid item ID'),
  }),
  body: createItemSchema.shape.body.partial(),
});

export async function createItem(req: Request, res: Response): Promise<void> {
  try {
    const payload = normalizeCaseFields({ ...req.body }, ['name']);
    const item = await prisma.item.create({
      data: payload,
      include: {
        itemType: true,
      },
    });
    sendSuccess(res, { item }, 'Item created successfully', 201);
  } catch (error) {
    sendError(res, 'Failed to create item');
  }
}

export async function getItems(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || '';
    const itemTypeId = req.query.itemTypeId as string | undefined;

    const where: Record<string, unknown> = {};
    if (itemTypeId) {
      where.itemTypeId = itemTypeId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { itemType: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          itemType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    sendSuccess(res, {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch items');
  }
}

export async function getItemById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        itemType: true,
      },
    });
    if (!item) {
      sendNotFound(res, 'Item not found');
      return;
    }
    sendSuccess(res, { item });
  } catch (error) {
    sendError(res, 'Failed to fetch item');
  }
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const payload = normalizeCaseFields({ ...req.body }, ['name']);
    const item = await prisma.item.update({
      where: { id },
      data: payload,
      include: {
        itemType: true,
      },
    });
    sendSuccess(res, { item }, 'Item updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Item not found');
      return;
    }
    sendError(res, 'Failed to update item');
  }
}

export async function deleteItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.item.delete({
      where: { id },
    });
    sendSuccess(res, null, 'Item deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Item not found');
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Cannot delete item linked to menu data', 409);
      return;
    }
    sendError(res, 'Failed to delete item');
  }
}
