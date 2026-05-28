import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { parsePagination } from '../utils/pagination';

const ALLOWED_SORT_KEYS = new Set(['createdAt', 'action', 'resource', 'userName']);

function parseMulti(value: unknown): string[] {
  if (!value) return [];
  return (value as string)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(
      req.query.page,
      req.query.limit,
      50,
      200
    );

    const { userId, resource, action, fromDate, toDate, createdAtFrom, createdAtTo, search } = req.query;

    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId as string;
    }

    const resources = parseMulti(resource);
    if (resources.length === 1) whereClause.resource = resources[0];
    else if (resources.length > 1) whereClause.resource = { in: resources };

    const actions = parseMulti(action);
    if (actions.length === 1) whereClause.action = actions[0];
    else if (actions.length > 1) whereClause.action = { in: actions };

    // Date range accepts either {fromDate,toDate} (legacy) or {createdAtFrom,createdAtTo} (toolkit).
    const from = (createdAtFrom ?? fromDate) as string | undefined;
    const to = (createdAtTo ?? toDate) as string | undefined;
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) {
        const toDateEnd = new Date(to);
        toDateEnd.setUTCHours(23, 59, 59, 999);
        whereClause.createdAt.lte = toDateEnd;
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

    let orderBy: any = { createdAt: 'desc' };
    if (req.query.sort) {
      const [key, dir] = (req.query.sort as string).split(':');
      if (key && ALLOWED_SORT_KEYS.has(key) && (dir === 'asc' || dir === 'desc')) {
        orderBy = { [key]: dir };
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy,
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
