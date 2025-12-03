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
  level: 6, // Balance between speed and compression ratio
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiting for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Slow down middleware for additional protection
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes, then...
  delayMs: 500, // Begin adding 500ms of delay per request
})

// ETag support for better caching
export const etagMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.set('ETag', 'weak')
  next()
}

// Conditional request handling
export const conditionalRequest = (req: Request, res: Response, next: NextFunction) => {
  // Add Last-Modified header
  res.set('Last-Modified', new Date().toUTCString())
  
  // Check If-Modified-Since
  if (req.headers['if-modified-since']) {
    const modifiedSince = new Date(req.headers['if-modified-since'] as string)
    const now = new Date()
    
    // If modified within last 5 minutes, return 304
    if (now.getTime() - modifiedSince.getTime() < 5 * 60 * 1000) {
      return res.status(304).end()
    }
  }
  
  next()
}

// Response time optimization
export const responseTimeOptimization = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    // Add response time header
    res.set('X-Response-Time', `${duration}ms`)
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`)
    }
  })
  
  next()
}

// Bundle optimization hints
export const optimizationHints = (req: Request, res: Response, next: NextFunction) => {
  // Add hints for HTTP/2 server push
  res.set('Link', '<https://fonts.googleapis.com/css?family=Roboto:300,400,500>; rel=preload; as=style')
  
  // Add resource hints
  res.set('X-DNS-Prefetch-Control', 'on')
  
  next()
}

// Caching strategy middleware
export const cachingStrategy = (ttl: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set cache control headers
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${ttl}`)
      res.set('Vary', 'Accept-Encoding')
    } else {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.set('Pragma', 'no-cache')
      res.set('Expires', '0')
    }
    
    next()
  }
}

// Optimize for production
export const productionOptimizations = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    // Remove powered-by header
    res.removeHeader('X-Powered-By')
    
    // Add production-specific headers
    res.set('X-Content-Type-Options', 'nosniff')
    res.set('X-Frame-Options', 'DENY')
    res.set('X-XSS-Protection', '1; mode=block')
  }
  
  next()
}