import { Router, type Request, type Response, type NextFunction } from 'express'
import { AppDataSource } from '../src/config/data-source.js'
import { User } from '../src/entities/User.js'
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

// GET all users (admin only in production, simplified here)
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userRepo = AppDataSource.getRepository(User)
  const users = await userRepo.find({ order: { created_at: 'DESC' } })
  const safeUsers = users.map(u => {
    const { password_hash, ...safe } = u
    return safe
  })
  res.json({ success: true, data: safeUsers })
}))

// GET single user
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userRepo = AppDataSource.getRepository(User)
  const user = await userRepo.findOne({ where: { id: req.params.id } })
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }
  const { password_hash, ...safe } = user
  res.json({ success: true, data: safe })
}))

export const usersRouter = router
