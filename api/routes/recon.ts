import { Router, type Request, type Response, type NextFunction } from 'express'
import { AppDataSource } from '../src/config/data-source.js'
import { asyncHandler } from '../src/middleware/errorHandler.js'

const router = Router()

interface ReconJob {
  id: string
  target: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt: string | null
  results: Record<string, unknown>
}

const reconJobs: Map<string, ReconJob> = new Map()

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

// GET all recon jobs
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const jobs = Array.from(reconJobs.values()).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  res.json({ success: true, data: jobs })
}))

// POST start recon
router.post('/start', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { target, type, modules } = req.body
  if (!target) { res.status(400).json({ success: false, message: 'Target is required' }); return }
  const jobId = `recon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const job: ReconJob = {
    id: jobId,
    target,
    type: type || 'full',
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
    results: { subdomains: [], ports: [], technologies: [], endpoints: [] }
  }
  reconJobs.set(jobId, job)
  setTimeout(() => {
    const j = reconJobs.get(jobId)
    if (j) {
      j.status = 'completed'
      j.completedAt = new Date().toISOString()
      j.results = {
        subdomains: [`www.${target}`, `api.${target}`, `mail.${target}`],
        ports: [80, 443, 22, 3306],
        technologies: ['nginx', 'React', 'PostgreSQL'],
        endpoints: ['/api', '/login', '/admin', '/health']
      }
    }
  }, 3000)
  res.status(201).json({ success: true, data: job })
}))

// GET recon job status
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const job = reconJobs.get(req.params.id)
  if (!job) { res.status(404).json({ success: false, message: 'Recon job not found' }); return }
  res.json({ success: true, data: job })
}))

// POST abort recon
router.post('/:id/abort', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const job = reconJobs.get(req.params.id)
  if (!job) { res.status(404).json({ success: false, message: 'Recon job not found' }); return }
  job.status = 'failed'
  job.completedAt = new Date().toISOString()
  res.json({ success: true, data: job })
}))

export const reconRouter = router
