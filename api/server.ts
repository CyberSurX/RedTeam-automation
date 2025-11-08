import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Import middleware
import { errorHandler, notFound, requestLogger, securityHeaders } from './middleware/errorHandler'
import { handleValidationErrors, sanitizeInput } from './middleware/validation'
import { compressionMiddleware, securityMiddleware, rateLimiter, productionOptimizations } from './middleware/performance'
import { startMonitoring } from './monitoring/alerts'

// Import routes
import authRoutes from './routes/auth'
import programRoutes from './routes/programs'
import userRoutes from './routes/users'

// Import monitoring endpoints
import { healthCheck, readinessCheck, livenessCheck } from './monitoring/health'
import { getMetrics, getHealthMetrics } from './monitoring/metrics'
import { getAlerts, getActiveAlerts, clearAlert } from './monitoring/alerts'

// Import utilities
import logger from './utils/logger'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1)

// Security middleware
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

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://redteam-automation.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean)

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))

// Performance middleware
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Request logging middleware
app.use(requestLogger)
app.use(securityHeaders)
app.use(productionOptimizations)

// Health check endpoints (no rate limiting)
app.get('/health', healthCheck)
app.get('/ready', readinessCheck)
app.get('/live', livenessCheck)

// Monitoring endpoints
app.get('/metrics', getMetrics)
app.get('/metrics/health', getHealthMetrics)
app.get('/alerts', getAlerts)
app.get('/alerts/active', getActiveAlerts)
app.delete('/alerts/:alertId', clearAlert)

// API routes with rate limiting
app.use('/api/auth', rateLimiter, authRoutes)
app.use('/api/programs', rateLimiter, programRoutes)
app.use('/api/users', rateLimiter, userRoutes)

// Socket.io for real-time features
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id })

  socket.on('join-program', (programId: string) => {
    socket.join(`program-${programId}`)
    logger.info('User joined program room', { socketId: socket.id, programId })
  })

  socket.on('leave-program', (programId: string) => {
    socket.leave(`program-${programId}`)
    logger.info('User left program room', { socketId: socket.id, programId })
  })

  socket.on('disconnect', () => {
    logger.info('User disconnected', { socketId: socket.id })
  })
})

// Error handling middleware (must be last)
app.use(notFound)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

// Start monitoring
startMonitoring()

// Start server
server.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`)
  logger.info(`Health check: http://localhost:${PORT}/health`)
  logger.info(`Metrics: http://localhost:${PORT}/metrics`)
})

export { io }