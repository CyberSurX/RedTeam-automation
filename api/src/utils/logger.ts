/* eslint-disable @typescript-eslint/no-explicit-any */
import winston from 'winston';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Define colors for log levels
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray'
};

// Add colors to winston
winston.addColors(logColors);

// Create logs directory if it doesn't exist
const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  defaultMeta: { service: 'bug-bounty-automation' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // HTTP logs
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Create HTTP request logger
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  ],
});

// Create audit logger for security events
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Log rotation for production
if (process.env.NODE_ENV === 'production') {
  // Add daily rotate file transport
  import('winston-daily-rotate-file').then((module) => {
    const DailyRotateFile = module.default;
    logger.add(new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }));
  }).catch((error) => {
    console.error('Failed to load winston-daily-rotate-file:', error);
  });
}

// Error handling for logger
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Utility functions for structured logging
export const logJobStart = (jobType: string, jobId: string, userId: string) => {
  logger.info('Job started', {
    jobType,
    jobId,
    userId,
    event: 'job_start'
  });
};

export const logJobComplete = (jobType: string, jobId: string, duration: number) => {
  logger.info('Job completed', {
    jobType,
    jobId,
    duration,
    event: 'job_complete'
  });
};

export const logJobError = (jobType: string, jobId: string, error: Error) => {
  logger.error('Job failed', {
    jobType,
    jobId,
    error: error.message,
    stack: error.stack,
    event: 'job_error'
  });
};

export const logSecurityEvent = (event: string, userId: string, details: any) => {
  auditLogger.info('Security event', {
    event,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logApiCall = (method: string, path: string, statusCode: number, duration: number, userId?: string) => {
  httpLogger.http('API call', {
    method,
    path,
    statusCode,
    duration,
    userId,
    timestamp: new Date().toISOString()
  });
};

export default logger;