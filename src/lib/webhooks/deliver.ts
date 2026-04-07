import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

interface WebhookPayload {
  url: string;
  secret: string;
  event: string;
  data: Record<string, unknown>;
}

/**
 * Deliver a webhook to a URL with HMAC signature verification.
 */
export async function deliverWebhook(payload: WebhookPayload): Promise<boolean> {
  const { url, secret, event, data } = payload;

  const body = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  // Create HMAC signature
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event,
      },
      body,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(
        `[Webhook] Delivery failed to ${url}: ${response.status} ${response.statusText}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Webhook] Delivery error to ${url}:`, error);
    return false;
  }
}

/**
 * Deliver an event to all active webhooks for a user that listen for the event.
 */
export async function deliverUserWebhooks(
  userId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const success = await deliverWebhook({
          url: webhook.url,
          secret: webhook.secret,
          event,
          data,
        });

        if (success) {
          // Reset fail count on success
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              lastSentAt: new Date(),
              failCount: 0,
            },
          });
        } else {
          // Increment fail count
          const updated = await prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              failCount: { increment: 1 },
            },
          });

          // Disable webhook after 10 consecutive failures
          if (updated.failCount >= 10) {
            await prisma.webhook.update({
              where: { id: webhook.id },
              data: { isActive: false },
            });
            console.warn(
              `[Webhook] Disabled webhook ${webhook.id} after ${updated.failCount} consecutive failures`
            );
          }
        }
      })
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.error(
        `[Webhook] ${failed}/${webhooks.length} webhook deliveries failed for event "${event}"`
      );
    }
  } catch (error) {
    console.error("[Webhook] Error delivering user webhooks:", error);
  }
}

/**
 * Common webhook events.
 */
export const WEBHOOK_EVENTS = {
  SUBSCRIBER_CREATED: "subscriber.created",
  SUBSCRIBER_DELETED: "subscriber.deleted",
  SUBSCRIBER_UNSUBSCRIBED: "subscriber.unsubscribed",
  NEWSLETTER_SENT: "newsletter.sent",
  EMAIL_OPENED: "email.opened",
  EMAIL_CLICKED: "email.clicked",
  TAG_ADDED: "tag.added",
  TAG_REMOVED: "tag.removed",
} as const;
