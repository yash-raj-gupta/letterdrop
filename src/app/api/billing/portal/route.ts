import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe/config";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * POST /api/billing/portal
 * Create a Stripe Customer Portal session for managing subscriptions.
 */
export async function POST(_request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return errorResponse("Stripe is not configured", 503);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return errorResponse("No billing account found. Please subscribe to a plan first.");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${APP_URL}/dashboard/billing`,
    });

    return successResponse({ url: portalSession.url });
  } catch (error) {
    return handleApiError(error);
  }
}
