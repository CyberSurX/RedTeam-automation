import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client for caching
export const redisClient = new Redis(redisUrl, {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Redis client for Bull queue (separate connection)
export const queueRedis = new Redis(redisUrl, {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redisClient.connect();
    await redisClient.ping();
    console.log('✅ Redis connection established');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}

// Initialize Redis
export async function initializeRedis(): Promise<void> {
  const isConnected = await testRedisConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to Redis');
  }
  
  console.log('Redis initialized successfully');
}

// Cache helpers
export async function getCache(key: string): Promise<string | null> {
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache(
  key: string, 
  value: string, 
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    await redisClient.setex(key, ttlSeconds, value);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}