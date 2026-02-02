// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
// import type { InstrumentationOption } from '@opentelemetry/instrumentation'
// import { NodeSDK } from '@opentelemetry/sdk-node'
import compression from 'compression'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import { createServer } from 'http'
import morgan from 'morgan'
import { Server } from 'socket.io'

// let getNodeAutoInstrumentations: (opts?: Record<string, unknown>) => InstrumentationOption[] = () => []

// try {
//   const autoInstr = await import('@opentelemetry/auto-instrumentations-node')
//   if (autoInstr && typeof autoInstr.getNodeAutoInstrumentations === 'function') {
//     getNodeAutoInstrumentations = autoInstr.getNodeAutoInstrumentations
//   }
// } catch {
//   console.warn('OpenTelemetry auto-instrumentations not available, continuing without instrumentation')
// }

dotenv.config()

import { errorHandler, notFound, requestLogger, securityHeaders } from './middleware/errorHandler'
import { rateLimiter } from './middleware/performance'
import { startMonitoring } from './monitoring/alerts'

import { authRouter as authRoutes } from './routes/auth'
import { programsRouter as programRoutes } from './routes/programs'
import { usersRouter as userRoutes } from './routes/users'
import { scanRouter as scanRoutes } from './routes/scan'
import { statsRouter as statsRoutes } from './routes/stats'
import { findingsRouter as findingsRoutes } from './routes/findings'
import { aiRouter as aiRoutes } from './routes/ai'
import { autonomousService } from './src/services/autonomousService'

import { clearAlert, getActiveAlerts, getAlerts } from './monitoring/alerts'
import { healthCheck, readinessCheck } from './monitoring/health'
import { getHealthMetrics, getMetrics } from './monitoring/metrics'

import logger from './utils/logger'
import { initializeDatabase } from './src/config/data-source'

initializeDatabase()

const app = express()
const server = createServer(app)

const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://redteam-automation.vercel.app',
  corsOrigin
].filter(Boolean)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

const PORT = parseInt(process.env.PORT || '5000', 10)
const NODE_ENV = process.env.NODE_ENV || 'development'

if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}. Must be between 1 and 65535`)
}

app.set('trust proxy', 1)

app.use(helmet({
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
}))

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

app.use(requestLogger)
app.use(securityHeaders)

if (NODE_ENV === 'production') {
  //   app.use(productionOptimizations)
  app.use('/api/', rateLimiter)
}

app.use('/api/auth', authRoutes)
app.use('/api/programs', programRoutes)
app.use('/api/users', userRoutes)
app.use('/api/scan', scanRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/findings', findingsRoutes)
app.use('/api/ai', aiRoutes)

app.get('/health', healthCheck)
app.get('/health/liveness', healthCheck)
app.get('/health/readiness', readinessCheck)
app.get('/metrics', getMetrics)
app.get('/health/metrics', getHealthMetrics)
app.get('/alerts', getAlerts)
app.get('/alerts/active', getActiveAlerts)
app.delete('/alerts/:id', clearAlert)

app.use(notFound)
app.use(errorHandler)

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`)
  
  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`)
  })
  
  socket.on('error', (error) => {
    logger.error(`Socket error: ${socket.id}`, error)
  })
})

// const sdk = new NodeSDK({
//   traceExporter: new OTLPTraceExporter({
//     url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
//   }),
//   instrumentations: getNodeAutoInstrumentations(),
// })
// 
// if (process.env.OTEL_ENABLED === 'true') {
//   sdk.start()
//   logger.info('OpenTelemetry SDK started')
// }
// 
server.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`)
  
  if (NODE_ENV === 'production') {
    startMonitoring()
  }
  
  // Start the autonomous orchestrator
  autonomousService.start()
})

server.on('error', (error: Error) => {
  logger.error('Server error:', error)
  process.exit(1)
})

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
  
  setTimeout(() => {
    logger.error('Force shutdown after timeout')
    process.exit(1)
  }, 10000)
})

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason)
  process.exit(1)
})