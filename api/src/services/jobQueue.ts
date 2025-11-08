import Queue from 'bull';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { reconService } from './reconService';
import { scanningService } from './scanningService';
import { exploitationService } from './exploitationService';
import { triageService } from './triageService';
import { reportingService } from './reportingService';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  lazyConnect: true
};

// Create Redis client for health checks
export const redisClient = new Redis(redisConfig);

// Job queues
export const reconQueue = new Queue('recon', { redis: redisConfig });
export const scanningQueue = new Queue('scanning', { redis: redisConfig });
export const exploitationQueue = new Queue('exploitation', { redis: redisConfig });
export const triageQueue = new Queue('triage', { redis: redisConfig });
export const reportingQueue = new Queue('reporting', { redis: redisConfig });

// Queue event handlers
const setupQueueHandlers = (queue: Queue.Queue, queueName: string) => {
  queue.on('completed', (job) => {
    logger.info(`${queueName} job ${job.id} completed`);
  });

  queue.on('failed', (job, err) => {
    logger.error(`${queueName} job ${job.id} failed:`, err);
  });

  queue.on('stalled', (job) => {
    logger.warn(`${queueName} job ${job.id} stalled`);
  });

  queue.on('error', (error) => {
    logger.error(`${queueName} queue error:`, error);
  });
};

// Setup all queue handlers
setupQueueHandlers(reconQueue, 'Recon');
setupQueueHandlers(scanningQueue, 'Scanning');
setupQueueHandlers(exploitationQueue, 'Exploitation');
setupQueueHandlers(triageQueue, 'Triage');
setupQueueHandlers(reportingQueue, 'Reporting');

// Job processors
reconQueue.process(async (job) => {
  const { jobId, programId, config } = job.data;
  logger.info(`Processing recon job ${jobId}`);
  
  try {
    const results = await reconService.executeRecon(jobId, config);
    return { success: true, results };
  } catch (error) {
    logger.error(`Recon job ${jobId} failed:`, error);
    throw error;
  }
});

scanningQueue.process(async (job) => {
  const { jobId, programId, config } = job.data;
  logger.info(`Processing scanning job ${jobId}`);
  
  try {
    const results = await scanningService.executeScanning(jobId, config);
    return { success: true, results };
  } catch (error) {
    logger.error(`Scanning job ${jobId} failed:`, error);
    throw error;
  }
});

exploitationQueue.process(async (job) => {
  const { jobId, programId, config } = job.data;
  logger.info(`Processing exploitation job ${jobId}`);
  
  try {
    const results = await exploitationService.executeExploitation(jobId, config);
    return { success: true, results };
  } catch (error) {
    logger.error(`Exploitation job ${jobId} failed:`, error);
    throw error;
  }
});

triageQueue.process(async (job) => {
  const { jobId, findings } = job.data;
  logger.info(`Processing triage job ${jobId}`);
  
  try {
    const results = await triageService.processFindings(jobId, findings);
    return { success: true, results };
  } catch (error) {
    logger.error(`Triage job ${jobId} failed:`, error);
    throw error;
  }
});

reportingQueue.process(async (job) => {
  const { jobId, findings, config } = job.data;
  logger.info(`Processing reporting job ${jobId}`);
  
  try {
    const results = await reportingService.generateReports(jobId, findings, config);
    return { success: true, results };
  } catch (error) {
    logger.error(`Reporting job ${jobId} failed:`, error);
    throw error;
  }
});

// Job management functions
export async function addJob(queueName: string, data: any): Promise<string> {
  let queue: Queue.Queue;
  
  switch (queueName) {
    case 'recon':
      queue = reconQueue;
      break;
    case 'scanning':
      queue = scanningQueue;
      break;
    case 'exploitation':
      queue = exploitationQueue;
      break;
    case 'triage':
      queue = triageQueue;
      break;
    case 'reporting':
      queue = reportingQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  const job = await queue.add(data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 24 * 3600 // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      age: 24 * 3600 // Keep failed jobs for 24 hours
    }
  });

  logger.info(`Job ${job.id} added to ${queueName} queue`);
  return job.id.toString();
}

export async function getJobStatus(jobId: string): Promise<any> {
  const queues = [reconQueue, scanningQueue, exploitationQueue, triageQueue, reportingQueue];
  
  for (const queue of queues) {
    try {
      const job = await queue.getJob(jobId);
      if (job) {
        return {
          id: job.id,
          queue: queue.name,
          status: await job.getState(),
          data: job.data,
          result: job.returnvalue,
          failedReason: job.failedReason,
          attempts: job.attemptsMade,
          created: job.timestamp,
          processed: job.processedOn,
          finished: job.finishedOn
        };
      }
    } catch (error) {
      logger.error(`Error getting job ${jobId} from ${queue.name}:`, error);
    }
  }

  return null;
}

export async function cancelJob(jobId: string): Promise<boolean> {
  const queues = [reconQueue, scanningQueue, exploitationQueue, triageQueue, reportingQueue];
  
  for (const queue of queues) {
    try {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info(`Job ${jobId} cancelled`);
        return true;
      }
    } catch (error) {
      logger.error(`Error cancelling job ${jobId} from ${queue.name}:`, error);
    }
  }

  return false;
}

export async function getQueueStats(): Promise<any> {
  const stats = {};
  const queues = [
    { name: 'recon', queue: reconQueue },
    { name: 'scanning', queue: scanningQueue },
    { name: 'exploitation', queue: exploitationQueue },
    { name: 'triage', queue: triageQueue },
    { name: 'reporting', queue: reportingQueue }
  ];

  for (const { name, queue } of queues) {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed()
      ]);

      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      };
    } catch (error) {
      logger.error(`Error getting stats for ${name} queue:`, error);
      stats[name] = { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
  }

  return stats;
}

// Health check function
export async function checkQueueHealth(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function shutdownQueues(): Promise<void> {
  logger.info('Shutting down job queues...');
  
  const queues = [reconQueue, scanningQueue, exploitationQueue, triageQueue, reportingQueue];
  
  await Promise.all(queues.map(queue => queue.close()));
  await redisClient.disconnect();
  
  logger.info('Job queues shut down successfully');
}

// Initialize queues
export async function initializeQueues(): Promise<void> {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis for job queues');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}