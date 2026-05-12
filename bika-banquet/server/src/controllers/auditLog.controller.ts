import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { parsePagination } from '../utils/pagination';

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(
      req.query.page,
      req.query.limit,
      50,
      200
    );

    const { userId, resource, action, fromDate, toDate, search } = req.query;

    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId as string;
    }

    if (resource) {
      whereClause.resource = resource as string;
    }

    if (action) {
      whereClause.action = action as string;
    }

    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) {
        whereClause.createdAt.gte = new Date(fromDate as string);
      }
      if (toDate) {
        // Set to end of day
        const to = new Date(toDate as string);
        to.setUTCHours(23, 59, 59, 999);
        whereClause.createdAt.lte = to;
      }
    }

    if (search) {
      const searchStr = search as string;
      whereClause.OR = [
        { userName: { contains: searchStr, mode: 'insensitive' } },
        { resourceLabel: { contains: searchStr, mode: 'insensitive' } },
        { resourceId: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    sendSuccess(res, {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch audit logs', 500);
  }
}
