// @ts-nocheck
import { Request, Response } from 'express';
import os from 'os';
import process from 'process';
import si from 'systeminformation';
import { createClient } from 'redis';
import { Pool } from 'pg';

const redisClient = createClient();
redisClient.on('error', (err) => console.error('Redis Client Error', err));
await redisClient.connect();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

interface SystemMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  process: {
    uptime: number;
    memory: number;
    cpu: number;
  };
}

export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const cpuUsage = os.loadavg()[0];
  const cpuCores = os.cpus().length;

  const fs = await si.fsSize();
  let totalDisk = 0;
  let usedDisk = 0;
  for (const disk of fs) {
    totalDisk += disk.size;
    usedDisk += disk.used;
  }

  return {
    timestamp: Date.now(),
    memory: {
      used: usedMemory,
      total: totalMemory,
      percentage: (usedMemory / totalMemory) * 100,
    },
    cpu: {
      usage: cpuUsage,
      cores: cpuCores,
    },
    disk: {
      used: usedDisk,
      total: totalDisk,
      percentage: (usedDisk / totalDisk) * 100,
    },
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage().heapUsed,
      cpu: process.cpuUsage().user,
    },
  };
};

const checkDatabaseConnection = async (): Promise<'healthy' | 'unhealthy'> => {
  try {
    const client = await pool.connect();
    client.release();
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
};

const checkRedisConnection = async (): Promise<'healthy' | 'unhealthy'> => {
  try {
    await redisClient.ping();
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
};

export const healthCheck = async (req: Request, res: Response) => {
  const metrics = await getSystemMetrics();
  const dbStatus = await checkDatabaseConnection();
  const redisStatus = await checkRedisConnection();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    metrics: {
      memory: {
        usage: `${metrics.memory.percentage.toFixed(1)}%`,
        status: metrics.memory.percentage < 90 ? 'healthy' : 'warning',
      },
      cpu: {
        usage: `${(metrics.cpu.usage / metrics.cpu.cores * 100).toFixed(1)}%`,
        status: metrics.cpu.usage < metrics.cpu.cores * 0.8 ? 'healthy' : 'warning',
      },
      disk: {
        usage: `${metrics.disk.percentage.toFixed(1)}%`,
        status: metrics.disk.percentage < 85 ? 'healthy' : 'warning',
      },
    },
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  };

  const isHealthy = Object.values(health.metrics).every(m => m.status === 'healthy') &&
                    Object.values(health.services).every(s => s === 'healthy');

  res.status(isHealthy ? 200 : 503).json(health);
};

export const readinessCheck = async (req: Request, res: Response) => {
  try {
    const dbStatus = await checkDatabaseConnection();
    const redisStatus = await checkRedisConnection();
    const isReady = dbStatus === 'healthy' && redisStatus === 'healthy';
    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    });
  } catch (e) {
    res.status(503).json({ status: 'not ready', error: e.message });
  }
};