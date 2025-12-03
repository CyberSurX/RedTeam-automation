import { Router } from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  getProfile, 
  updateProfile,
  registerValidation,
  loginValidation
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;