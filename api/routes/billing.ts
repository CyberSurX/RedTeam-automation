import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { AppDataSource } from '../src/config/data-source.js';
import { Subscription } from '../src/entities/Subscription.js';
import { User } from '../src/entities/User.js';
import { authenticate } from '../src/middleware/auth.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2023-10-16' as any
});

// Create a checkout session
router.post('/create-checkout-session', authenticate, async (req: Request, res: Response) => {
    try {
        const { planId } = req.body; // e.g. price_12345
        const user = (req as any).user;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: user.email,
            client_reference_id: user.id,
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
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Handle Stripe webhooks
router.post('/webhook', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Using express.raw() in server.ts for this route is required to get raw body
        if (!endpointSecret) {
            // For testing without webhook secret
            event = req.body;
        } else {
            event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
        }
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        const subscriptionRepo = AppDataSource.getRepository(Subscription);
        const userRepo = AppDataSource.getRepository(User);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                
                if (userId) {
                    const subscription = new Subscription();
                    subscription.userId = userId;
                    subscription.stripeCustomerId = session.customer as string;
                    subscription.stripeSubscriptionId = session.subscription as string;
                    subscription.status = 'active';
                    subscription.planId = 'pro_plan'; // Should map from Stripe product
                    subscription.scanQuota = 100; // Define based on plan
                    
                    await subscriptionRepo.save(subscription);
                }
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const stripeSub = event.data.object as Stripe.Subscription;
                const subscription = await subscriptionRepo.findOne({
                    where: { stripeSubscriptionId: stripeSub.id }
                });

                if (subscription) {
                    subscription.status = stripeSub.status;
                    subscription.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
                    await subscriptionRepo.save(subscription);
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
