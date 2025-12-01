import Stripe from 'stripe';

const stripe = new Stripe('YOUR_STRIPE_API_KEY', {
  apiVersion: '2024-11-20',
});

export const PRICING_TIERS = {
  free: { priceId: 'price_free', amount: 0, tier: 'free' },
  pro: { priceId: 'price_1234567890', amount: 2900, tier: 'pro' },
  enterprise: { priceId: 'price_0987654321', amount: 9900, tier: 'enterprise' },
};

export async function createCheckoutSession(tier: 'pro' | 'enterprise', email: string) {
  const tierConfig = tier === 'pro' ? PRICING_TIERS.pro : PRICING_TIERS.enterprise;
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: tier === 'pro' ? 'PINpall Pro' : 'PINpall Enterprise',
            description: tier === 'pro' 
              ? '500 parsów/miesiąc + API access' 
              : 'Unlimited parsów + White-label',
          },
          unit_amount: tierConfig.amount,
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.VITE_API_BASE || 'http://localhost:5000'}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.VITE_API_BASE || 'http://localhost:5000'}/settings`,
    customer_email: email,
    metadata: {
      tier,
    },
  });

  return session;
}

export async function getSubscriptionStatus(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
  });

  if (subscriptions.data.length === 0) return null;
  return subscriptions.data[0];
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

export { stripe };
