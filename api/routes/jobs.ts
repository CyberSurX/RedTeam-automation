import { Router, type Request, type Response, type NextFunction } from 'express'
import { AppDataSource } from '../src/config/data-source.js'
import { Job } from '../src/entities/Job.js'
import { asyncHandler } from '../src/middleware/errorHandler.js'

const router = Router()

const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) { res.status(500).json({ error: 'JWT_SECRET not configured' }); return }
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) { res.status(401).json({ error: 'Access token required' }); return }
  import('jsonwebtoken').then(jwt => {
    jwt.default.verify(token, JWT_SECRET, (err: unknown, decoded: unknown) => {
      if (err) { res.status(403).json({ error: 'Invalid or expired token' }); return }
      req.user = decoded as Request['user']
      next()
    })
  })
}

// GET all jobs
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const jobRepo = AppDataSource.getRepository(Job)
  const { status, type, page = 1, limit = 20 } = req.query
  const query = jobRepo.createQueryBuilder('job')
  if (status) query.andWhere('job.status = :status', { status })
  if (type) query.andWhere('job.job_type = :type', { type })
  const [jobs, total] = await query
    .orderBy('job.created_at', 'DESC')
    .skip((Number(page) - 1) * Number(limit))
    .take(Number(limit))
    .getManyAndCount()
  res.json({ success: true, data: jobs, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } })
}))

// GET single job
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const jobRepo = AppDataSource.getRepository(Job)
  const job = await jobRepo.findOne({ where: { id: req.params.id } })
  if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return }
  res.json({ success: true, data: job })
}))

// POST cancel job
router.post('/:id/cancel', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const jobRepo = AppDataSource.getRepository(Job)
  const job = await jobRepo.findOne({ where: { id: req.params.id } })
  if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return }
  if (job.status !== 'pending' && job.status !== 'running') {
    res.status(400).json({ success: false, message: 'Only pending or running jobs can be cancelled' }); return
  }
  job.status = 'cancelled'
  job.completed_at = new Date()
  const saved = await jobRepo.save(job)
  res.json({ success: true, data: saved })
}))

// GET queue stats
router.get('/queue/stats', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const jobRepo = AppDataSource.getRepository(Job)
  const pending = await jobRepo.count({ where: { status: 'pending' } })
  const running = await jobRepo.count({ where: { status: 'running' } })
  const completed = await jobRepo.count({ where: { status: 'completed' } })
  const failed = await jobRepo.count({ where: { status: 'failed' } })
  res.json({ success: true, data: { pending, running, completed, failed, total: pending + running + completed + failed } })
}))

export const jobsRouter = router
