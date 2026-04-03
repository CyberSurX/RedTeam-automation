import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { AppDataSource } from '../src/config/data-source.js';
import { Subscription } from '../src/entities/Subscription.js';
import { User } from '../src/entities/User.js';
import { License } from '../src/entities/License.js';
import { authenticate } from '../src/middleware/auth.js';
import crypto from 'crypto';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2023-10-16' as any
});

function generateLicenseKey(tier: string) {
    const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase();
    const prefix = tier === 'enterprise' ? 'RTA-ENT' : tier === 'pro' ? 'RTA-PRO' : 'RTA-BSC';
    return `${prefix}-${randomHex.slice(0,4)}-${randomHex.slice(4,8)}-${randomHex.slice(8,12)}`;
}

// Create a checkout session (For Lifetime License Sales)
router.post('/create-checkout-session', authenticate, async (req: Request, res: Response) => {
    try {
        const { planId, tier = 'pro' } = req.body; // e.g. price_12345
        const user = (req as any).user;

        if (!planId) {
            return res.status(400).json({ error: 'planId is required' });
        }

        // Convert subscription mode to payment mode for Lifetime Deals
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment', // One-time payment instead of 'subscription'
            customer_email: user.email,
            client_reference_id: user.id,
            metadata: {
                tier: tier // pass the tier to webhook
            },
            line_items: [
                {
                    price: planId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message || 'Failed to create checkout session' });
    }
});

// Handle Stripe webhooks
router.post('/webhook', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (!endpointSecret) {
            event = req.body;
        } else {
            event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
        }
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        const licenseRepo = AppDataSource.getRepository(License);
        const userRepo = AppDataSource.getRepository(User);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const paymentIntentId = session.payment_intent as string;
                
                if (userId && session.payment_status === 'paid') {
                    const tier = session.metadata?.tier || 'pro';
                    
                    // Create new lifetime license
                    const license = new License();
                    license.userId = userId;
                    license.tier = tier as any;
                    license.status = 'active';
                    license.stripePaymentIntentId = paymentIntentId;
                    license.licenseKey = generateLicenseKey(tier);
                    
                    await licenseRepo.save(license);
                    console.log(`✅ Generated new lifetime license: ${license.licenseKey} for user ${userId}`);
                }
                break;
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

export const billingRouter = router;
