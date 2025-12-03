import { Request, Response, NextFunction } from 'express'
import NodeCache from 'node-cache'
import crypto from 'crypto'

export class CacheManager {
  private static instance: CacheManager
  private cache: NodeCache
  private keyPrefix = 'api:'

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every minute
      useClones: false,
    })
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  generateKey(req: Request): string {
    const keyData = {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      userId: (req as any).user?.id,
    }
    
    const keyString = JSON.stringify(keyData)
    return this.keyPrefix + crypto.createHash('md5').update(keyString).digest('hex')
  }

  get(key: string): any {
    return this.cache.get(key)
  }

  set(key: string, data: any, ttl?: number): boolean {
    // Some NodeCache typings expect a strict string|number ttl.
    // Use the overload without ttl when it's undefined to satisfy TS.
    if (typeof ttl === 'number') {
      return this.cache.set(key, data, ttl)
    }
    return this.cache.set(key, data)
  }

  del(key: string): number {
    return this.cache.del(key)
  }

  flush(): void {
    this.cache.flushAll()
  }

  getStats() {
    return this.cache.getStats()
  }
}

export const cacheMiddleware = (ttl: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next()
    }

    // Skip caching for authenticated endpoints (unless specifically allowed)
    if ((req as any).user && !req.query.cache) {
      return next()
    }

    const cacheManager = CacheManager.getInstance()
    const cacheKey = cacheManager.generateKey(req)

    // Check cache
    const cached = cacheManager.get(cacheKey)
    if (cached) {
      res.set('X-Cache', 'HIT')
      return res.json({
        success: true,
        cached: true,
        data: cached,
      })
    }

    // Store original json method
    const originalJson = res.json

    // Override json method to cache response
    res.json = function(data) {
      // Cache successful responses only
      if (res.statusCode === 200 && data.success) {
        cacheManager.set(cacheKey, data.data, ttl)
        res.set('X-Cache', 'MISS')
      }

      // Call original json method
      return originalJson.call(this, data)
    }

    next()
  }
}

export const invalidateCache = (pattern?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheManager = CacheManager.getInstance()
    
    // Store original json method
    const originalJson = res.json

    res.json = function(data) {
      // Invalidate cache on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (pattern) {
          // Invalidate specific pattern
          // This is a simplified implementation
          cacheManager.flush() // For now, flush all cache
        } else {
          // Invalidate related cache entries
          cacheManager.flush()
        }
      }

      // Call original json method
      return originalJson.call(this, data)
    }

    next()
  }
}

export const getCacheStats = (req: Request, res: Response) => {
  const cacheManager = CacheManager.getInstance()
  const stats = cacheManager.getStats()

  res.json({
    success: true,
    data: {
      hits: stats.hits,
      misses: stats.misses,
      keys: stats.keys,
      ksize: stats.ksize,
      vsize: stats.vsize,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    },
  })
}

export const clearCache = (req: Request, res: Response) => {
  const cacheManager = CacheManager.getInstance()
  cacheManager.flush()

  res.json({
    success: true,
    message: 'Cache cleared successfully',
  })
}