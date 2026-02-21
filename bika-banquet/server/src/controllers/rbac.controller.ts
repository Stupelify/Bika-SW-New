import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendSuccess } from '../utils/response';

const userRoleSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
  }),
});

const updateRolesSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    roleIds: z.array(z.string().uuid()),
  }),
});

const rolePermissionSchema = z.object({
  body: z.object({
    roleId: z.string().uuid(),
    permissionId: z.string().uuid(),
  }),
});

const updatePermissionsSchema = z.object({
  body: z.object({
    roleId: z.string().uuid(),
    permissionIds: z.array(z.string().uuid()),
  }),
});

export const assignRoleSchema = userRoleSchema;
export const removeRoleSchema = userRoleSchema;
export const updateUserRolesSchema = updateRolesSchema;
export const assignPermissionSchema = rolePermissionSchema;
export const removePermissionSchema = rolePermissionSchema;
export const updateRolePermissionsSchema = updatePermissionsSchema;

export async function assignRole(req: Request, res: Response): Promise<void> {
  try {
    const { userId, roleId } = req.body;
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {},
      create: {
        userId,
        roleId,
      },
    });
    sendSuccess(res, null, 'Role assigned successfully');
  } catch (error) {
    sendError(res, 'Failed to assign role');
  }
}

export async function removeRole(req: Request, res: Response): Promise<void> {
  try {
    const { userId, roleId } = req.body;
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
    sendSuccess(res, null, 'Role removed successfully');
  } catch (error) {
    sendError(res, 'Failed to remove role');
  }
}

export async function updateUserRoles(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { userId, roleIds } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId },
      });
      if (Array.isArray(roleIds) && roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId: string) => ({
            userId,
            roleId,
          })),
        });
      }
    });

    sendSuccess(res, null, 'User roles updated successfully');
  } catch (error) {
    sendError(res, 'Failed to update user roles');
  }
}

export async function assignPermission(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { roleId, permissionId } = req.body;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId,
      },
    });
    sendSuccess(res, null, 'Permission assigned successfully');
  } catch (error) {
    sendError(res, 'Failed to assign permission');
  }
}

export async function removePermission(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { roleId, permissionId } = req.body;
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
    sendSuccess(res, null, 'Permission removed successfully');
  } catch (error) {
    sendError(res, 'Failed to remove permission');
  }
}

export async function updateRolePermissions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { roleId, permissionIds } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });
      if (Array.isArray(permissionIds) && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });

    sendSuccess(res, null, 'Role permissions updated successfully');
  } catch (error) {
    sendError(res, 'Failed to update role permissions');
  }
}

export async function listUserPermissions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((userRole) =>
          userRole.role.permissions.map((rp) => rp.permission.name)
        )
      )
    );

    sendSuccess(res, { permissions });
  } catch (error) {
    sendError(res, 'Failed to fetch user permissions');
  }
}
