import { Router, type Request, type Response } from 'express'

const router = Router()

// Minimal users route to satisfy server imports; replace with real implementation later
router.get('/', async (req: Request, res: Response): Promise<void> => {
  res.json({ users: [] })
})

export const usersRouter = router