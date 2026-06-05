import prisma from '../config/database';
import { invalidateSessionCacheByToken } from '../middleware/auth.middleware';

/**
 * Revoke ALL of a user's sessions ("log out everywhere") and clear their
 * cached session entries so the revocation takes effect immediately rather
 * than after the session cache TTL.
 *
 * Called whenever a user's credentials or access are changed in a way that
 * must invalidate existing logins: password reset and account disable.
 */
export async function revokeUserSessions(userId: string): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: { token: true },
  });

  await Promise.all(
    sessions.map((s) =>
      invalidateSessionCacheByToken(s.token).catch(() => undefined)
    )
  );

  await prisma.session.deleteMany({ where: { userId } });
}
