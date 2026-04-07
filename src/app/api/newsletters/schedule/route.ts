import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewsletter } from "@/lib/email/sender";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

/**
 * Cron endpoint to check and send scheduled newsletters.
 * Should be called by Vercel Cron or similar scheduler.
 * Protected by CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return errorResponse("Unauthorized", 401);
    }

    const now = new Date();

    // Find newsletters that are scheduled and due
    const scheduledNewsletters = await prisma.newsletter.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
      select: { id: true, userId: true },
    });

    const results = [];

    for (const newsletter of scheduledNewsletters) {
      try {
        const result = await sendNewsletter({
          newsletterId: newsletter.id,
          userId: newsletter.userId,
        });

        results.push({
          newsletterId: newsletter.id,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          newsletterId: newsletter.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return successResponse({
      processed: scheduledNewsletters.length,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Also support GET for simple health checks.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return errorResponse("Unauthorized", 401);
    }

    const now = new Date();

    // Just count scheduled newsletters
    const count = await prisma.newsletter.count({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
    });

    return successResponse({
      scheduledToSend: count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
