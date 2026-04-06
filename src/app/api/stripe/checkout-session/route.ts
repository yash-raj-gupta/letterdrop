import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceIdForPlan, isStripeConfigured } from "@/lib/stripe/config";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    if (!isStripeConfigured()) {
      return errorResponse("Billing is not configured", 503);
    }

    const stripe = getStripe();

    const body = await request.json();
    const { plan } = body;

    if (!["STARTER", "GROWTH", "PRO"].includes(plan)) {
      return errorResponse("Invalid plan", 400);
    }

    const priceId = getPriceIdForPlan(plan);
    if (!priceId) {
      return errorResponse("Price not configured for this plan", 500);
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customerEmail = user.email || session.user.email || undefined;
      if (!customerEmail) {
        return errorResponse("User email is required", 400);
      }
      
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: user.name || undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;

      // Save customer ID to database
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/dashboard/settings?canceled=true`,
      subscription_data: {
        metadata: { userId: session.user.id },
      },
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
