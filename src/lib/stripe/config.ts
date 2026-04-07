import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Get the Stripe client instance. Lazily initialized to avoid
 * errors when STRIPE_SECRET_KEY is not set.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment."
      );
    }
    _stripe = new Stripe(key, {
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * @deprecated Use getStripe() instead for lazy initialization.
 * This getter is kept for backward compatibility.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  STARTER: {
    name: "Starter",
    price: 9,
    priceId: process.env.STRIPE_PRICE_STARTER || "",
  },
  GROWTH: {
    name: "Growth",
    price: 29,
    priceId: process.env.STRIPE_PRICE_GROWTH || "",
  },
  PRO: {
    name: "Pro",
    price: 79,
    priceId: process.env.STRIPE_PRICE_PRO || "",
  },
} as const;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Get plan name from Stripe price ID.
 */
export function getPlanFromPriceId(priceId: string): string | null {
  for (const [plan, config] of Object.entries(PLANS)) {
    if (config.priceId === priceId) {
      return plan;
    }
  }
  return null;
}
