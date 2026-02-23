import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import { normalizeCaseFields } from '../utils/textCase';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Role name is required'),
    description: z.string().optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid role ID'),
  }),
  body: createRoleSchema.shape.body.partial(),
});

export async function createRole(req: Request, res: Response): Promise<void> {
  try {
    const payload = normalizeCaseFields({ ...req.body }, ['name']);
    const role = await prisma.role.create({
      data: payload,
    });
    sendSuccess(res, { role }, 'Role created successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'Role name already exists', 409);
      return;
    }
    sendError(res, 'Failed to create role');
  }
}

export async function getRoles(req: Request, res: Response): Promise<void> {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });
    sendSuccess(res, { roles });
  } catch (error) {
    sendError(res, 'Failed to fetch roles');
  }
}

export async function getRoleById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    if (!role) {
      sendNotFound(res, 'Role not found');
      return;
    }
    sendSuccess(res, { role });
  } catch (error) {
    sendError(res, 'Failed to fetch role');
  }
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const payload = normalizeCaseFields({ ...req.body }, ['name']);
    const role = await prisma.role.update({
      where: { id },
      data: payload,
    });
    sendSuccess(res, { role }, 'Role updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Role not found');
      return;
    }
    if (error?.code === 'P2002') {
      sendError(res, 'Role name already exists', 409);
      return;
    }
    sendError(res, 'Failed to update role');
  }
}

export async function deleteRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.role.delete({
      where: { id },
    });
    sendSuccess(res, null, 'Role deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Role not found');
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Cannot delete role assigned to users', 409);
      return;
    }
    sendError(res, 'Failed to delete role');
  }
}
