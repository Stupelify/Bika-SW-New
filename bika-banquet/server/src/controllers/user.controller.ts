import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendError, sendNotFound, sendSuccess } from '../utils/response';
import { hashPassword } from '../utils/auth';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().uuid().optional(),
  }),
});

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
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || '';

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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
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
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          isVerified: true,
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

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id },
    });
    sendSuccess(res, null, 'User deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'User not found');
      return;
    }
    sendError(res, 'Failed to delete user');
  }
}
