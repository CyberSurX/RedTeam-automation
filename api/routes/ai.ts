import { Router, type Request, type Response } from 'express'
import { aiService } from '../src/services/aiService.js'
import { AppDataSource } from '../src/config/database.js'
import { Finding } from '../src/entities/Finding.js'
import { asyncHandler } from '../src/middleware/errorHandler.js'

const router = Router()

// Manually trigger AI triage for a finding
router.post('/triage/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const findingRepo = AppDataSource.getRepository(Finding)

  const finding = await findingRepo.findOne({ where: { id: String(id) } })
  if (!finding) {
    return res.status(404).json({ success: false, message: 'Finding not found' })
  }

  const result = await aiService.analyzeFinding(finding as any)

  res.json({
    success: true,
    data: result
  })
}))

// Get AI scan summary
router.get('/scan-summary/:jobId', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params
  // Fetch logs or findings related to the scan to summarize
  // Simplified for now
  const summary = await aiService.summarizeScan(`Scan Job ${jobId} summary placeholder`)

  res.json({
    success: true,
    summary
  })
}))

export const aiRouter = router
