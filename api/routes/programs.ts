/**
 * Program management API endpoints
 * CRUD operations for bug bounty programs with authentication and validation
 */
import { Router, type Request, type Response } from 'express'
import { body, param, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'

const router = Router()

// Rate limiting for program endpoints
const programLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// JWT configuration
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

// Role-based authorization middleware
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }
}

// Mock database (replace with actual TypeORM integration)
interface Program {
  id: string
  name: string
  description: string
  platform: string
  program_id: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  type: 'public' | 'private' | 'invite_only'
  created_by: string
  created_at: Date
  updated_at: Date
}

const programs: Program[] = []

/**
 * Get all programs with pagination and filtering
 * GET /api/programs
 */
router.get('/', programLimiter, authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const status = req.query.status as string
    const platform = req.query.platform as string
    const search = req.query.search as string

    let filteredPrograms = programs

    // Apply filters
    if (status) {
      filteredPrograms = filteredPrograms.filter(p => p.status === status)
    }
    if (platform) {
      filteredPrograms = filteredPrograms.filter(p => p.platform === platform)
    }
    if (search) {
      filteredPrograms = filteredPrograms.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex)

    res.json({
      programs: paginatedPrograms,
      pagination: {
        page,
        limit,
        total: filteredPrograms.length,
        pages: Math.ceil(filteredPrograms.length / limit)
      }
    })
  } catch (error) {
    console.error('Get programs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Create new program
 * POST /api/programs
 */
router.post('/', authenticateToken, requireRole(['admin', 'user']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, platform, program_id } = req.body

    // Check if program already exists
    const existingProgram = programs.find(p => p.program_id === program_id && p.platform === platform)
    if (existingProgram) {
      res.status(409).json({ error: 'Program already exists' })
      return
    }

    // Create new program
    const newProgram: Program = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description: description || '',
      platform,
      program_id,
      status: 'active',
      type: 'public',
      created_by: (req as any).user?.id || 'system',
      created_at: new Date(),
      updated_at: new Date()
    }

    programs.push(newProgram)

    res.status(201).json({
      message: 'Program created successfully',
      program: newProgram
    })
  } catch (error) {
    console.error('Create program error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router