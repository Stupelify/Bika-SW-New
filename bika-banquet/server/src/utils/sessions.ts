import prisma from '../config/database';
import { invalidateSessionCacheByToken } from '../middleware/auth.middleware';

type SessionTokenRow = { token: string };
type UserRoleUserRow = { userId: string };

/**
 * Revoke a user's sessions ("log out") and clear their cached session entries
 * so the revocation takes effect immediately rather than after the cache TTL.
 *
 * Pass `exceptToken` to keep the current device signed in (used by self
 * change-password: log out everywhere else, stay here).
 *
 * Called whenever credentials/access change in a way that must end existing
 * logins: password reset, self change-password, and account disable.
 */
export async function revokeUserSessions(
  userId: string,
  exceptToken?: string
): Promise<void> {
  const sessions: SessionTokenRow[] = await prisma.session.findMany({
    where: { userId },
    select: { token: true },
  });

  await Promise.all(
    sessions
      .filter((s) => s.token !== exceptToken)
      .map((s) => invalidateSessionCacheByToken(s.token).catch(() => undefined))
  );

  await prisma.session.deleteMany({
    where: exceptToken
      ? { userId, token: { not: exceptToken } }
      : { userId },
  });
}

/**
 * Refresh a user's permission/access view WITHOUT logging them out: drop their
 * cached session entries so the next request rebuilds roles/permissions/venue
 * access from the database. Session rows are kept intact.
 *
 * Used when an admin changes a user's roles, per-user permissions, or venue
 * access and the change should take effect immediately.
 */
export async function refreshUserSessions(userId: string): Promise<void> {
  const sessions: SessionTokenRow[] = await prisma.session.findMany({
    where: { userId },
    select: { token: true },
  });

  await Promise.all(
    sessions.map((s) =>
      invalidateSessionCacheByToken(s.token).catch(() => undefined)
    )
  );
}

/**
 * Refresh every user who holds the given role (used when a role's permission
 * set changes), so all affected users pick up the change on their next request.
 */
export async function refreshUsersByRole(roleId: string): Promise<void> {
  const userRoles: UserRoleUserRow[] = await prisma.userRole.findMany({
    where: { roleId },
    select: { userId: true },
  });

  await Promise.all(
    userRoles.map((ur) => refreshUserSessions(ur.userId).catch(() => undefined))
  );
}
