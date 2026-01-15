import { Router } from 'express';
import { 
  getPrograms, 
  getProgram, 
  createProgram, 
  updateProgram, 
  deleteProgram, 
  getProgramStats,
  programValidation
} from '../controllers/programsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Program routes
router.get('/', getPrograms);
router.post('/', programValidation, createProgram);
router.get('/:id', getProgram);
router.put('/:id', programValidation, updateProgram);
router.delete('/:id', deleteProgram);
router.get('/:id/stats', getProgramStats);

export default router;