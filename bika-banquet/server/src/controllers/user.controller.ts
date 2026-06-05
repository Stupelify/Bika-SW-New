import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendForbidden, sendNotFound, sendSuccess } from '../utils/response';
import { hashPassword } from '../utils/auth';
import { toEntryCase } from '../utils/textCase';
import { sanitizeSearchTerm } from '../utils/search';
import { parsePagination } from '../utils/pagination';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/auditLog';
import { passwordSchema } from '../utils/passwordPolicy';
import { revokeUserSessions } from '../utils/sessions';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
    roleId: z.string().uuid().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid user ID') }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
  }),
});

export const resetUserPasswordSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    newPassword: passwordSchema,
  }),
});

export const setUserStatusSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid user ID') }),
  body: z.object({
    isActive: z.boolean(),
    reason: z.string().max(500).optional(),
  }),
});

export const setUserAllVenuesSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid user ID') }),
  body: z.object({ hasAllVenueAccess: z.boolean() }),
});

export const setUserDirectPermissionsSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid user ID') }),
  body: z.object({ permissionIds: z.array(z.string().uuid()) }),
});

/**
 * True if `userId` is an Admin and there is no OTHER active Admin — i.e.
 * removing or disabling them would leave the system with no active admin.
 */
async function isLastActiveAdmin(userId: string): Promise<boolean> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { userRoles: { select: { role: { select: { name: true } } } } },
  });
  const targetIsAdmin = !!target?.userRoles.some(
    (ur) => ur.role.name.toLowerCase() === 'admin'
  );
  if (!targetIsAdmin) return false;

  const otherActiveAdmins = await prisma.user.count({
    where: {
      id: { not: userId },
      isActive: true,
      userRoles: {
        some: { role: { name: { equals: 'Admin', mode: 'insensitive' } } },
      },
    },
  });
  return otherActiveAdmins === 0;
}

export async function getUsersSimple(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, { users });
  } catch (error) {
    sendError(res, 'Failed to fetch users');
  }
}

export async function getUsers(req: Request, res: Response): Promise<void> {
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
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
          isActive: true,
          hasAllVenueAccess: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch users');
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        isActive: true,
        disabledAt: true,
        disabledReason: true,
        hasAllVenueAccess: true,
        lastLoginAt: true,
        createdAt: true,
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
      sendNotFound(res, 'User not found');
      return;
    }

    sendSuccess(res, { user });
  } catch (error) {
    sendError(res, 'Failed to fetch user');
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, roleId } = req.body;
    const normalizedName = toEntryCase(name);
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      sendError(res, 'User already exists', 409);
      return;
    }

    const resolvedRoleId = roleId
      ? roleId
      : (
          await prisma.role.findFirst({
            where: { name: { not: 'Admin' } },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          })
        )?.id;

    const hashedPassword = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          isVerified: true,
          passwordChangedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
          createdAt: true,
        },
      });

      if (resolvedRoleId) {
        await tx.userRole.create({
          data: {
            userId: createdUser.id,
            roleId: resolvedRoleId,
          },
        });
      }

      return createdUser;
    });

    void createAuditLog(req, 'CREATE', 'user', user.id, user.email);
    sendSuccess(res, { user }, 'User created successfully', 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      sendError(res, 'User already exists', 409);
      return;
    }
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid role selected', 400);
      return;
    }
    sendError(res, 'Failed to create user');
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data: { name?: string; email?: string } = {};
    if (typeof req.body.name === 'string') data.name = toEntryCase(req.body.name);
    if (typeof req.body.email === 'string') {
      data.email = req.body.email.trim().toLowerCase();
    }

    if (Object.keys(data).length === 0) {
      sendError(res, 'Nothing to update', 400);
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    });

    void createAuditLog(req, 'UPDATE', 'user', id, user.email, data);
    sendSuccess(res, { user }, 'User updated successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'User not found');
      return;
    }
    if (error?.code === 'P2002') {
      sendError(res, 'Email already in use', 409);
      return;
    }
    sendError(res, 'Failed to update user');
  }
}

export async function setUserStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body as { isActive: boolean; reason?: string };

    if (!isActive) {
      // Disabling: protect the requester's own account and the last active admin.
      if (req.user?.userId === id) {
        sendError(res, 'You cannot disable your own account.', 400);
        return;
      }
      if (await isLastActiveAdmin(id)) {
        sendError(res, 'Cannot disable the last active admin.', 400);
        return;
      }
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!existing) {
      sendNotFound(res, 'User not found');
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive,
        disabledAt: isActive ? null : new Date(),
        disabledReason: isActive ? null : reason ?? null,
      },
      select: { id: true, name: true, email: true, isActive: true, disabledAt: true },
    });

    if (!isActive) {
      // Immediately end all of the disabled user's sessions.
      await revokeUserSessions(id);
    }

    void createAuditLog(
      req,
      isActive ? 'ENABLE' : 'DISABLE',
      'user',
      id,
      existing.email,
      reason ? { reason } : undefined
    );
    sendSuccess(res, { user }, isActive ? 'User enabled' : 'User disabled');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'User not found');
      return;
    }
    sendError(res, 'Failed to update user status');
  }
}

export async function setUserAllVenues(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { hasAllVenueAccess } = req.body as { hasAllVenueAccess: boolean };

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!existing) {
      sendNotFound(res, 'User not found');
      return;
    }

    await prisma.user.update({ where: { id }, data: { hasAllVenueAccess } });
    void createAuditLog(
      req,
      'UPDATE_ALL_VENUE_ACCESS',
      'user',
      id,
      existing.email,
      { hasAllVenueAccess }
    );
    sendSuccess(res, { hasAllVenueAccess }, 'Venue access updated');
  } catch (error) {
    sendError(res, 'Failed to update venue access');
  }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Prevent an admin from deleting their own account.
    if (req.user?.userId === id) {
      sendError(res, 'You cannot delete your own account.', 400);
      return;
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!target) {
      sendNotFound(res, 'User not found');
      return;
    }

    // Refuse hard-delete when the user has operational history; that data
    // references the user and must be preserved. Disable the account instead.
    const [payments, finalizedBookings, finalizedQuotations] = await Promise.all([
      prisma.bookingPayments.count({ where: { receivedBy: id } }),
      prisma.finalizedBooking.count({ where: { finalizedBy: id } }),
      prisma.finalizedQuotation.count({ where: { finalizedBy: id } }),
    ]);
    if (payments + finalizedBookings + finalizedQuotations > 0) {
      sendError(
        res,
        'This user has financial/booking history and cannot be deleted. Disable the account instead.',
        409
      );
      return;
    }

    // Never remove the last remaining active admin.
    if (await isLastActiveAdmin(id)) {
      sendError(res, 'Cannot delete the last active admin.', 400);
      return;
    }

    await prisma.user.delete({ where: { id } });
    void createAuditLog(req, 'DELETE', 'user', id, target.email);
    sendSuccess(res, null, 'User deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'User not found');
      return;
    }
    sendError(res, 'Failed to delete user');
  }
}

export async function resetUserPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existingUser) {
      sendNotFound(res, 'User not found');
      return;
    }

    const targetRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: { role: { select: { name: true } } },
    });
    const targetIsAdmin = targetRoles.some(
      (ur) => ur.role.name.toLowerCase() === 'admin'
    );
    const requesterIsAdmin = (req as AuthRequest).user?.roles?.some(
      (r) => r.toLowerCase() === 'admin'
    ) ?? false;

    if (targetIsAdmin && !requesterIsAdmin) {
      sendForbidden(res, 'Cannot reset password for an Admin user');
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Force re-login everywhere with the new password.
    await revokeUserSessions(id);

    void createAuditLog(req, 'RESET_PASSWORD', 'user', id, existingUser.email);
    sendSuccess(res, null, 'User password reset successfully');
  } catch (error) {
    sendError(res, 'Failed to reset user password');
  }
}

export async function getUserBanquets(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const rows = await prisma.userBanquet.findMany({
      where: { userId: id },
      select: { banquetId: true },
    });
    sendSuccess(res, { banquetIds: rows.map((r) => r.banquetId) });
  } catch (error) {
    sendError(res, 'Failed to fetch user banquet access');
  }
}

export async function setUserBanquets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const banquetIds: string[] = Array.isArray(req.body.banquetIds)
      ? req.body.banquetIds.filter((b: unknown) => typeof b === 'string')
      : [];

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    await prisma.$transaction([
      prisma.userBanquet.deleteMany({ where: { userId: id } }),
      ...(banquetIds.length > 0
        ? [prisma.userBanquet.createMany({
            data: banquetIds.map((banquetId) => ({ userId: id, banquetId })),
            skipDuplicates: true,
          })]
        : []),
    ]);

    void createAuditLog(req, 'UPDATE_BANQUET_ACCESS', 'user', id, user.email, { banquetIds });
    sendSuccess(res, { banquetIds }, 'Banquet access updated');
  } catch (error) {
    sendError(res, 'Failed to update user banquet access');
  }
}

export async function getUserDirectPermissions(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const rows = await prisma.userPermission.findMany({
      where: { userId: id },
      select: { permissionId: true },
    });
    sendSuccess(res, { permissionIds: rows.map((r) => r.permissionId) });
  } catch (error) {
    sendError(res, 'Failed to fetch user permissions');
  }
}

export async function setUserDirectPermissions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const permissionIds: string[] = Array.isArray(req.body.permissionIds)
      ? req.body.permissionIds.filter((p: unknown) => typeof p === 'string')
      : [];

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    await prisma.$transaction([
      prisma.userPermission.deleteMany({ where: { userId: id } }),
      ...(permissionIds.length > 0
        ? [prisma.userPermission.createMany({
            data: permissionIds.map((permissionId) => ({ userId: id, permissionId })),
            skipDuplicates: true,
          })]
        : []),
    ]);

    void createAuditLog(req, 'UPDATE_DIRECT_PERMISSIONS', 'user', id, user.email, { permissionIds });
    sendSuccess(res, { permissionIds }, 'Direct permissions updated');
  } catch (error: any) {
    if (error?.code === 'P2003') {
      sendError(res, 'Invalid permission selected', 400);
      return;
    }
    sendError(res, 'Failed to update direct permissions');
  }
}
