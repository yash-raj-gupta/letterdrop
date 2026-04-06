import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type WebhookEvent =
  | "subscriber.created"
  | "subscriber.updated"
  | "subscriber.deleted"
  | "newsletter.sent"
  | "email.opened"
  | "email.clicked"
  | "tag.added"
  | "tag.removed";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Send webhooks for a specific event to all registered listeners
 */
export async function sendWebhooks(
  userId: string,
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId,
      isActive: true,
      events: {
        has: event,
      },
    },
  });

  if (webhooks.length === 0) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const promises = webhooks.map((webhook) =>
    deliverWebhook(webhook.id, webhook.url, webhook.secret, payload)
  );

  await Promise.allSettled(promises);
}

/**
 * Deliver a single webhook with retries
 */
async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<void> {
  const signature = generateSignature(payload, secret);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "X-Webhook-Timestamp": payload.timestamp,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Success - reset fail count and update last sent
      await prisma.webhook.update({
        where: { id: webhookId },
        data: {
          lastSentAt: new Date(),
          failCount: 0,
        },
      });
    } else {
      // Failed - increment fail count
      await incrementFailCount(webhookId);
      console.error(`Webhook delivery failed for ${url}: ${response.status}`);
    }
  } catch (error) {
    // Network error - increment fail count
    await incrementFailCount(webhookId);
    console.error(`Webhook delivery error for ${url}:`, error);
  }
}

/**
 * Increment webhook fail count and optionally disable if too many failures
 */
async function incrementFailCount(webhookId: string): Promise<void> {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook) return;

  const newFailCount = webhook.failCount + 1;
  const shouldDisable = newFailCount >= 10; // Disable after 10 consecutive failures

  await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      failCount: newFailCount,
      isActive: shouldDisable ? false : webhook.isActive,
    },
  });

  if (shouldDisable) {
    console.warn(`Webhook ${webhookId} disabled after ${newFailCount} failures`);
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: WebhookPayload, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest("hex")}`;
}

/**
 * Verify webhook signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(
    JSON.parse(payload),
    secret
  );
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
