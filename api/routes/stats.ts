// @ts-nocheck
import { Router, type Request, type Response, type NextFunction } from 'express'
import { getRepository } from 'typeorm'
import { Program } from '../src/entities/Program'
import { Finding } from '../src/entities/Finding'
import { asyncHandler } from '../middleware/errorHandler'
import jwt from 'jsonwebtoken'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

// Authentication middleware (mirrored from other routes)
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
    (req as Record<string, unknown>).user = user
    next()
  })
}

router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const programRepository = getRepository(Program)
  const findingRepository = getRepository(Finding)

  // 1. Total Programs
  const totalPrograms = await programRepository.count()

  // 2. Total Findings
  const totalFindings = await findingRepository.count()

  // 3. Revenue Estimation
  const findings = await findingRepository.find({
    select: ['estimated_reward', 'actual_reward', 'severity'] // Added 'severity' for critical findings calculation
  })

  const totalRevenue = findings.reduce((acc: number, current: Pick<Finding, 'actual_reward' | 'estimated_reward'>) => {
    return acc + (Number(current.actual_reward) || Number(current.estimated_reward) || 0)
  }, 0)

  // 4. Critical Findings (Bonus for WOW effect)
  const criticalFindings = findings.filter((f: Pick<Finding, 'severity'>) => f.severity === 'critical').length;

  res.json({
    success: true,
    data: {
      programs: totalPrograms,
      findings: totalFindings,
      revenue: totalRevenue,
      criticalFindings,
      lastUpdated: new Date().toISOString()
    }
  })
}))

export const statsRouter = router
