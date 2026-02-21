import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';

const menuItemSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  quantity: z.number().int().min(1).optional(),
});

export const createTemplateMenuSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    setupCost: z.number().optional(),
    ratePerPlate: z.number().optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
    menuItems: z.array(menuItemSchema).optional(),
    itemIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateTemplateMenuSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid template menu ID'),
  }),
  body: createTemplateMenuSchema.shape.body.partial(),
});

export async function createTemplateMenu(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const payload = req.body;
    const menuItems = Array.isArray(payload.menuItems)
      ? payload.menuItems
      : Array.isArray(payload.itemIds)
      ? payload.itemIds.map((itemId: string) => ({ itemId, quantity: 1 }))
      : [];

    const templateMenu = await prisma.$transaction(async (tx) => {
      const created = await tx.templateMenu.create({
        data: {
          name: payload.name,
          description: payload.description,
          setupCost: payload.setupCost ?? 0,
          ratePerPlate: payload.ratePerPlate ?? 0,
          category: payload.category,
          isActive: payload.isActive ?? true,
        },
      });

      if (menuItems.length > 0) {
        await tx.templateMenuItem.createMany({
          data: menuItems.map(
            (item: {
              itemId: string;
              quantity?: number;
            }) => ({
              templateMenuId: created.id,
              itemId: item.itemId,
              quantity: item.quantity ?? 1,
            })
          ),
          skipDuplicates: true,
        });
      }

      return tx.templateMenu.findUnique({
        where: { id: created.id },
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
      });
    });

    sendSuccess(res, { templateMenu }, 'Template menu created successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'Template menu name already exists', 409);
      return;
    }
    sendError(res, 'Failed to create template menu');
  }
}

export async function getTemplateMenus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || '';

    const where = search
      ? {
          name: { contains: search, mode: 'insensitive' as const },
        }
      : undefined;

    const [templateMenus, total] = await Promise.all([
      prisma.templateMenu.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.templateMenu.count({ where }),
    ]);

    sendSuccess(res, {
      templateMenus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch template menus');
  }
}

export async function getTemplateMenuById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const templateMenu = await prisma.templateMenu.findUnique({
      where: { id },
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
    });
    if (!templateMenu) {
      sendNotFound(res, 'Template menu not found');
      return;
    }
    sendSuccess(res, { templateMenu });
  } catch (error) {
    sendError(res, 'Failed to fetch template menu');
  }
}

export async function updateTemplateMenu(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const payload = req.body;
    const menuItems = Array.isArray(payload.menuItems)
      ? payload.menuItems
      : Array.isArray(payload.itemIds)
      ? payload.itemIds.map((itemId: string) => ({ itemId, quantity: 1 }))
      : undefined;

    const templateMenu = await prisma.$transaction(async (tx) => {
      await tx.templateMenu.update({
        where: { id },
        data: {
          name: payload.name,
          description: payload.description,
          setupCost: payload.setupCost,
          ratePerPlate: payload.ratePerPlate,
          category: payload.category,
          isActive: payload.isActive,
        },
      });

      if (menuItems) {
        await tx.templateMenuItem.deleteMany({
          where: { templateMenuId: id },
        });

        if (menuItems.length > 0) {
          await tx.templateMenuItem.createMany({
            data: menuItems.map(
              (item: {
                itemId: string;
                quantity?: number;
              }) => ({
                templateMenuId: id,
                itemId: item.itemId,
                quantity: item.quantity ?? 1,
              })
            ),
            skipDuplicates: true,
          });
        }
      }

      return tx.templateMenu.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              item: true,
            },
          },
        },
      });
    });

    sendSuccess(res, { templateMenu }, 'Template menu updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Template menu not found');
      return;
    }
    if (error?.code === 'P2002') {
      sendError(res, 'Template menu name already exists', 409);
      return;
    }
    sendError(res, 'Failed to update template menu');
  }
}

export async function deleteTemplateMenu(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.templateMenu.delete({
      where: { id },
    });
    sendSuccess(res, null, 'Template menu deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Template menu not found');
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Cannot delete template menu linked to enquiries', 409);
      return;
    }
    sendError(res, 'Failed to delete template menu');
  }
}
