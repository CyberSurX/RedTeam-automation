import { Request, Response } from 'express'
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit'

import { AuthenticatedRequest } from './auth.js'

// General API rate limiter
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    })
  },
})

// Strict rate limiter for authentication endpoints
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: () => process.env.NODE_ENV === 'test',
})

// Rate limiter for password reset endpoints
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
})

// Rate limiter for registration endpoints
export const registrationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
})

// Rate limiter for contact form endpoints
export const contactLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many contact requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
})

// Advanced rate limiting with user-based limits
export const userRateLimiter = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
): RateLimitRequestHandler => {
  if (maxRequests <= 0) {
    throw new Error('maxRequests must be a positive number')
  }

  if (windowMs <= 0) {
    throw new Error('windowMs must be a positive number')
  }

  return rateLimit({
    windowMs,
    max: (req: Request) => {
      const customReq = req as AuthenticatedRequest
      if (customReq.user?.role === 'admin') {
        return maxRequests * 10
      } else if (customReq.user?.role === 'premium') {
        return maxRequests * 2
      }
      return maxRequests
    },
    keyGenerator: (req: Request) => {
      const customReq = req as AuthenticatedRequest
      return customReq.user?.id || req.ip || 'unknown'
    },
    message: {
      success: false,
      message: 'Rate limit exceeded for your account.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    skip: () => process.env.NODE_ENV === 'test',
    validate: { xForwardedForHeader: false },
  })
}