import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import { normalizeCaseFields } from '../utils/textCase';
import { idSchema } from '../utils/validation';
import { QUANTITY_UNITS, normalizeQuantityUnit } from '../config/units';

const measureUnitSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.enum(QUANTITY_UNITS, {
    message: 'Unit must be one of: kg, g, liter, ml, piece, packet, dozen, box',
  })
);

export const createIngredientSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Ingredient name is required'),
    defaultUnit: measureUnitSchema,
    suppliers: z
      .array(
        z.object({
          vendorId: idSchema('vendor ID'),
          price: z.number().nonnegative('Price must be 0 or greater'),
          unit: measureUnitSchema,
        })
      )
      .optional(),
  }),
});

export const updateIngredientSchema = z.object({
  params: z.object({
    id: idSchema('ingredient ID'),
  }),
  body: createIngredientSchema.shape.body.partial(),
});

export const addIngredientSupplierSchema = z.object({
  params: z.object({
    id: idSchema('ingredient ID'),
  }),
  body: z.object({
    vendorId: idSchema('vendor ID'),
    price: z.number().nonnegative('Price must be 0 or greater'),
    unit: measureUnitSchema,
  }),
});

export const updateIngredientSupplierSchema = z.object({
  params: z.object({
    id: idSchema('ingredient ID'),
    supplyId: idSchema('supplier mapping ID'),
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

export async function createIngredient(req: Request, res: Response): Promise<void> {
  try {
    const payload = normalizeCaseFields(
      {
        ...req.body,
        defaultUnit: normalizeQuantityUnit(req.body.defaultUnit),
      },
      ['name']
    );
    const supplierRows = Array.isArray(payload.suppliers) ? payload.suppliers : [];
    delete payload.suppliers;

    const ingredient = await prisma.$transaction(async (tx) => {
      const created = await tx.ingredient.create({
        data: payload,
      });

      if (supplierRows.length > 0) {
        for (const supplier of supplierRows) {
          const normalizedUnit = normalizeQuantityUnit(supplier.unit);
          if (!normalizedUnit) {
            throw new Error('Invalid unit selected');
          }

          const createdSupply = await tx.vendorSupply.create({
            data: {
              vendorId: supplier.vendorId,
              productType: 'ingredient',
              ingredientId: created.id,
              itemId: null,
              price: supplier.price,
              unit: normalizedUnit,
            },
          });

          await tx.vendorSupplyPriceHistory.create({
            data: {
              vendorSupplyId: createdSupply.id,
              previousPrice: null,
              newPrice: Number(supplier.price),
              changedBy: (req as any).user?.userId || null,
            },
          });
        }
      }

      return created;
    });

    sendSuccess(res, { ingredient }, 'Ingredient created successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(
        res,
        'Ingredient already exists or duplicate supplier+unit mapping was provided',
        409
      );
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid vendor selected while linking suppliers', 400);
      return;
    }
    if (error instanceof Error && error.message === 'Invalid unit selected') {
      sendError(res, 'Invalid unit selected', 400);
      return;
    }
    sendError(res, 'Failed to create ingredient');
  }
}

export async function getIngredients(req: Request, res: Response): Promise<void> {
  try {
    const page = Number.parseInt(req.query.page as string, 10) || 1;
    const limit = Number.parseInt(req.query.limit as string, 10) || 50;
    const search = String(req.query.search || '').trim();

    const where = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : undefined;

    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              itemRecipes: true,
              vendorSupplies: true,
            },
          },
        },
      }),
      prisma.ingredient.count({ where }),
    ]);

    sendSuccess(res, {
      ingredients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch ingredients');
  }
}

export async function getIngredientById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        itemRecipes: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            item: {
              name: 'asc',
            },
          },
        },
        vendorSupplies: {
          where: { productType: 'ingredient' },
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

    if (!ingredient) {
      sendNotFound(res, 'Ingredient not found');
      return;
    }

    sendSuccess(res, { ingredient });
  } catch (error) {
    sendError(res, 'Failed to fetch ingredient');
  }
}

export async function updateIngredient(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    if (body.defaultUnit !== undefined) {
      body.defaultUnit = normalizeQuantityUnit(body.defaultUnit);
    }

    const payload = normalizeCaseFields(body, ['name']);

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: payload,
    });

    sendSuccess(res, { ingredient }, 'Ingredient updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Ingredient not found');
      return;
    }
    if (error?.code === 'P2002') {
      sendError(res, 'Ingredient name already exists', 409);
      return;
    }
    sendError(res, 'Failed to update ingredient');
  }
}

export async function deleteIngredient(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.ingredient.delete({ where: { id } });

    sendSuccess(res, null, 'Ingredient deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Ingredient not found');
      return;
    }
    sendError(res, 'Failed to delete ingredient');
  }
}

export async function addIngredientSupplier(req: Request, res: Response): Promise<void> {
  try {
    const { id: ingredientId } = req.params;
    const { vendorId, price, unit } = req.body;

    const ingredientExists = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { id: true },
    });

    if (!ingredientExists) {
      sendNotFound(res, 'Ingredient not found');
      return;
    }

    const normalizedUnit = normalizeQuantityUnit(unit);
    if (!normalizedUnit) {
      sendError(res, 'Invalid unit selected', 400);
      return;
    }

    const supply = await prisma.$transaction(async (tx) => {
      const created = await tx.vendorSupply.create({
        data: {
          vendorId,
          productType: 'ingredient',
          ingredientId,
          itemId: null,
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

    sendSuccess(res, { supply }, 'Supplier added successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'This vendor+unit is already linked to the ingredient', 409);
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid vendor selected', 400);
      return;
    }
    sendError(res, 'Failed to add supplier');
  }
}

export async function updateIngredientSupplier(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id: ingredientId, supplyId } = req.params;
    const { vendorId, price, unit } = req.body;

    const existing = await prisma.vendorSupply.findFirst({
      where: {
        id: supplyId,
        ingredientId,
        productType: 'ingredient',
      },
      select: { id: true, price: true },
    });

    if (!existing) {
      sendNotFound(res, 'Supplier mapping not found');
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

    sendSuccess(res, { supply }, 'Supplier mapping updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'This vendor+unit is already linked to the ingredient', 409);
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid vendor selected', 400);
      return;
    }
    sendError(res, 'Failed to update supplier mapping');
  }
}

export async function deleteIngredientSupplier(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id: ingredientId, supplyId } = req.params;

    const existing = await prisma.vendorSupply.findFirst({
      where: {
        id: supplyId,
        ingredientId,
        productType: 'ingredient',
      },
      select: { id: true },
    });

    if (!existing) {
      sendNotFound(res, 'Supplier mapping not found');
      return;
    }

    await prisma.vendorSupply.delete({ where: { id: supplyId } });

    sendSuccess(res, null, 'Supplier mapping deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete supplier mapping');
  }
}
