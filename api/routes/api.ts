import { Router } from 'express';
import { authRouter } from './auth';
import { programsRouter } from './programs';
import { findingsRouter } from './findings';
import { scanRouter } from './scan';
import { statsRouter } from './stats';
import { aiRouter } from './ai';
import { usersRouter } from './users';

export const apiRouter = Router();

// Mount all routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/programs', programsRouter);
apiRouter.use('/findings', findingsRouter);
apiRouter.use('/scan', scanRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/users', usersRouter);

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
