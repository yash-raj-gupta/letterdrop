import { NextRequest } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/config";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook Error]", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as any;
        const userId = checkoutSession.metadata?.userId;
        const plan = checkoutSession.metadata?.plan;

        if (!userId || !plan) {
          console.error("[Stripe Webhook] Missing metadata");
          break;
        }

        const subscriptionId = checkoutSession.subscription;
        if (typeof subscriptionId !== "string") {
          console.error("[Stripe Webhook] Invalid subscription ID");
          break;
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: subscriptionId,
            plan: plan as "STARTER" | "GROWTH" | "PRO",
            subscriptionStatus: "ACTIVE",
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string | undefined;

        if (!subscriptionId) break;

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { subscriptionStatus: "ACTIVE" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string | undefined;

        if (!subscriptionId) break;

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { subscriptionStatus: "PAST_DUE" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        if (typeof subscriptionId !== "string") break;

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { subscriptionStatus: "PAST_DUE" },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: subscription.status.toUpperCase() as any,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
            stripePriceId: subscription.items?.data?.[0]?.price?.id || null,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: "FREE",
            subscriptionStatus: "CANCELED",
            stripeSubscriptionId: null,
            stripePriceId: null,
          },
        });
        break;
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[Stripe Webhook Processing Error]", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
