import { Request, Response, NextFunction } from 'express'
import logger, { apiLogger, securityLogger } from '../utils/logger'
import { AppError } from '../utils/errors'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const anyErr = err as any
  let error: any = { ...anyErr }
  error.message = anyErr.message

  // Log error
  apiLogger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  })

  // Mongoose bad ObjectId
  if (anyErr.name === 'CastError') {
    const message = 'Resource not found'
    error = new AppError(message, 404)
  }

  // Mongoose duplicate key
  if (anyErr.name === 'MongoServerError' && anyErr.code === 11000) {
    const message = 'Duplicate field value entered'
    error = new AppError(message, 400)
  }

  // Mongoose validation error
  if (anyErr.name === 'ValidationError') {
    const message = Object.values(anyErr.errors || {}).map((val: any) => val.message)
    error = new AppError(message.join(', '), 400)
  }

  // Prisma errors
  if (anyErr.name === 'PrismaClientKnownRequestError') {
    if (anyErr.code === 'P2002') {
      const message = 'Unique constraint violation'
      error = new AppError(message, 409)
    } else if (anyErr.code === 'P2025') {
      const message = 'Record not found'
      error = new AppError(message, 404)
    } else {
      const message = 'Database operation failed'
      error = new AppError(message, 500)
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: anyErr.stack }),
  })
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404)
  next(error)
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.id,
    }

    if (res.statusCode >= 400) {
      apiLogger.warn('Request failed', logData)
    } else {
      apiLogger.info('Request completed', logData)
    }
  })

  next()
}

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('X-Download-Options', 'noopen')
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
  
  next()
}

export const rateLimitLogger = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    if (res.statusCode === 429) {
      securityLogger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: (req as any).user?.id,
        endpoint: req.url,
      })
    }
  })
  
  next()
}