import { Router, type Request, type Response } from 'express';
import { AppDataSource } from '../src/config/data-source.js';
import { Domain } from '../src/entities/Domain.js';
import { authenticate } from '../src/middleware/auth.js';
import crypto from 'crypto';
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const router = Router();

// Apply auth middleware to all domain routes
router.use(authenticate);

// Get all domains for user
router.get('/', async (req: Request, res: Response) => {
    try {
        const domainRepository = AppDataSource.getRepository(Domain);
        const domains = await domainRepository.find({
            where: { userId: (req as any).user.id },
            order: { createdAt: 'DESC' }
        });
        res.json(domains);
    } catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ error: 'Failed to fetch domains' });
    }
});

// Add a new domain
router.post('/', async (req: Request, res: Response) => {
    try {
        const { domainName } = req.body;
        
        if (!domainName || typeof domainName !== 'string') {
            return res.status(400).json({ error: 'Valid domain name is required' });
        }

        // Basic domain validation
        const cleanDomain = domainName.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

        const domainRepository = AppDataSource.getRepository(Domain);
        
        // Check if already exists for this user
        const existing = await domainRepository.findOne({
            where: { domain: cleanDomain, userId: (req as any).user.id }
        });

        if (existing) {
            return res.status(400).json({ error: 'Domain already added' });
        }

        // Generate verification token
        const token = `cybersurhub-verify-${crypto.randomBytes(16).toString('hex')}`;

        const domain = new Domain();
        domain.domain = cleanDomain;
        domain.userId = (req as any).user.id;
        domain.verificationToken = token;
        domain.status = 'pending';

        await domainRepository.save(domain);

        res.status(201).json(domain);
    } catch (error) {
        console.error('Error adding domain:', error);
        res.status(500).json({ error: 'Failed to add domain' });
    }
});

// Verify domain
router.post('/:id/verify', async (req: Request, res: Response) => {
    try {
        const domainRepository = AppDataSource.getRepository(Domain);
        const domain = await domainRepository.findOne({
            where: { id: req.params.id, userId: (req as any).user.id }
        });

        if (!domain) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        if (domain.status === 'verified') {
            return res.json({ message: 'Domain already verified', domain });
        }

        // Perform DNS TXT lookup
        let isVerified = false;
        try {
            const records = await resolveTxt(domain.domain);
            // records is an array of arrays of strings
            for (const recordArray of records) {
                for (const txt of recordArray) {
                    if (txt === domain.verificationToken) {
                        isVerified = true;
                        break;
                    }
                }
                if (isVerified) break;
            }
        } catch (dnsError) {
            console.error(`DNS lookup failed for ${domain.domain}:`, dnsError);
            return res.status(400).json({ 
                error: 'Verification failed. Could not find the TXT record. Please ensure you have added it to your DNS settings and wait a few minutes for propagation.' 
            });
        }

        if (isVerified) {
            domain.status = 'verified';
            domain.verifiedAt = new Date();
            await domainRepository.save(domain);
            res.json({ message: 'Domain successfully verified', domain });
        } else {
            res.status(400).json({ 
                error: 'Verification failed. TXT record not found or does not match.' 
            });
        }
    } catch (error) {
        console.error('Error verifying domain:', error);
        res.status(500).json({ error: 'Failed to verify domain' });
    }
});

// Delete domain
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const domainRepository = AppDataSource.getRepository(Domain);
        const domain = await domainRepository.findOne({
            where: { id: req.params.id, userId: (req as any).user.id }
        });

        if (!domain) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        await domainRepository.remove(domain);
        res.json({ message: 'Domain deleted successfully' });
    } catch (error) {
        console.error('Error deleting domain:', error);
        res.status(500).json({ error: 'Failed to delete domain' });
    }
});

export const domainsRouter = router;
