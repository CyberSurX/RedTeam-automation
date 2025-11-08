import { Request, Response } from 'express'
import os from 'os'
import process from 'process'

interface SystemMetrics {
  timestamp: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    cores: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  process: {
    uptime: number
    memory: number
    cpu: number
  }
}

export const getSystemMetrics = (): SystemMetrics => {
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory

  const cpuUsage = os.loadavg()[0] // 1 minute load average
  const cpuCores = os.cpus().length

  // Get disk usage (simplified)
  const diskTotal = 100 * 1024 * 1024 * 1024 // 100GB placeholder
  const diskUsed = 60 * 1024 * 1024 * 1024  // 60GB placeholder

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
      used: diskUsed,
      total: diskTotal,
      percentage: (diskUsed / diskTotal) * 100,
    },
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage().heapUsed,
      cpu: process.cpuUsage().user,
    },
  }
}

export const healthCheck = (req: Request, res: Response) => {
  const metrics = getSystemMetrics()
  
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
      database: checkDatabaseConnection(),
      redis: checkRedisConnection(),
    },
  }

  const isHealthy = Object.values(health.metrics).every(m => m.status === 'healthy') &&
                    Object.values(health.services).every(s => s === 'healthy')

  res.status(isHealthy ? 200 : 503).json(health)
}

const checkDatabaseConnection = (): 'healthy' | 'unhealthy' => {
  // This would typically test actual database connectivity
  // For now, return healthy as placeholder
  return 'healthy'
}

const checkRedisConnection = (): 'healthy' | 'unhealthy' => {
  // This would typically test Redis connectivity
  // For now, return healthy as placeholder
  return 'healthy'
}

export const readinessCheck = (req: Request, res: Response) => {
  const readiness = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: checkDatabaseConnection(),
      redis: checkRedisConnection(),
      dependencies: 'healthy',
    },
  }

  const isReady = Object.values(readiness.checks).every(check => check === 'healthy')
  
  res.status(isReady ? 200 : 503).json(readiness)
}

export const livenessCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}