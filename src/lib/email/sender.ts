import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL, isResendConfigured } from "./resend";
import { wrapNewsletterHtml, rewriteLinksForTracking } from "./templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SendNewsletterOptions {
  newsletterId: string;
  userId: string;
}

interface SendResult {
  total: number;
  sent: number;
  failed: number;
  simulated: boolean;
}

/**
 * Sends a newsletter to all active subscribers.
 * Uses Resend if configured, otherwise simulates sending.
 */
export async function sendNewsletter({
  newsletterId,
  userId,
}: SendNewsletterOptions): Promise<SendResult> {
  // Get newsletter
  const newsletter = await prisma.newsletter.findFirst({
    where: { id: newsletterId, userId },
  });

  if (!newsletter) {
    throw new Error("Newsletter not found");
  }

  // Get user details for sender info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      senderName: true,
      senderEmail: true,
      brandName: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const senderName = user.senderName || user.name || "Newsletter";
  const senderEmail = user.senderEmail || FROM_EMAIL;
  const brandName = user.brandName || senderName;

  // Get active subscribers
  const subscribers = await prisma.subscriber.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, email: true, name: true },
  });

  if (subscribers.length === 0) {
    throw new Error("No active subscribers");
  }

  // Update newsletter status
  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: { status: "SENDING" },
  });

  // Create send records
  await prisma.send.createMany({
    data: subscribers.map((sub) => ({
      newsletterId,
      subscriberId: sub.id,
      status: "QUEUED" as const,
    })),
    skipDuplicates: true,
  });

  // Get all send records
  const sends = await prisma.send.findMany({
    where: { newsletterId, status: "QUEUED" },
    include: { subscriber: true },
  });

  const isConfigured = isResendConfigured();
  let sentCount = 0;
  let failedCount = 0;

  // Process sends in batches of 10
  const batchSize = 10;
  for (let i = 0; i < sends.length; i += batchSize) {
    const batch = sends.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (send) => {
        const unsubscribeUrl = `${APP_URL}/api/public/unsubscribe?token=${send.subscriberId}&nl=${newsletterId}`;
        const trackingPixelUrl = `${APP_URL}/api/track/open/${send.id}`;

        // Rewrite links for click tracking
        const rawHtml = newsletter.htmlContent || "";
        const trackedHtml = rewriteLinksForTracking(rawHtml, send.id, APP_URL);

        const emailHtml = wrapNewsletterHtml({
          content: trackedHtml,
          senderName,
          brandName,
          unsubscribeUrl,
          trackingPixelUrl,
        });

        if (isConfigured) {
          // Send via Resend
          const { error } = await resend.emails.send({
            from: `${senderName} <${senderEmail}>`,
            to: send.subscriber.email,
            subject: newsletter.subject,
            html: emailHtml,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          });

          if (error) {
            throw new Error(error.message);
          }
        }

        // Mark as sent
        await prisma.send.update({
          where: { id: send.id },
          data: { status: "SENT" },
        });
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        sentCount++;
      } else {
        failedCount++;
        console.error("[Email Send Error]", result.reason);
      }
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < sends.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  // Mark any failed sends
  if (failedCount > 0) {
    await prisma.send.updateMany({
      where: { newsletterId, status: "QUEUED" },
      data: { status: "FAILED" },
    });
  }

  // Update newsletter status
  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  return {
    total: sends.length,
    sent: sentCount,
    failed: failedCount,
    simulated: !isConfigured,
  };
}

/**
 * Send a single transactional email (confirmation, etc.)
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<boolean> {
  if (!isResendConfigured()) {
    console.log(`[Simulated Email] To: ${to}, Subject: ${subject}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: from || `LetterDrop <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Transactional Email Error]", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Transactional Email Error]", err);
    return false;
  }
}
