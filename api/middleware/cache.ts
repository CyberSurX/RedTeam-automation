import { Request, Response, NextFunction } from 'express'
import NodeCache from 'node-cache'
import crypto from 'crypto'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
  }
}

interface CacheStats {
  hits: number
  misses: number
  keys: number
  ksize: number
  vsize: number
}

export class CacheManager {
  private static instance: CacheManager
  private cache: NodeCache
  private keyPrefix = 'api:'

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
      useClones: false,
      deleteOnExpire: true,
      maxKeys: 1000
    })
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  generateKey(req: AuthenticatedRequest): string {
    try {
      const keyData = {
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        userId: req.user?.id,
      }
      
      const keyString = JSON.stringify(keyData, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          return Object.keys(value).sort().reduce((sorted, key) => {
            sorted[key] = value[key]
            return sorted
          }, {} as any)
        }
        return value
      })
      
      return this.keyPrefix + crypto.createHash('sha256').update(keyString).digest('hex')
    } catch (error) {
      throw new Error(`Failed to generate cache key: ${error}`)
    }
  }

  get(key: string): any {
    if (!key || typeof key !== 'string') {
      throw new Error('Cache key must be a non-empty string')
    }
    return this.cache.get(key)
  }

  set(key: string, data: any, ttl?: number): boolean {
    if (!key || typeof key !== 'string') {
      throw new Error('Cache key must be a non-empty string')
    }
    
    if (ttl !== undefined && (typeof ttl !== 'number' || ttl < 0)) {
      throw new Error('TTL must be a non-negative number')
    }

    try {
      if (typeof ttl === 'number') {
        return this.cache.set(key, data, ttl)
      }
      return this.cache.set(key, data)
    } catch (error) {
      throw new Error(`Failed to set cache: ${error}`)
    }
  }

  del(key: string): number {
    if (!key || typeof key !== 'string') {
      throw new Error('Cache key must be a non-empty string')
    }
    return this.cache.del(key)
  }

  flush(): void {
    this.cache.flushAll()
  }

  getStats(): CacheStats {
    return this.cache.getStats()
  }

  keys(): string[] {
    return this.cache.keys()
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }
}

export const cacheMiddleware = (ttl: number = 300) => {
  if (typeof ttl !== 'number' || ttl < 0) {
    throw new Error('TTL must be a non-negative number')
  }

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.method !== 'GET') {
        return next()
      }

      if (req.user && !req.query.cache) {
        return next()
      }

      const cacheManager = CacheManager.getInstance()
      const cacheKey = cacheManager.generateKey(req)

      const cached = cacheManager.get(cacheKey)
      if (cached !== undefined) {
        res.set('X-Cache', 'HIT')
        return res.json({
          success: true,
          cached: true,
          data: cached,
          timestamp: new Date().toISOString()
        })
      }

      const originalJson = res.json.bind(res)

      res.json = function(data: any) {
        try {
          if (res.statusCode === 200 && data && data.success !== false) {
            const dataToCache = data.data || data
            cacheManager.set(cacheKey, dataToCache, ttl)
            res.set('X-Cache', 'MISS')
          }
        } catch (error) {
          console.error('Cache set error:', error)
        }
        return originalJson(data)
      }

      next()
    } catch (error) {
      console.error('Cache middleware error:', error)
      next()
    }
  }
}

export const invalidateCache = (pattern?: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const cacheManager = CacheManager.getInstance()
    
    const originalJson = res.json.bind(res)

    res.json = function(data: any) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.method !== 'GET') {
          if (pattern) {
            const keys = cacheManager.keys()
            const matchedKeys = keys.filter(key => key.includes(pattern))
            matchedKeys.forEach(key => cacheManager.del(key))
          } else {
            const cacheKey = cacheManager.generateKey(req)
            cacheManager.del(cacheKey)
          }
        }
      } catch (error) {
        console.error('Cache invalidation error:', error)
      }
      return originalJson(data)
    }

    next()
  }
}

export const clearCache = () => {
  const cacheManager = CacheManager.getInstance()
  cacheManager.flush()
}

export const getCacheStats = (): CacheStats => {
  const cacheManager = CacheManager.getInstance()
  return cacheManager.getStats()
}