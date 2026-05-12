import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from './logger';
import { Request } from 'express';

export async function createAuditLog(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  resourceLabel?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId ?? null;
    const userName = authReq.user?.email ?? null;
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || null;

    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action,
        resource,
        resourceId: resourceId ?? null,
        resourceLabel: resourceLabel ?? null,
        details: details ? (details as any) : undefined,
        ipAddress,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log:', err);
  }
}
