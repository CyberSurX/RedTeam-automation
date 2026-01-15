typescript
import { Request, Response, NextFunction } from 'express'
import compression from 'compression'
import helmet from 'helmet'
import * as rateLimit from 'express-rate-limit'
import * as slowDown from 'express-slow-down'
import { cacheMiddleware } from './cache'

// Compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  },
  level: 6,
})

// Security headers with performance optimizations
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
})

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
})

// Strict rate limiting for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
})

// Slow down middleware for additional protection
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 500,
  validate: { trustProxy: false },
})

// ETag support for better caching
export const etagMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.set('ETag', 'weak')
    next()
  } catch (error) {
    next(error)
  }
}

// Conditional request handling
export const conditionalRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastModified = new Date().toUTCString()
    res.set('Last-Modified', lastModified)
    
    if (req.headers['if-modified-since']) {
      const modifiedSinceHeader = req.headers['if-modified-since']
      
      if (typeof modifiedSinceHeader !== 'string') {
        return next()
      }
      
      const modifiedSince = new Date(modifiedSinceHeader)
      const now = new Date()
      
      if (isNaN(modifiedSince.getTime())) {
        return next()
      }
      
      if (now.getTime() - modifiedSince.getTime() < 5 * 60 * 1000) {
        return res.status(304).end()
      }
    }
    
    next()
  } catch (error) {
    next(error)
  }
}

// Response time optimization
export const responseTimeOptimization = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  const cleanup = () => {
    res.removeListener('finish', onFinish)
    res.removeListener('close', onClose)
  }
  
  const onFinish = () => {
    cleanup()
    const duration = Date.now() - start
    res.set('X-Response-Time', `${duration}ms`)
    
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`)
    }
  }
  
  const onClose = () => {
    cleanup()
    const duration = Date.now() - start
    console.warn(`Request closed prematurely: ${req.method} ${req.originalUrl} after ${duration}ms`)
  }
  
  res.on('finish', onFinish)
  res.on('close', onClose)
  
  next()
}

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime()
  const startMemory = process.memoryUsage()
  
  res.on('finish', () => {
    const diff = process.hrtime(start)
    const duration = diff[0] * 1000 + diff[1] / 1000000
    const endMemory = process.memoryUsage()
    
    const memoryDiff = {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    }
    
    if (duration > 500) {
      console.warn(`Performance alert: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`)
    }
    
    if (memoryDiff.heapUsed > 50 * 1024 * 1024) {
      console.warn(`Memory alert: ${req.method} ${req.originalUrl} used ${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    }
  })
  
  next()
}

// Validate request size middleware
export const requestSizeValidator = (maxSize: number = 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentLength = parseInt(req.headers['content-length'] || '0', 10)
      
      if (contentLength > maxSize) {
        return res.status(413).json({
          success: false,
          message: `Request entity too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
        })
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Cache control middleware
export const cacheControl = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.method === 'GET') {
        res.set('Cache-Control', `public, max-age=${maxAge}`)
      } else {
        res.set('Cache-Control', 'no-store')
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}