import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, getPlanFromPriceId } from "@/lib/stripe/config";
import type Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events for subscription lifecycle.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = priceId ? getPlanFromPriceId(priceId) : null;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const periodEnd = (subscription as any).current_period_end as number | undefined;

          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              subscriptionStatus: "ACTIVE",
              plan: (plan as "STARTER" | "GROWTH" | "PRO") || "STARTER",
              ...(periodEnd
                ? { currentPeriodEnd: new Date(periodEnd * 1000) }
                : {}),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : null;

        const statusMap: Record<string, string> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          unpaid: "UNPAID",
          trialing: "TRIALING",
          incomplete: "INCOMPLETE",
          incomplete_expired: "INCOMPLETE_EXPIRED",
          paused: "PAUSED",
        };

        const subscriptionStatus =
          statusMap[subscription.status] || "INCOMPLETE";

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripePriceId: priceId,
            subscriptionStatus: subscriptionStatus as
              | "ACTIVE"
              | "PAST_DUE"
              | "CANCELED"
              | "UNPAID"
              | "TRIALING"
              | "INCOMPLETE"
              | "INCOMPLETE_EXPIRED"
              | "PAUSED",
            ...(plan ? { plan: plan as "STARTER" | "GROWTH" | "PRO" } : {}),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...((subscription as any).current_period_end
              ? {
                  currentPeriodEnd: new Date(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (subscription as any).current_period_end * 1000
                  ),
                }
              : {}),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: "CANCELED",
            plan: "FREE",
            stripeSubscriptionId: null,
            stripePriceId: null,
            currentPeriodEnd: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "PAST_DUE" },
        });
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
