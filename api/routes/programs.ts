import { Router, type Request, type Response, type NextFunction } from 'express'
import { AppDataSource } from '../src/config/data-source.js'
import { Program } from '../src/entities/Program.js'
import { asyncHandler } from '../src/middleware/errorHandler.js'
import { authorize } from '../src/middleware/authorize.js'
import jwt from 'jsonwebtoken'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }

  jwt.verify(token, JWT_SECRET, (err: unknown, user: unknown) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' })
      return
    }
    (req as any).user = user
    next()
  })
}

// GET all programs
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const programRepository = AppDataSource.getRepository(Program)
  const programs = await programRepository.find({
    order: { created_at: 'DESC' }
  })

  res.json({
    success: true,
    data: programs
  })
}))

// POST create new program - Admin only
router.post('/', authenticateToken, authorize(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const programRepository = AppDataSource.getRepository(Program)
  const { name, platform, url, scope, isAutomated, autoRecon, autoScan, autoReport } = req.body

  const program = new Program()
  program.name = name
  program.platform = platform
  program.program_id = url
  program.status = 'active'
  program.scopes = {
    in_scope: scope || [],
    out_of_scope: []
  }
  program.metadata = {
    url,
    isAutomated,
    autoRecon,
    autoScan,
    autoReport
  }

  const savedProgram = await programRepository.save(program)

  res.status(201).json({
    success: true,
    data: savedProgram
  })
}))

// PATCH update status - Admin and User
router.patch('/:id/status', authenticateToken, authorize(['admin', 'user']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  const programRepository = AppDataSource.getRepository(Program)
  const program = await programRepository.findOne({ where: { id: id as string } })

  if (!program) {
    res.status(404).json({ success: false, message: 'Program not found' })
    return
  }

  program.status = status
  await programRepository.save(program)

  res.json({ success: true, data: program })
}))

// DELETE program - Admin only
router.delete('/:id', authenticateToken, authorize(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const programRepository = AppDataSource.getRepository(Program)
  const result = await programRepository.delete(id)

  if (result.affected === 0) {
    res.status(404).json({ success: false, message: 'Program not found' })
    return
  }

  res.json({ success: true, message: 'Program deleted' })
}))

export const programsRouter = router
