import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/deliver";

/**
 * GET /api/webhooks
 * List all webhooks for the current user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const webhooks = await prisma.webhook.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        lastSentAt: true,
        failCount: true,
        createdAt: true,
        // Don't return the secret
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({
      webhooks,
      availableEvents: Object.values(WEBHOOK_EVENTS),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook endpoint.
 * Body: { url: string, events: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { url, events } = body;

    if (!url || typeof url !== "string") {
      return errorResponse("URL is required");
    }

    // Validate URL format
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return errorResponse("URL must use HTTP or HTTPS protocol");
      }
    } catch {
      return errorResponse("Invalid URL format");
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return errorResponse("At least one event is required");
    }

    const validEvents = Object.values(WEBHOOK_EVENTS);
    for (const event of events) {
      if (!validEvents.includes(event)) {
        return errorResponse(
          `Invalid event "${event}". Valid events: ${validEvents.join(", ")}`
        );
      }
    }

    // Limit to 10 webhooks per user
    const count = await prisma.webhook.count({
      where: { userId: session.user.id },
    });

    if (count >= 10) {
      return errorResponse("Maximum of 10 webhooks allowed");
    }

    // Generate a signing secret
    const secret = randomBytes(32).toString("hex");

    const webhook = await prisma.webhook.create({
      data: {
        userId: session.user.id,
        url,
        events,
        secret,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Return the secret only once
    return successResponse(
      {
        ...webhook,
        secret,
        message:
          "Save the signing secret securely. It will not be shown again.",
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/webhooks
 * Update a webhook (toggle active, update events/url).
 * Body: { id: string, url?: string, events?: string[], isActive?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { id, url, events, isActive } = body;

    if (!id) {
      return errorResponse("Webhook ID is required");
    }

    const webhook = await prisma.webhook.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!webhook) {
      return errorResponse("Webhook not found", 404);
    }

    const updateData: Record<string, unknown> = {};

    if (url !== undefined) {
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return errorResponse("URL must use HTTP or HTTPS protocol");
        }
      } catch {
        return errorResponse("Invalid URL format");
      }
      updateData.url = url;
    }

    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return errorResponse("At least one event is required");
      }
      const validEvents = Object.values(WEBHOOK_EVENTS);
      for (const event of events) {
        if (!validEvents.includes(event)) {
          return errorResponse(`Invalid event "${event}"`);
        }
      }
      updateData.events = events;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
      // Reset fail count when re-enabling
      if (isActive) {
        updateData.failCount = 0;
      }
    }

    const updated = await prisma.webhook.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        lastSentAt: true,
        failCount: true,
        createdAt: true,
      },
    });

    return successResponse({ webhook: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/webhooks?id=...
 * Delete a webhook.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return errorResponse("Webhook ID is required");
    }

    const webhook = await prisma.webhook.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!webhook) {
      return errorResponse("Webhook not found", 404);
    }

    await prisma.webhook.delete({ where: { id } });

    return successResponse({ message: "Webhook deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
