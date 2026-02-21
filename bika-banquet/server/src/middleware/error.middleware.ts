import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { sendError, sendValidationError } from '../utils/response';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler
 */
export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendValidationError(res, errors);
    return;
  }

  // Application errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      sendError(res, 'A record with this value already exists', 409);
      return;
    }
    if (prismaError.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  // Default error
  if (process.env.NODE_ENV === 'production') {
    sendError(res, 'Internal server error', 500);
  } else {
    sendError(res, err.message || 'Internal server error', 500);
  }
}

/**
 * 404 handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
}
