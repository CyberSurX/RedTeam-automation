/**
 * Complete authentication API implementation with JWT, bcrypt, and security best practices
 * Handles user registration, login, logout, and profile management
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'

const router = Router()

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const BCRYPT_ROUNDS = 12

// Database interface (to be replaced with actual database calls)
interface User {
  id: string
  email: string
  name: string
  password_hash: string
  role: 'admin' | 'user' | 'viewer'
  created_at: Date
  updated_at: Date
}

// Mock database (replace with actual database integration)
const users: User[] = []

/**
 * Input validation middleware
 */
const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('name').trim().isLength({ min: 2, max: 50 }),
]

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
]

/**
 * Generate JWT token
 */
const generateToken = (user: User): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', authLimiter, validateRegister, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      })
      return
    }

    const { email, password, name } = req.body

    // Check if user already exists
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' })
      return
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // Create new user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      password_hash: passwordHash,
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    }

    users.push(newUser)

    // Generate JWT token
    const token = generateToken(newUser)

    // Remove password hash from response
    const { password_hash, ...userResponse } = newUser

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', authLimiter, validateLogin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      })
      return
    }

    const { email, password } = req.body

    // Find user
    const user = users.find(u => u.email === email)
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Generate JWT token
    const token = generateToken(user)

    // Remove password hash from response
    const { password_hash, ...userResponse } = user

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * User Profile
 * GET /api/auth/profile
 */
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
    
    // Find user
    const user = users.find(u => u.id === decoded.id)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Remove password hash from response
    const { password_hash, ...userResponse } = user

    res.json({ user: userResponse })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
    console.error('Profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real implementation, you might want to:
    // 1. Add token to a blacklist
    // 2. Clear client-side cookies
    // 3. Log the logout event
    
    res.json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
