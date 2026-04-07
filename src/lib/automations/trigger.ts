import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { deliverWebhook } from "@/lib/webhooks/deliver";

type TriggerType =
  | "SUBSCRIBE"
  | "UNSUBSCRIBE"
  | "TAG_ADDED"
  | "TAG_REMOVED"
  | "EMAIL_OPENED"
  | "LINK_CLICKED";

interface TriggerContext {
  userId: string;
  subscriberId?: string;
  subscriberEmail?: string;
  subscriberName?: string;
  tagId?: string;
  tagName?: string;
  newsletterId?: string;
  sendId?: string;
  url?: string;
}

/**
 * Fire automation triggers for a given event.
 * Finds all active automations matching the trigger and executes their actions.
 */
export async function fireAutomationTrigger(
  trigger: TriggerType,
  context: TriggerContext
): Promise<void> {
  try {
    // Find matching active automations
    const automations = await prisma.automation.findMany({
      where: {
        userId: context.userId,
        trigger,
        isActive: true,
      },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (automations.length === 0) return;

    for (const automation of automations) {
      // Check trigger-specific conditions
      if (!matchesTriggerData(automation.triggerData, trigger, context)) {
        continue;
      }

      // Execute actions sequentially
      for (const action of automation.actions) {
        // Handle delay (in a real system, this would use a job queue)
        if (action.delayHours > 0) {
          console.log(
            `[Automation] Delaying action "${action.type}" by ${action.delayHours}h (automation: ${automation.name})`
          );
          // In production, schedule this via a job queue
          continue;
        }

        await executeAction(action, context);
      }
    }
  } catch (error) {
    console.error("[Automation Trigger Error]", error);
  }
}

/**
 * Check if trigger data matches the context.
 */
function matchesTriggerData(
  triggerData: unknown,
  trigger: TriggerType,
  context: TriggerContext
): boolean {
  if (!triggerData || typeof triggerData !== "object") return true;

  const data = triggerData as Record<string, unknown>;

  switch (trigger) {
    case "TAG_ADDED":
    case "TAG_REMOVED":
      // If triggerData specifies a tagId, only match that tag
      if (data.tagId && data.tagId !== context.tagId) return false;
      break;

    case "LINK_CLICKED":
      // If triggerData specifies a URL pattern, match it
      if (
        data.urlPattern &&
        context.url &&
        !context.url.includes(data.urlPattern as string)
      ) {
        return false;
      }
      break;

    default:
      break;
  }

  return true;
}

/**
 * Execute a single automation action.
 */
async function executeAction(
  action: {
    type: string;
    config: unknown;
  },
  context: TriggerContext
): Promise<void> {
  const config = (action.config || {}) as Record<string, unknown>;

  try {
    switch (action.type) {
      case "SEND_EMAIL": {
        if (!context.subscriberEmail) break;

        const subject = (config.subject as string) || "Automated Message";
        const html = (config.html as string) || "<p>Hello!</p>";

        await sendTransactionalEmail({
          to: context.subscriberEmail,
          subject,
          html,
        });

        console.log(
          `[Automation] Sent email to ${context.subscriberEmail}: "${subject}"`
        );
        break;
      }

      case "ADD_TAG": {
        if (!context.subscriberId || !config.tagId) break;

        await prisma.subscriberTag.create({
          data: {
            subscriberId: context.subscriberId,
            tagId: config.tagId as string,
          },
        });

        console.log(
          `[Automation] Added tag ${config.tagId} to subscriber ${context.subscriberId}`
        );
        break;
      }

      case "REMOVE_TAG": {
        if (!context.subscriberId || !config.tagId) break;

        await prisma.subscriberTag.deleteMany({
          where: {
            subscriberId: context.subscriberId,
            tagId: config.tagId as string,
          },
        });

        console.log(
          `[Automation] Removed tag ${config.tagId} from subscriber ${context.subscriberId}`
        );
        break;
      }

      case "WEBHOOK": {
        if (!config.url) break;

        await deliverWebhook({
          url: config.url as string,
          secret: (config.secret as string) || "",
          event: "automation.action",
          data: {
            subscriberId: context.subscriberId,
            subscriberEmail: context.subscriberEmail,
            triggeredBy: action.type,
          },
        });

        console.log(`[Automation] Delivered webhook to ${config.url}`);
        break;
      }

      case "WAIT":
        // In a real system, this would pause execution and resume later via a job queue
        console.log(
          `[Automation] WAIT action - would delay next actions`
        );
        break;

      default:
        console.warn(`[Automation] Unknown action type: ${action.type}`);
    }
  } catch (error) {
    console.error(`[Automation Action Error] ${action.type}:`, error);
  }
}

/**
 * Helper to fire subscriber-related triggers.
 */
export async function onSubscriberEvent(
  event: "SUBSCRIBE" | "UNSUBSCRIBE",
  userId: string,
  subscriberId: string,
  subscriberEmail: string,
  subscriberName?: string
): Promise<void> {
  await fireAutomationTrigger(event, {
    userId,
    subscriberId,
    subscriberEmail,
    subscriberName,
  });
}

/**
 * Helper to fire tag-related triggers.
 */
export async function onTagEvent(
  event: "TAG_ADDED" | "TAG_REMOVED",
  userId: string,
  subscriberId: string,
  tagId: string,
  tagName: string
): Promise<void> {
  // Get subscriber info
  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    select: { email: true, name: true },
  });

  await fireAutomationTrigger(event, {
    userId,
    subscriberId,
    subscriberEmail: subscriber?.email,
    subscriberName: subscriber?.name || undefined,
    tagId,
    tagName,
  });
}

/**
 * Helper to fire email engagement triggers.
 */
export async function onEmailEngagement(
  event: "EMAIL_OPENED" | "LINK_CLICKED",
  userId: string,
  sendId: string,
  subscriberId: string,
  url?: string
): Promise<void> {
  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    select: { email: true, name: true },
  });

  await fireAutomationTrigger(event, {
    userId,
    subscriberId,
    subscriberEmail: subscriber?.email,
    subscriberName: subscriber?.name || undefined,
    sendId,
    url,
  });
}
