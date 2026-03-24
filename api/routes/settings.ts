import { Router, type Request, type Response, type NextFunction } from 'express'
import { AppDataSource } from '../src/config/data-source.js'
import { ApiKey } from '../src/entities/ApiKey.js'
import { User } from '../src/entities/User.js'
import { asyncHandler } from '../src/middleware/errorHandler.js'
import crypto from 'crypto'

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

// GET user profile
router.get('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userRepo = AppDataSource.getRepository(User)
  const user = await userRepo.findOne({ where: { id: req.user?.id } })
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }
  const { password_hash, ...profile } = user
  res.json({ success: true, data: profile })
}))

// PUT update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userRepo = AppDataSource.getRepository(User)
  const user = await userRepo.findOne({ where: { id: req.user?.id } })
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }
  const { name, email, preferences } = req.body
  if (name) user.name = name
  if (email) user.email = email
  if (preferences) user.preferences = preferences
  const saved = await userRepo.save(user)
  const { password_hash, ...profile } = saved
  res.json({ success: true, data: profile })
}))

// GET list API keys
router.get('/api-keys', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const keyRepo = AppDataSource.getRepository(ApiKey)
  const keys = await keyRepo.find({
    where: { user_id: req.user?.id },
    order: { created_at: 'DESC' }
  })
  const safeKeys = keys.map(k => ({
    id: k.id,
    name: k.name,
    platform: k.permissions?.platform || 'custom',
    key: k.key_preview,
    status: k.is_active && !k.isExpired() ? 'active' : (k.isExpired() ? 'expired' : 'inactive'),
    createdAt: k.created_at,
    lastUsed: k.last_used_at,
    permissions: Object.keys(k.permissions || {}).filter(p => k.permissions?.[p])
  }))
  res.json({ success: true, data: safeKeys })
}))

// POST create API key
router.post('/api-keys', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { name, key, platform, permissions } = req.body
  if (!name || !key) { res.status(400).json({ success: false, message: 'Name and key are required' }); return }
  const keyRepo = AppDataSource.getRepository(ApiKey)
  const apiKey = new ApiKey()
  apiKey.user_id = req.user!.id
  apiKey.name = name
  apiKey.key_preview = key.slice(0, 8) + '...' + key.slice(-4)
  apiKey.key_hash = crypto.createHash('sha256').update(key).digest('hex')
  apiKey.permissions = { platform: platform || 'custom', ...(permissions || {}) }
  apiKey.is_active = true
  const saved = await keyRepo.save(apiKey)
  res.status(201).json({ success: true, data: { id: saved.id, name: saved.name, key: saved.key_preview, status: 'active', createdAt: saved.created_at } })
}))

// DELETE API key
router.delete('/api-keys/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const keyRepo = AppDataSource.getRepository(ApiKey)
  const result = await keyRepo.delete({ id: req.params.id, user_id: req.user?.id })
  if (result.affected === 0) { res.status(404).json({ success: false, message: 'API key not found' }); return }
  res.json({ success: true, message: 'API key deleted' })
}))

// PATCH toggle API key
router.patch('/api-keys/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const keyRepo = AppDataSource.getRepository(ApiKey)
  const key = await keyRepo.findOne({ where: { id: req.params.id, user_id: req.user?.id } })
  if (!key) { res.status(404).json({ success: false, message: 'API key not found' }); return }
  key.is_active = req.body.is_active !== undefined ? req.body.is_active : !key.is_active
  const saved = await keyRepo.save(key)
  res.json({ success: true, data: { id: saved.id, is_active: saved.is_active } })
}))

// GET security settings (stored in user preferences)
router.get('/security', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userRepo = AppDataSource.getRepository(User)
  const user = await userRepo.findOne({ where: { id: req.user?.id } })
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }
  const securitySettings = (user.preferences as Record<string, unknown>)?.security || {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    rateLimiting: true,
    dataEncryption: true,
    auditLogging: true
  }
  res.json({ success: true, data: securitySettings })
}))

// PUT update security settings
router.put('/security', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userRepo = AppDataSource.getRepository(User)
  const user = await userRepo.findOne({ where: { id: req.user?.id } })
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }
  user.preferences = { ...(user.preferences as Record<string, unknown> || {}), security: req.body }
  await userRepo.save(user)
  res.json({ success: true, data: req.body })
}))

export const settingsRouter = router
