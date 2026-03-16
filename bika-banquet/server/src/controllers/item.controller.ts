import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import { normalizeCaseFields } from '../utils/textCase';
import { idSchema } from '../utils/validation';
import { sanitizeSearchTerm } from '../utils/search';
import { parsePagination } from '../utils/pagination';
import {
  areUnitsCompatible,
  QUANTITY_UNITS,
  normalizeQuantityUnit,
} from '../config/units';

const measureUnitSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.enum(QUANTITY_UNITS, {
    message: 'Unit must be one of: kg, g, liter, ml, piece, packet, dozen, box',
  })
);

export const createItemSchema = z.object({
  body: z.object({
    itemTypeId: idSchema('item type ID'),
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
    id: idSchema('item ID'),
  }),
  body: createItemSchema.shape.body.partial(),
});

export const createItemRecipeSchema = z.object({
  params: z.object({
    id: idSchema('item ID'),
  }),
  body: z.object({
    ingredientId: idSchema('ingredient ID'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unit: measureUnitSchema,
  }),
});

export const updateItemRecipeSchema = z.object({
  params: z.object({
    id: idSchema('item ID'),
    recipeId: idSchema('recipe ID'),
  }),
  body: z
    .object({
      ingredientId: idSchema('ingredient ID').optional(),
      quantity: z.number().positive('Quantity must be greater than 0').optional(),
      unit: measureUnitSchema.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    }),
});

export const createItemVendorSupplySchema = z.object({
  params: z.object({
    id: idSchema('item ID'),
  }),
  body: z.object({
    vendorId: idSchema('vendor ID'),
    price: z.number().nonnegative('Price must be 0 or greater'),
    unit: measureUnitSchema,
  }),
});

export const updateItemVendorSupplySchema = z.object({
  params: z.object({
    id: idSchema('item ID'),
    supplyId: idSchema('item supplier mapping ID'),
  }),
  body: z
    .object({
      vendorId: idSchema('vendor ID').optional(),
      price: z.number().nonnegative('Price must be 0 or greater').optional(),
      unit: measureUnitSchema.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    }),
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
    const { page, limit, skip } = parsePagination(
      req.query.page,
      req.query.limit,
      20,
      200
    );
    const search = sanitizeSearchTerm(req.query.search);
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          itemType: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              itemRecipes: true,
              vendorSupplies: true,
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
        itemRecipes: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                defaultUnit: true,
              },
            },
          },
          orderBy: {
            ingredient: {
              name: 'asc',
            },
          },
        },
        vendorSupplies: {
          where: {
            productType: 'item',
          },
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
            priceHistory: {
              orderBy: { changedAt: 'desc' },
              take: 20,
            },
          },
          orderBy: {
            vendor: {
              name: 'asc',
            },
          },
        },
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

export async function getItemRecipes(req: Request, res: Response): Promise<void> {
  try {
    const { id: itemId } = req.params;

    const itemExists = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true } });
    if (!itemExists) {
      sendNotFound(res, 'Item not found');
      return;
    }

    const recipes = await prisma.itemRecipe.findMany({
      where: { itemId },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            defaultUnit: true,
          },
        },
      },
      orderBy: {
        ingredient: {
          name: 'asc',
        },
      },
    });

    sendSuccess(res, { recipes });
  } catch (error) {
    sendError(res, 'Failed to fetch item recipe');
  }
}

export async function createItemRecipe(req: Request, res: Response): Promise<void> {
  try {
    const { id: itemId } = req.params;
    const { ingredientId, quantity, unit } = req.body;
    const normalizedUnit = normalizeQuantityUnit(unit);
    if (!normalizedUnit) {
      sendError(res, 'Invalid unit selected', 400);
      return;
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { id: true, defaultUnit: true },
    });
    if (!ingredient) {
      sendError(res, 'Invalid ingredient selected', 400);
      return;
    }

    if (!areUnitsCompatible(normalizedUnit, ingredient.defaultUnit)) {
      sendError(
        res,
        `Recipe unit (${normalizedUnit}) is not compatible with ingredient default unit (${ingredient.defaultUnit})`,
        400
      );
      return;
    }

    const recipe = await prisma.itemRecipe.create({
      data: {
        itemId,
        ingredientId,
        quantity,
        unit: normalizedUnit,
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            defaultUnit: true,
          },
        },
      },
    });

    sendSuccess(res, { recipe }, 'Recipe ingredient added successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'Ingredient is already mapped for this item', 409);
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid ingredient selected', 400);
      return;
    }
    sendError(res, 'Failed to add recipe ingredient');
  }
}

export async function updateItemRecipe(req: Request, res: Response): Promise<void> {
  try {
    const { id: itemId, recipeId } = req.params;
    const { ingredientId, quantity, unit } = req.body;

    const existing = await prisma.itemRecipe.findFirst({
      where: {
        id: recipeId,
        itemId,
      },
      select: { id: true },
    });

    if (!existing) {
      sendNotFound(res, 'Recipe entry not found');
      return;
    }

    const targetIngredientId = ingredientId || (await prisma.itemRecipe.findUnique({
      where: { id: recipeId },
      select: { ingredientId: true },
    }))?.ingredientId;

    if (!targetIngredientId) {
      sendError(res, 'Invalid ingredient selected', 400);
      return;
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: targetIngredientId },
      select: { defaultUnit: true },
    });

    if (!ingredient) {
      sendError(res, 'Invalid ingredient selected', 400);
      return;
    }

    const normalizedUnit = unit !== undefined ? normalizeQuantityUnit(unit) : null;
    const effectiveUnit = normalizedUnit || undefined;
    const unitToValidate = effectiveUnit || ingredient.defaultUnit;
    if (!areUnitsCompatible(unitToValidate, ingredient.defaultUnit)) {
      sendError(
        res,
        `Recipe unit (${unitToValidate}) is not compatible with ingredient default unit (${ingredient.defaultUnit})`,
        400
      );
      return;
    }

    const recipe = await prisma.itemRecipe.update({
      where: { id: recipeId },
      data: {
        ingredientId,
        quantity,
        unit: effectiveUnit,
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            defaultUnit: true,
          },
        },
      },
    });

    sendSuccess(res, { recipe }, 'Recipe entry updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'Ingredient is already mapped for this item', 409);
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid ingredient selected', 400);
      return;
    }
    sendError(res, 'Failed to update recipe entry');
  }
}

export async function deleteItemRecipe(req: Request, res: Response): Promise<void> {
  try {
    const { id: itemId, recipeId } = req.params;

    const existing = await prisma.itemRecipe.findFirst({
      where: {
        id: recipeId,
        itemId,
      },
      select: { id: true },
    });

    if (!existing) {
      sendNotFound(res, 'Recipe entry not found');
      return;
    }

    await prisma.itemRecipe.delete({ where: { id: recipeId } });
    sendSuccess(res, null, 'Recipe entry deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete recipe entry');
  }
}

export async function getItemVendorSupplies(req: Request, res: Response): Promise<void> {
  try {
    const { id: itemId } = req.params;

    const itemExists = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true } });
    if (!itemExists) {
      sendNotFound(res, 'Item not found');
      return;
    }

    const supplies = await prisma.vendorSupply.findMany({
      where: {
        itemId,
        productType: 'item',
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 20,
        },
      },
      orderBy: {
        vendor: {
          name: 'asc',
        },
      },
    });

    sendSuccess(res, { supplies });
  } catch (error) {
    sendError(res, 'Failed to fetch item suppliers');
  }
}

export async function createItemVendorSupply(req: Request, res: Response): Promise<void> {
  try {
    const { id: itemId } = req.params;
    const { vendorId, price, unit } = req.body;
    const normalizedUnit = normalizeQuantityUnit(unit);
    if (!normalizedUnit) {
      sendError(res, 'Invalid unit selected', 400);
      return;
    }

    const supply = await prisma.$transaction(async (tx) => {
      const created = await tx.vendorSupply.create({
        data: {
          vendorId,
          productType: 'item',
          ingredientId: null,
          itemId,
          price,
          unit: normalizedUnit,
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.vendorSupplyPriceHistory.create({
        data: {
          vendorSupplyId: created.id,
          previousPrice: null,
          newPrice: Number(price),
          changedBy: (req as any).user?.userId || null,
        },
      });

      return created;
    });

    sendSuccess(res, { supply }, 'Item supplier added successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'This vendor+unit is already linked to the item', 409);
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid vendor selected', 400);
      return;
    }
    sendError(res, 'Failed to add item supplier');
  }
}

export async function updateItemVendorSupply(req: Request, res: Response): Promise<void> {
  try {
    const { id: itemId, supplyId } = req.params;
    const { vendorId, price, unit } = req.body;

    const existing = await prisma.vendorSupply.findFirst({
      where: {
        id: supplyId,
        itemId,
        productType: 'item',
      },
      select: { id: true, price: true },
    });

    if (!existing) {
      sendNotFound(res, 'Item supplier mapping not found');
      return;
    }

    const normalizedUnit = unit !== undefined ? normalizeQuantityUnit(unit) : null;
    if (unit !== undefined && !normalizedUnit) {
      sendError(res, 'Invalid unit selected', 400);
      return;
    }

    const supply = await prisma.$transaction(async (tx) => {
      const updated = await tx.vendorSupply.update({
        where: { id: supplyId },
        data: {
          vendorId,
          price,
          unit: normalizedUnit || undefined,
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (price !== undefined && Number(price) !== Number(existing.price)) {
        await tx.vendorSupplyPriceHistory.create({
          data: {
            vendorSupplyId: updated.id,
            previousPrice: Number(existing.price),
            newPrice: Number(price),
            changedBy: (req as any).user?.userId || null,
          },
        });
      }

      return updated;
    });

    sendSuccess(res, { supply }, 'Item supplier mapping updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'This vendor+unit is already linked to the item', 409);
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid vendor selected', 400);
      return;
    }
    sendError(res, 'Failed to update item supplier mapping');
  }
}

export async function deleteItemVendorSupply(req: Request, res: Response): Promise<void> {
  try {
    const { id: itemId, supplyId } = req.params;

    const existing = await prisma.vendorSupply.findFirst({
      where: {
        id: supplyId,
        itemId,
        productType: 'item',
      },
      select: { id: true },
    });

    if (!existing) {
      sendNotFound(res, 'Item supplier mapping not found');
      return;
    }

    await prisma.vendorSupply.delete({ where: { id: supplyId } });
    sendSuccess(res, null, 'Item supplier mapping deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete item supplier mapping');
  }
}
