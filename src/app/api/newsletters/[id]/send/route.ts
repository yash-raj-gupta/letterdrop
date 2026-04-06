import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewsletter } from "@/lib/email/sender";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;

    // Get newsletter
    const newsletter = await prisma.newsletter.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!newsletter) {
      return errorResponse("Newsletter not found", 404);
    }

    if (newsletter.status === "SENT" || newsletter.status === "SENDING") {
      return errorResponse("Newsletter has already been sent", 400);
    }

    if (!newsletter.htmlContent && !newsletter.content) {
      return errorResponse("Newsletter has no content", 400);
    }

    // Check for active subscribers
    const subscriberCount = await prisma.subscriber.count({
      where: { userId: session.user.id, status: "ACTIVE" },
    });

    if (subscriberCount === 0) {
      return errorResponse("No active subscribers to send to", 400);
    }

    // Check for optional scheduling
    const body = await request.json().catch(() => ({}));
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

    if (scheduledAt) {
      if (scheduledAt <= new Date()) {
        return errorResponse("Scheduled time must be in the future", 400);
      }

      await prisma.newsletter.update({
        where: { id },
        data: {
          status: "SCHEDULED",
          scheduledAt,
        },
      });

      return successResponse({
        message: `Newsletter scheduled for ${scheduledAt.toISOString()}`,
        subscriberCount,
        scheduled: true,
      });
    }

    // Send immediately
    const result = await sendNewsletter({
      newsletterId: id,
      userId: session.user.id,
    });

    return successResponse({
      message: result.simulated
        ? `Newsletter simulated to ${result.sent} subscribers (Resend not configured)`
        : `Newsletter sent to ${result.sent} subscribers`,
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
