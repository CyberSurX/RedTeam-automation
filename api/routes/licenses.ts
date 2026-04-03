import { Router, type Request, type Response } from 'express';
import { AppDataSource } from '../src/config/data-source.js';
import { License } from '../src/entities/License.js';
import { authenticate } from '../src/middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// Validate a license key from the system (Local check or via internet)
router.post('/validate', async (req: Request, res: Response) => {
    try {
        const { licenseKey, hardwareId } = req.body;

        if (!licenseKey) {
            return res.status(400).json({ error: 'License key is required' });
        }

        const licenseRepo = AppDataSource.getRepository(License);
        const license = await licenseRepo.findOne({
            where: { licenseKey: licenseKey }
        });

        if (!license) {
            return res.status(404).json({ error: 'Invalid license key' });
        }

        if (license.status !== 'active') {
            return res.status(403).json({ error: `License is ${license.status}` });
        }

        // Hardware locking logic (Node-locked licensing)
        if (hardwareId) {
            if (!license.hardwareId) {
                // First time activation on this hardware
                license.hardwareId = hardwareId;
                await licenseRepo.save(license);
            } else if (license.hardwareId !== hardwareId) {
                return res.status(403).json({ 
                    error: 'This license is already registered to another machine. Please contact support.' 
                });
            }
        }

        res.json({
            valid: true,
            tier: license.tier,
            status: license.status
        });
    } catch (error) {
        console.error('Error validating license:', error);
        res.status(500).json({ error: 'Failed to validate license' });
    }
});

// Admin/User routes to get their licenses
router.get('/my-licenses', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const licenseRepo = AppDataSource.getRepository(License);
        
        const licenses = await licenseRepo.find({
            where: { userId: userId },
            order: { createdAt: 'DESC' }
        });

        res.json(licenses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch licenses' });
    }
});

export const licenseRouter = router;
