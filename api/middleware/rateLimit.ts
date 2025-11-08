import { Request, Response, NextFunction } from 'express'
import { rateLimit } from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { createClient } from 'redis'

let redisClient: any = null

// Initialize Redis client for distributed rate limiting
const initializeRedis = async () => {
  if (process.env.REDIS_URL) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      })

      redisClient.on('error', (err: Error) => {
        console.error('Redis Client Error', err)
      })

      await redisClient.connect()
      console.log('Redis client connected successfully')
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      redisClient = null
    }
  }
}

// Initialize Redis on module load
initializeRedis()

// General API rate limiter
export const apiLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:api:',
  }) : undefined,
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
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
  }) : undefined,
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
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:password:',
  }) : undefined,
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
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:register:',
  }) : undefined,
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
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rl:contact:',
  }) : undefined,
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
    store: redisClient ? new RedisStore({
      client: redisClient,
      prefix: 'rl:user:',
    }) : undefined,
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
    if (redisClient) {
      try {
        const value = await redisClient.get(key)
        return value ? parseInt(value) : null
      } catch (error) {
        console.error('Redis get error:', error)
        return null
      }
    }
    return null
  },

  async set(key: string, value: number, ttl: number): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.setEx(key, Math.ceil(ttl / 1000), value.toString())
      } catch (error) {
        console.error('Redis set error:', error)
      }
    }
  },

  async increment(key: string, ttl: number): Promise<number> {
    if (redisClient) {
      try {
        const multi = redisClient.multi()
        multi.incr(key)
        multi.expire(key, Math.ceil(ttl / 1000))
        const results = await multi.exec()
        return results[0] as number
      } catch (error) {
        console.error('Redis increment error:', error)
        return 0
      }
    }
    return 0
  },
}

export default redisClient