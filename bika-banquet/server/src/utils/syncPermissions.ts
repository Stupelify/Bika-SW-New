import prisma from '../config/database';
import logger from './logger';
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../config/permissions';

type PermissionIdRow = { id: string };

/**
 * Idempotently reconcile the permission/role registry with the database.
 *
 * - Upserts every permission in {@link PERMISSIONS} (keyed by unique name).
 * - Ensures the Admin role exists and is granted ALL permissions, so the
 *   owner is never locked out when new permissions are introduced.
 * - Ensures the Manager and Employee roles exist. Their default permission
 *   sets are only seeded when the role currently has zero permissions, so an
 *   operator's customizations are never clobbered.
 *
 * Safe to run repeatedly (on every boot, via CLI, or from the seed script).
 */
export async function syncPermissions(): Promise<void> {
  // 1. Upsert all known permissions (create if missing, refresh description).
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: permission,
    });
  }

  // 2. Admin role: must always have every permission.
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Full system access' },
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // 3. Default non-admin roles: seed defaults only when unconfigured.
  const roleDescriptions: Record<string, string> = {
    Manager: 'Booking and operations management',
    Employee: 'Operational access',
  };

  let seededRoles = 0;
  for (const [roleName, permissionNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: roleDescriptions[roleName] ?? null },
    });

    const existingCount = await prisma.rolePermission.count({
      where: { roleId: role.id },
    });
    if (existingCount > 0) {
      // Role already configured — do not overwrite operator customizations.
      continue;
    }

    const permissions: PermissionIdRow[] = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
      select: { id: true },
    });
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
      seededRoles += 1;
    }
  }

  logger.info(
    `🔐 Permission sync complete: ${PERMISSIONS.length} permissions upserted, ` +
      `Admin granted ${allPermissions.length} permissions, ` +
      `${seededRoles} default role(s) seeded.`,
  );
}

export default syncPermissions;
