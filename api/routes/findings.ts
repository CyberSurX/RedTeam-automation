import { Router, type Request, type Response } from 'express'
import { getRepository } from 'typeorm'
import { Finding } from '../src/entities/Finding'
import { asyncHandler } from '../middleware/errorHandler'
import { authorize } from '../middleware/authorize'
import { ExportService } from '../src/services/exportService'
import jwt from 'jsonwebtoken'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: Function): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' })
      return
    }
    req.user = user
    next()
  })
}

router.get('/export', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { format = 'json' } = req.query
  const findingRepository = getRepository(Finding)
  
  const findings = await findingRepository.find({
    relations: ['program']
  })

  if (format === 'csv') {
    const csv = ExportService.toCSV(findings)
    res.header('Content-Type', 'text/csv')
    res.attachment('findings-export.csv')
    return res.send(csv)
  }

  res.json({
    success: true,
    data: findings
  })
}))

router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { severity, status, search, page = 1, limit = 10 } = req.query
  
  const findingRepository = getRepository(Finding)
  const query = findingRepository.createQueryBuilder('finding')
    .leftJoinAndSelect('finding.program', 'program')
    .leftJoinAndSelect('finding.researcher', 'researcher')

  if (severity && severity !== 'all') {
    query.andWhere('finding.severity = :severity', { severity })
  }

  if (status && status !== 'all') {
    query.andWhere('finding.status = :status', { status })
  }

  if (search) {
    query.andWhere('(finding.title ILIKE :search OR finding.description ILIKE :search)', { search: `%${search}%` })
  }

  const [findings, total] = await query
    .orderBy('finding.created_at', 'DESC')
    .skip((Number(page) - 1) * Number(limit))
    .take(Number(limit))
    .getManyAndCount()

  // Transform to match frontend interface if needed
  const transformedFindings = findings.map(f => ({
    id: f.id,
    programId: f.program?.id,
    programName: f.program?.name || 'N/A',
    title: f.title,
    description: f.description,
    severity: f.severity,
    confidence: f.metadata?.confidence || 100,
    status: f.status,
    type: f.type,
    target: f.metadata?.target || 'N/A',
    cvss: f.getCvssScore(),
    createdAt: f.created_at,
    updatedAt: f.updated_at,
    reporter: f.researcher?.name || 'System',
    evidence: f.screenshots || []
  }))

  res.json({
    success: true,
    data: transformedFindings,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  })
}))

// Triage update endpoint - Only Admins and Researchers (users) can triage
router.patch('/:id/status', authenticateToken, authorize(['admin', 'user']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body
  
  const findingRepository = getRepository(Finding)
  const finding = await findingRepository.findOne({ where: { id } })
  
  if (!finding) {
    res.status(404).json({ success: false, message: 'Finding not found' })
    return
  }
  
  finding.status = status
  finding.triaged_at = new Date()
  // In a real app, we'd set triage_by to req.user.id
  
  await findingRepository.save(finding)
  
  res.json({ success: true, data: finding })
}))

export default router
