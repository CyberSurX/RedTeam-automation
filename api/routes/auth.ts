import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { getRepository } from 'typeorm'
import { User } from '../src/entities/User'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2, max: 50 }),
]

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
]

const generateToken = (user: User): string => {
  const payload = { id: user.id, email: user.email, role: user.role }
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN }
  return jwt.sign(payload, JWT_SECRET, options)
}

const authenticate = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

router.post('/register', authLimiter, validateRegister, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() })
      return
    }

    const { email, password, name } = req.body
    const userRepository = getRepository(User)
    
    const existingUser = await userRepository.findOne({ where: { email } })
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' })
      return
    }

    const newUser = userRepository.create({
      email,
      name,
      password_hash: password, // Logic in User entity handles hashing
      role: 'user'
    })

    await userRepository.save(newUser)

    const token = generateToken(newUser)
    res.status(201).json({ token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', authLimiter, validateLogin, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() })
      return
    }

    const { email, password } = req.body
    const userRepository = getRepository(User)
    
    const user = await userRepository.findOne({ where: { email } })
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const isMatch = await user.validatePassword(password)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = generateToken(user)
    res.json({ token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRepository = getRepository(User)
    const user = await userRepository.findOne({ 
      where: { id: req.user.id },
      select: ['id', 'email', 'name', 'role']
    })
    
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/logout', authenticate, (req: Request, res: Response) => {
  res.status(200).json({ message: 'Logout successful' })
})

export default router