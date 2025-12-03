import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import middleware
import { errorHandler, notFound, requestLogger, securityHeaders } from '../middleware/errorHandler';
import { rateLimiter, productionOptimizations } from '../middleware/performance';
import { startMonitoring } from '../monitoring/alerts';

// Import routes
import authRoutes from './routes/auth';
import programRoutes from './routes/programs';
import userRoutes from './routes/users';

// Import monitoring endpoints
import { healthCheck, readinessCheck, livenessCheck } from '../monitoring/health';
import { getMetrics, getHealthMetrics } from '../monitoring/metrics';
import { getAlerts, getActiveAlerts, clearAlert } from '../monitoring/alerts';

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy
app.set('trust proxy', 1);

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
}));

// CORS configuration
const corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://redteam-automation.vercel.app',
            process.env.FRONTEND_URL,
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Performance middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Request logging middleware
app.use(requestLogger);
app.use(securityHeaders);
app.use(productionOptimizations);

// Health check endpoints
app.get('/health', healthCheck);
app.get('/ready', readinessCheck);
app.get('/live', livenessCheck);

// Monitoring endpoints
app.get('/metrics', getMetrics);
app.get('/metrics/health', getHealthMetrics);
app.get('/alerts', getAlerts);
app.get('/alerts/active', getActiveAlerts);
app.delete('/alerts/:alertId', clearAlert);

// API routes
app.use('/api/auth', rateLimiter, authRoutes);
app.use('/api/programs', rateLimiter, programRoutes);
app.use('/api/users', rateLimiter, userRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start monitoring
startMonitoring();

export { app };
