import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: any[]
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send validation error
 */
export function sendValidationError(
  res: Response,
  errors: any[]
): Response {
  return sendError(res, 'Validation failed', 400, errors);
}

/**
 * Send unauthorized error
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized'
): Response {
  return sendError(res, message, 401);
}

/**
 * Send forbidden error
 */
export function sendForbidden(
  res: Response,
  message: string = 'Forbidden'
): Response {
  return sendError(res, message, 403);
}

/**
 * Send not found error
 */
export function sendNotFound(
  res: Response,
  message: string = 'Resource not found'
): Response {
  return sendError(res, message, 404);
}
