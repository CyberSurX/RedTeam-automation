import { Request, Response, NextFunction } from 'express'
import { rateLimit } from 'express-rate-limit'
// Use in-memory rate limiting for compilation reliability; switch to RedisStore later if needed.

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    })
  },
})

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
})

// Rate limiter for password reset endpoints
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiter for registration endpoints
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registrations per hour
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiter for contact form endpoints
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 contact requests per hour
  message: {
    success: false,
    message: 'Too many contact requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Advanced rate limiting with user-based limits
export const userRateLimiter = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: (req: Request) => {
      // Return different limits based on user role
      if ((req as any).user?.role === 'admin') {
        return maxRequests * 10 // Admins get 10x the limit
      } else if ((req as any).user?.role === 'premium') {
        return maxRequests * 2 // Premium users get 2x the limit
      }
      return maxRequests // Regular users get default limit
    },
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return (req as any).user?.id || req.ip
    },
    message: {
      success: false,
      message: 'Rate limit exceeded for your account.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// Distributed caching for rate limit data
export const rateLimitCache = {
  async get(key: string): Promise<number | null> {
    return null
  },

  async set(key: string, value: number, ttl: number): Promise<void> {
    // In-memory placeholder; implement with Redis when enabled
    void key
    void value
    void ttl
  },

  async increment(key: string, ttl: number): Promise<number> {
    return 0
  },
}

export default undefined