import prisma from '../config/database';

/** True if the user holds the Admin role. */
export async function userHasAdminRole(userId: string): Promise<boolean> {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: { select: { name: true } } },
  });
  return roles.some((ur) => ur.role.name.toLowerCase() === 'admin');
}

/**
 * True if `userId` is an Admin and there is no OTHER active Admin — i.e.
 * removing, disabling, or stripping the Admin role from them would leave the
 * system with no active admin.
 */
export async function isLastActiveAdmin(userId: string): Promise<boolean> {
  if (!(await userHasAdminRole(userId))) return false;

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
