import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLANS, isStripeConfigured } from "@/lib/stripe/config";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * POST /api/stripe/checkout-session
 * Create a Stripe Checkout session for plan upgrade.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return errorResponse("Stripe is not configured", 503);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return errorResponse("Invalid plan selected");
    }

    const planConfig = PLANS[plan as keyof typeof PLANS];

    if (!planConfig.priceId) {
      return errorResponse("Price ID not configured for this plan");
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, stripeCustomerId: true },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: session.user.id },
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: session.user.id,
        plan,
      },
    });

    return successResponse({ url: checkoutSession.url });
  } catch (error) {
    return handleApiError(error);
  }
}
