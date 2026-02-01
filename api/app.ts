/**
 * API Server for RedTeam-automation
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'

// Load environment variables
dotenv.config()

const app: express.Application = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Body parsing with size limits
app.use(express.json({ 
  limit: process.env.MAX_REQUEST_SIZE || '10mb',
  verify: (req: Request, res: Response, buf: Buffer) => {
    try {
      JSON.parse(buf.toString())
    } catch {
      throw new Error('Invalid JSON payload')
    }
  }
}))

app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_REQUEST_SIZE || '10mb',
  parameterLimit: 100
}))

// Compression
app.use(compression())

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

/**
 * 404 handler for undefined routes
 */
app.use('/api/*', (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
  })
})

/**
 * Global error handler middleware
 */
app.use((error: Error, req: Request, res: Response): void => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  })

  const statusCode = error.message === 'Invalid JSON payload' ? 400 : 500
  
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal server error' : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  })
})

/**
 * Graceful shutdown handler
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  process.exit(0)
})

export default app