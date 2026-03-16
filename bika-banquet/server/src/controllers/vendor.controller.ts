import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import { normalizeCaseFields } from '../utils/textCase';
import { idSchema } from '../utils/validation';
import { QUANTITY_UNITS, normalizeQuantityUnit } from '../config/units';
import { sanitizeSearchTerm } from '../utils/search';
import { parsePagination } from '../utils/pagination';

const measureUnitSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.enum(QUANTITY_UNITS, {
    message: 'Unit must be one of: kg, g, liter, ml, piece, packet, dozen, box',
  })
);

const vendorSupplyInputSchema = z
  .object({
    productType: z.enum(['ingredient', 'item']),
    ingredientId: idSchema('ingredient ID').optional(),
    itemId: idSchema('item ID').optional(),
    price: z.number().nonnegative('Price must be 0 or greater'),
    unit: measureUnitSchema,
  })
  .superRefine((value, ctx) => {
    if (value.productType === 'ingredient') {
      if (!value.ingredientId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ingredientId'],
          message: 'Ingredient is required when product type is ingredient',
        });
      }
      if (value.itemId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['itemId'],
          message: 'Item must be empty when product type is ingredient',
        });
      }
      return;
    }

    if (!value.itemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['itemId'],
        message: 'Item is required when product type is item',
      });
    }
    if (value.ingredientId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ingredientId'],
        message: 'Ingredient must be empty when product type is item',
      });
    }
  });

export const createVendorSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Vendor name is required'),
    contactPerson: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(20).optional(),
    email: z.string().trim().email().optional(),
    address: z.string().trim().max(300).optional(),
    gstNumber: z.string().trim().max(30).optional(),
    supplies: z.array(vendorSupplyInputSchema).optional(),
  }),
});

export const updateVendorSchema = z.object({
  params: z.object({
    id: idSchema('vendor ID'),
  }),
  body: createVendorSchema.shape.body.partial(),
});

export const addVendorSupplySchema = z.object({
  params: z.object({
    id: idSchema('vendor ID'),
  }),
  body: vendorSupplyInputSchema,
});

export const updateVendorSupplySchema = z.object({
  params: z.object({
    id: idSchema('vendor ID'),
    supplyId: idSchema('supplier mapping ID'),
  }),
  body: z
    .object({
      productType: z.enum(['ingredient', 'item']).optional(),
      ingredientId: idSchema('ingredient ID').optional(),
      itemId: idSchema('item ID').optional(),
      price: z.number().nonnegative('Price must be 0 or greater').optional(),
      unit: measureUnitSchema.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    })
    .superRefine((value, ctx) => {
      if (value.productType === 'ingredient') {
        if (value.itemId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['itemId'],
            message: 'Item must be empty when product type is ingredient',
          });
        }
        return;
      }
      if (value.productType === 'item') {
        if (value.ingredientId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['ingredientId'],
            message: 'Ingredient must be empty when product type is item',
          });
        }
        return;
      }

      if (value.ingredientId && value.itemId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ingredientId'],
          message:
            'Provide either ingredientId or itemId unless productType is explicitly set',
        });
      }
    }),
});

function normalizeSupplyInput(input: {
  productType?: 'ingredient' | 'item';
  ingredientId?: string;
  itemId?: string;
}) {
  const productType = input.productType;

  if (productType === 'ingredient') {
    return {
      productType,
      ingredientId: input.ingredientId,
      itemId: null,
    };
  }

  if (productType === 'item') {
    return {
      productType,
      ingredientId: null,
      itemId: input.itemId,
    };
  }

  return {
    productType,
    ingredientId: input.ingredientId,
    itemId: input.itemId,
  };
}

function validateSupplyInput(
  body: { productType: 'ingredient' | 'item'; ingredientId?: string; itemId?: string },
  res: Response
): boolean {
  if (body.productType === 'ingredient' && !body.ingredientId) {
    sendError(res, 'Ingredient is required for ingredient supplies', 400);
    return false;
  }

  if (body.productType === 'item' && !body.itemId) {
    sendError(res, 'Item is required for item supplies', 400);
    return false;
  }

  if (body.productType === 'ingredient' && body.itemId) {
    sendError(res, 'Item must be empty when product type is ingredient', 400);
    return false;
  }

  if (body.productType === 'item' && body.ingredientId) {
    sendError(res, 'Ingredient must be empty when product type is item', 400);
    return false;
  }

  return true;
}

export async function createVendor(req: Request, res: Response): Promise<void> {
  try {
    const payload = normalizeCaseFields({ ...req.body }, [
      'name',
      'contactPerson',
      'address',
    ]);
    const supplyRows = Array.isArray(payload.supplies) ? payload.supplies : [];
    delete payload.supplies;

    const vendor = await prisma.$transaction(async (tx) => {
      const created = await tx.vendor.create({
        data: payload,
      });

      if (supplyRows.length > 0) {
        for (const row of supplyRows) {
          if (
            !validateSupplyInput(
              {
                productType: row.productType,
                ingredientId: row.ingredientId,
                itemId: row.itemId,
              },
              res
            )
          ) {
            throw new Error('INVALID_SUPPLY_INPUT');
          }

          const normalizedUnit = normalizeQuantityUnit(row.unit);
          if (!normalizedUnit) {
            throw new Error('INVALID_UNIT');
          }

          const normalized = normalizeSupplyInput({
            productType: row.productType,
            ingredientId: row.ingredientId,
            itemId: row.itemId,
          });

          const createdSupply = await tx.vendorSupply.create({
            data: {
              vendorId: created.id,
              productType: normalized.productType!,
              ingredientId: normalized.ingredientId,
              itemId: normalized.itemId,
              price: row.price,
              unit: normalizedUnit,
            },
          });

          await tx.vendorSupplyPriceHistory.create({
            data: {
              vendorSupplyId: createdSupply.id,
              previousPrice: null,
              newPrice: Number(row.price),
              changedBy: (req as any).user?.userId || null,
            },
          });
        }
      }

      return created;
    });

    sendSuccess(res, { vendor }, 'Vendor created successfully', 201);
  } catch (error: any) {
    if (error instanceof Error && error.message === 'INVALID_SUPPLY_INPUT') {
      return;
    }
    if (error instanceof Error && error.message === 'INVALID_UNIT') {
      sendError(res, 'Invalid unit selected', 400);
      return;
    }
    if (error?.code === 'P2002') {
      sendError(
        res,
        'Vendor name already exists or duplicate supply+unit mapping provided',
        409
      );
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid ingredient or item selected in supplied list', 400);
      return;
    }
    sendError(res, 'Failed to create vendor');
  }
}

export async function getVendors(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(
      req.query.page,
      req.query.limit,
      50,
      200
    );
    const search = sanitizeSearchTerm(req.query.search);

    const where = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : undefined;

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          supplies: {
            select: {
              id: true,
              productType: true,
            },
          },
          _count: {
            select: {
              supplies: true,
            },
          },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    sendSuccess(res, {
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch vendors');
  }
}

export async function getVendorById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        supplies: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                defaultUnit: true,
              },
            },
            item: {
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
          orderBy: [{ productType: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!vendor) {
      sendNotFound(res, 'Vendor not found');
      return;
    }

    sendSuccess(res, { vendor });
  } catch (error) {
    sendError(res, 'Failed to fetch vendor');
  }
}

export async function updateVendor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const payload = normalizeCaseFields({ ...req.body }, [
      'name',
      'contactPerson',
      'address',
    ]);

    const vendor = await prisma.vendor.update({
      where: { id },
      data: payload,
    });

    sendSuccess(res, { vendor }, 'Vendor updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Vendor not found');
      return;
    }
    if (error?.code === 'P2002') {
      sendError(res, 'Vendor name already exists', 409);
      return;
    }
    sendError(res, 'Failed to update vendor');
  }
}

export async function deleteVendor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.vendor.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Vendor deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Vendor not found');
      return;
    }
    sendError(res, 'Failed to delete vendor');
  }
}

export async function addVendorSupply(req: Request, res: Response): Promise<void> {
  try {
    const { id: vendorId } = req.params;
    const { productType, ingredientId, itemId, price, unit } = req.body;

    if (!validateSupplyInput({ productType, ingredientId, itemId }, res)) {
      return;
    }

    const normalizedUnit = normalizeQuantityUnit(unit);
    if (!normalizedUnit) {
      sendError(res, 'Invalid unit selected', 400);
      return;
    }

    const normalized = normalizeSupplyInput({ productType, ingredientId, itemId });

    const supply = await prisma.$transaction(async (tx) => {
      const created = await tx.vendorSupply.create({
        data: {
          vendorId,
          productType: normalized.productType!,
          ingredientId: normalized.ingredientId,
          itemId: normalized.itemId,
          price,
          unit: normalizedUnit,
        },
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
            },
          },
          item: {
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

    sendSuccess(res, { supply }, 'Supply added successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'This vendor supply mapping with selected unit already exists', 409);
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid ingredient or item selected', 400);
      return;
    }
    sendError(res, 'Failed to add vendor supply');
  }
}

export async function updateVendorSupply(req: Request, res: Response): Promise<void> {
  try {
    const { id: vendorId, supplyId } = req.params;
    const { productType, ingredientId, itemId, price, unit } = req.body;

    const existing = await prisma.vendorSupply.findFirst({
      where: {
        id: supplyId,
        vendorId,
      },
      select: {
        id: true,
        productType: true,
        ingredientId: true,
        itemId: true,
        price: true,
      },
    });

    if (!existing) {
      sendNotFound(res, 'Vendor supply mapping not found');
      return;
    }

    const effectiveProductType = productType || existing.productType;
    const effectiveIngredientId =
      ingredientId !== undefined ? ingredientId : existing.ingredientId || undefined;
    const effectiveItemId = itemId !== undefined ? itemId : existing.itemId || undefined;

    if (
      !validateSupplyInput(
        {
          productType: effectiveProductType,
          ingredientId: effectiveIngredientId,
          itemId: effectiveItemId,
        },
        res
      )
    ) {
      return;
    }

    const normalized = normalizeSupplyInput({
      productType: effectiveProductType,
      ingredientId: effectiveIngredientId,
      itemId: effectiveItemId,
    });

    const normalizedUnit = unit !== undefined ? normalizeQuantityUnit(unit) : null;
    if (unit !== undefined && !normalizedUnit) {
      sendError(res, 'Invalid unit selected', 400);
      return;
    }

    const supply = await prisma.$transaction(async (tx) => {
      const updated = await tx.vendorSupply.update({
        where: { id: supplyId },
        data: {
          productType: normalized.productType,
          ingredientId: normalized.ingredientId,
          itemId: normalized.itemId,
          price,
          unit: normalizedUnit || undefined,
        },
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
            },
          },
          item: {
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

    sendSuccess(res, { supply }, 'Vendor supply updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'This vendor supply mapping with selected unit already exists', 409);
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid ingredient or item selected', 400);
      return;
    }
    sendError(res, 'Failed to update vendor supply');
  }
}

export async function deleteVendorSupply(req: Request, res: Response): Promise<void> {
  try {
    const { id: vendorId, supplyId } = req.params;

    const existing = await prisma.vendorSupply.findFirst({
      where: {
        id: supplyId,
        vendorId,
      },
      select: { id: true },
    });

    if (!existing) {
      sendNotFound(res, 'Vendor supply mapping not found');
      return;
    }

    await prisma.vendorSupply.delete({
      where: { id: supplyId },
    });

    sendSuccess(res, null, 'Vendor supply deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete vendor supply');
  }
}
