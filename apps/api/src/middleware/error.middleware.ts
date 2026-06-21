import type { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  details?: unknown
}

export function errorMiddleware(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode ?? 500
  const code = err.code ?? 'INTERNAL_ERROR'

  if (statusCode >= 500) {
    logger.error({ err, code }, err.message)
  } else {
    logger.warn({ code }, err.message)
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message ?? 'An unexpected error occurred',
      ...(err.details ? { details: err.details } : {}),
    },
  })
}

export function createError(
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: unknown
): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  err.code = code
  err.details = details
  return err
}

export const Errors = {
  NotFound: (msg = 'Resource not found') => createError(msg, 404, 'NOT_FOUND'),
  Unauthorized: (msg = 'Authentication required') => createError(msg, 401, 'UNAUTHORIZED'),
  Forbidden: (msg = 'Access denied') => createError(msg, 403, 'FORBIDDEN'),
  Validation: (msg: string, details?: unknown) => createError(msg, 422, 'VALIDATION_ERROR', details),
  InsufficientBalance: () => createError('Insufficient wallet balance', 422, 'INSUFFICIENT_BALANCE'),
  OutOfStock: (name?: string) => createError(`${name ?? 'Product'} is out of stock`, 422, 'PRODUCT_OUT_OF_STOCK'),
  CartEmpty: () => createError('Cart is empty', 422, 'CART_EMPTY'),
  OrderNotCancellable: () => createError('Order cannot be cancelled at this stage', 422, 'ORDER_NOT_CANCELLABLE'),
  RateLimit: () => createError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'),
}
