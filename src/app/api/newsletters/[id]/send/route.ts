import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    // Get active subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      select: { id: true, email: true, name: true },
    });

    if (subscribers.length === 0) {
      return errorResponse("No active subscribers to send to", 400);
    }

    // Check for optional scheduling
    const body = await request.json().catch(() => ({}));
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

    if (scheduledAt) {
      // Schedule the newsletter
      await prisma.newsletter.update({
        where: { id },
        data: {
          status: "SCHEDULED",
          scheduledAt,
        },
      });

      return successResponse({
        message: `Newsletter scheduled for ${scheduledAt.toISOString()}`,
        subscriberCount: subscribers.length,
      });
    }

    // Send immediately - update status
    await prisma.newsletter.update({
      where: { id },
      data: { status: "SENDING" },
    });

    // Create send records for each subscriber
    await prisma.send.createMany({
      data: subscribers.map((subscriber) => ({
        newsletterId: id,
        subscriberId: subscriber.id,
        status: "QUEUED",
      })),
      skipDuplicates: true,
    });

    // In production, this would trigger a background job to actually send emails.
    // For now, we mark them as sent directly.
    // TODO: Integrate with Resend API and background job queue

    await prisma.send.updateMany({
      where: { newsletterId: id },
      data: { status: "SENT" },
    });

    await prisma.newsletter.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return successResponse({
      message: `Newsletter sent to ${subscribers.length} subscribers`,
      subscriberCount: subscribers.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
