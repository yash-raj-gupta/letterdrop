import { prisma } from "@/lib/prisma";
import { sendWebhooks } from "@/lib/webhooks/deliver";
import { sendEmail } from "@/lib/email/sender";
import { AutomationTrigger, AutomationActionType } from "@/generated/prisma/enums";

/**
 * Trigger automation workflows based on subscriber events
 */
export async function triggerAutomations(
  userId: string,
  trigger: AutomationTrigger,
  triggerData: Record<string, any>
): Promise<void> {
  const automations = await prisma.automation.findMany({
    where: {
      userId,
      trigger,
      isActive: true,
    },
    include: {
      actions: {
        orderBy: { order: "asc" },
      },
    },
  });

  for (const automation of automations) {
    // Check if trigger data matches (e.g., specific tag)
    if (!matchesTriggerData(automation.triggerData, triggerData)) {
      continue;
    }

    // Execute actions
    await executeAutomationActions(automation, triggerData);
  }
}

/**
 * Check if trigger data matches automation trigger configuration
 */
function matchesTriggerData(
  config: Record<string, any>,
  data: Record<string, any>
): boolean {
  // For tag-based triggers, check if the specific tag is in the config
  if (config.tagId && data.tagId !== config.tagId) {
    return false;
  }

  // For newsletter-based triggers, check newsletter ID
  if (config.newsletterId && data.newsletterId !== config.newsletterId) {
    return false;
  }

  // For link click triggers, check if URL matches
  if (config.url && data.url !== config.url) {
    return false;
  }

  return true;
}

/**
 * Execute all actions in an automation
 */
async function executeAutomationActions(
  automation: any,
  triggerData: Record<string, any>
): Promise<void> {
  const subscriberId = triggerData.subscriberId;

  if (!subscriberId) {
    console.warn("Automation triggered without subscriberId", automation.id);
    return;
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    include: {
      tags: { include: { tag: true } },
      user: true,
    },
  });

  if (!subscriber || subscriber.status !== "ACTIVE") {
    return;
  }

  for (const action of automation.actions) {
    // Handle delay
    if (action.delayHours > 0) {
      await scheduleDelayedAction(action, subscriber, triggerData);
      continue;
    }

    await executeAction(action, subscriber, triggerData);
  }
}

/**
 * Execute a single automation action
 */
async function executeAction(
  action: any,
  subscriber: any,
  triggerData: Record<string, any>
): Promise<void> {
  switch (action.type) {
    case "SEND_EMAIL":
      await executeSendEmail(action, subscriber);
      break;
    case "ADD_TAG":
      await executeAddTag(action, subscriber);
      break;
    case "REMOVE_TAG":
      await executeRemoveTag(action, subscriber);
      break;
    case "WAIT":
      // Wait actions are handled by delayHours, this is a no-op for immediate
      break;
    case "WEBHOOK":
      await executeWebhook(action, subscriber, triggerData);
      break;
  }
}

/**
 * Execute send email action
 */
async function executeSendEmail(action: any, subscriber: any): Promise<void> {
  const config = action.config as {
    subject?: string;
    content?: string;
    templateId?: string;
  };

  if (!config.subject || !config.content) {
    console.error("Send email action missing subject or content", action.id);
    return;
  }

  const htmlContent = config.content
    .replace(/{{name}}/g, subscriber.name || "there")
    .replace(/{{email}}/g, subscriber.email);

  await sendEmail({
    to: subscriber.email,
    subject: config.subject,
    html: htmlContent,
  });
}

/**
 * Execute add tag action
 */
async function executeAddTag(action: any, subscriber: any): Promise<void> {
  const config = action.config as { tagId?: string };

  if (!config.tagId) {
    console.error("Add tag action missing tagId", action.id);
    return;
  }

  const existingTag = subscriber.tags.find(
    (t: any) => t.tagId === config.tagId
  );

  if (existingTag) return;

  await prisma.subscriberTag.create({
    data: {
      subscriberId: subscriber.id,
      tagId: config.tagId,
    },
  });
}

/**
 * Execute remove tag action
 */
async function executeRemoveTag(action: any, subscriber: any): Promise<void> {
  const config = action.config as { tagId?: string };

  if (!config.tagId) {
    console.error("Remove tag action missing tagId", action.id);
    return;
  }

  await prisma.subscriberTag.deleteMany({
    where: {
      subscriberId: subscriber.id,
      tagId: config.tagId,
    },
  });
}

/**
 * Execute webhook action
 */
async function executeWebhook(
  action: any,
  subscriber: any,
  triggerData: Record<string, any>
): Promise<void> {
  const config = action.config as { url?: string };

  if (!config.url) {
    console.error("Webhook action missing URL", action.id);
    return;
  }

  try {
    await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "automation.webhook",
        subscriber: {
          id: subscriber.id,
          email: subscriber.email,
          name: subscriber.name,
        },
        triggerData,
      }),
    });
  } catch (error) {
    console.error("Automation webhook action failed:", error);
  }
}

/**
 * Schedule a delayed action
 * In production, you'd use a queue system like Bull, SQS, or Redis
 */
async function scheduleDelayedAction(
  action: any,
  subscriber: any,
  triggerData: Record<string, any>
): Promise<void> {
  // For now, we'll use setTimeout as a simple delay mechanism
  // In production, this should be handled by a proper job queue
  const delayMs = action.delayHours * 60 * 60 * 1000;

  setTimeout(() => {
    executeAction(action, subscriber, triggerData).catch(console.error);
  }, delayMs);
}

/**
 * Convenience functions for triggering specific events
 */
export async function triggerSubscriberCreated(
  userId: string,
  subscriberId: string
): Promise<void> {
  await triggerAutomations(userId, "SUBSCRIBE", { subscriberId });
  await sendWebhooks(userId, "subscriber.created", { subscriberId });
}

export async function triggerSubscriberUnsubscribed(
  userId: string,
  subscriberId: string
): Promise<void> {
  await triggerAutomations(userId, "UNSUBSCRIBE", { subscriberId });
  await sendWebhooks(userId, "subscriber.updated", {
    subscriberId,
    status: "unsubscribed",
  });
}

export async function triggerTagAdded(
  userId: string,
  subscriberId: string,
  tagId: string
): Promise<void> {
  await triggerAutomations(userId, "TAG_ADDED", { subscriberId, tagId });
  await sendWebhooks(userId, "tag.added", { subscriberId, tagId });
}

export async function triggerTagRemoved(
  userId: string,
  subscriberId: string,
  tagId: string
): Promise<void> {
  await triggerAutomations(userId, "TAG_REMOVED", { subscriberId, tagId });
  await sendWebhooks(userId, "tag.removed", { subscriberId, tagId });
}

export async function triggerEmailOpened(
  userId: string,
  subscriberId: string,
  newsletterId: string
): Promise<void> {
  await triggerAutomations(userId, "EMAIL_OPENED", {
    subscriberId,
    newsletterId,
  });
  await sendWebhooks(userId, "email.opened", { subscriberId, newsletterId });
}

export async function triggerLinkClicked(
  userId: string,
  subscriberId: string,
  newsletterId: string,
  url: string
): Promise<void> {
  await triggerAutomations(userId, "LINK_CLICKED", {
    subscriberId,
    newsletterId,
    url,
  });
  await sendWebhooks(userId, "email.clicked", {
    subscriberId,
    newsletterId,
    url,
  });
}
