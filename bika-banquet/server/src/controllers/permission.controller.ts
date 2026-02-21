import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';

export const createPermissionSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Permission name is required'),
    description: z.string().optional(),
  }),
});

export const updatePermissionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid permission ID'),
  }),
  body: createPermissionSchema.shape.body.partial(),
});

export async function createPermission(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const permission = await prisma.permission.create({
      data: req.body,
    });
    sendSuccess(res, { permission }, 'Permission created successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'Permission already exists', 409);
      return;
    }
    sendError(res, 'Failed to create permission');
  }
}

export async function getPermissions(req: Request, res: Response): Promise<void> {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            roles: true,
          },
        },
      },
    });
    sendSuccess(res, { permissions });
  } catch (error) {
    sendError(res, 'Failed to fetch permissions');
  }
}

export async function getPermissionById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const permission = await prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      sendNotFound(res, 'Permission not found');
      return;
    }
    sendSuccess(res, { permission });
  } catch (error) {
    sendError(res, 'Failed to fetch permission');
  }
}

export async function updatePermission(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const permission = await prisma.permission.update({
      where: { id },
      data: req.body,
    });
    sendSuccess(res, { permission }, 'Permission updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Permission not found');
      return;
    }
    if (error?.code === 'P2002') {
      sendError(res, 'Permission already exists', 409);
      return;
    }
    sendError(res, 'Failed to update permission');
  }
}

export async function deletePermission(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.permission.delete({
      where: { id },
    });
    sendSuccess(res, null, 'Permission deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Permission not found');
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Cannot delete permission linked to roles', 409);
      return;
    }
    sendError(res, 'Failed to delete permission');
  }
}
