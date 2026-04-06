import Stripe from "stripe";

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_your");
}

// Lazy initialization of Stripe client
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
      typescript: true,
    });
  }
  return stripeClient;
}

// Export stripe for backward compatibility, but throw if used when not configured
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    if (!isStripeConfigured()) {
      throw new Error("Stripe is not configured");
    }
    return getStripe()[prop as keyof Stripe];
  },
});

// Price IDs for each plan (configure in Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  STARTER: process.env.STRIPE_PRICE_STARTER || "",
  GROWTH: process.env.STRIPE_PRICE_GROWTH || "",
  PRO: process.env.STRIPE_PRICE_PRO || "",
};

export function getPriceIdForPlan(plan: "STARTER" | "GROWTH" | "PRO"): string {
  return STRIPE_PRICE_IDS[plan];
}

export function getPlanFromPriceId(priceId: string): "STARTER" | "GROWTH" | "PRO" | null {
  if (priceId === STRIPE_PRICE_IDS.STARTER) return "STARTER";
  if (priceId === STRIPE_PRICE_IDS.GROWTH) return "GROWTH";
  if (priceId === STRIPE_PRICE_IDS.PRO) return "PRO";
  return null;
}
