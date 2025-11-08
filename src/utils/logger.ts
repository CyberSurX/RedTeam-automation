import winston from 'winston'

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'redteam-automation',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
})

// Create separate loggers for different concerns
export const authLogger = logger.child({ component: 'authentication' })
export const apiLogger = logger.child({ component: 'api' })
export const dbLogger = logger.child({ component: 'database' })
export const securityLogger = logger.child({ component: 'security' })

export default logger