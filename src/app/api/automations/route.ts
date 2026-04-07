import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

/**
 * GET /api/automations
 * List all automations for the current user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const automations = await prisma.automation.findMany({
      where: { userId: session.user.id },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ automations });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/automations
 * Create a new automation.
 * Body: {
 *   name: string,
 *   trigger: AutomationTrigger,
 *   triggerData: object,
 *   actions: Array<{ type: AutomationActionType, order: number, delayHours?: number, config: object }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { name, trigger, triggerData, actions } = body;

    if (!name || !trigger || !actions || !Array.isArray(actions)) {
      return errorResponse("Name, trigger, and actions are required");
    }

    const validTriggers = [
      "SUBSCRIBE",
      "UNSUBSCRIBE",
      "TAG_ADDED",
      "TAG_REMOVED",
      "EMAIL_OPENED",
      "LINK_CLICKED",
      "DATE_REACHED",
    ];

    if (!validTriggers.includes(trigger)) {
      return errorResponse(
        `Invalid trigger. Must be one of: ${validTriggers.join(", ")}`
      );
    }

    const validActionTypes = [
      "SEND_EMAIL",
      "ADD_TAG",
      "REMOVE_TAG",
      "WAIT",
      "WEBHOOK",
    ];

    for (const action of actions) {
      if (!validActionTypes.includes(action.type)) {
        return errorResponse(
          `Invalid action type "${action.type}". Must be one of: ${validActionTypes.join(", ")}`
        );
      }
    }

    // Limit to 20 automations per user
    const count = await prisma.automation.count({
      where: { userId: session.user.id },
    });

    if (count >= 20) {
      return errorResponse("Maximum of 20 automations allowed");
    }

    const automation = await prisma.automation.create({
      data: {
        userId: session.user.id,
        name,
        trigger: trigger as
          | "SUBSCRIBE"
          | "UNSUBSCRIBE"
          | "TAG_ADDED"
          | "TAG_REMOVED"
          | "EMAIL_OPENED"
          | "LINK_CLICKED"
          | "DATE_REACHED",
        triggerData: triggerData || {},
        actions: {
          create: actions.map(
            (
              action: {
                type: string;
                order: number;
                delayHours?: number;
                config?: Record<string, unknown>;
              },
              index: number
            ) => ({
              type: action.type as
                | "SEND_EMAIL"
                | "ADD_TAG"
                | "REMOVE_TAG"
                | "WAIT"
                | "WEBHOOK",
              order: action.order ?? index,
              delayHours: action.delayHours ?? 0,
              config: JSON.parse(JSON.stringify(action.config || {})),
            })
          ),
        },
      },
      include: {
        actions: { orderBy: { order: "asc" } },
      },
    });

    return successResponse({ automation }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/automations
 * Toggle automation active status.
 * Body: { id: string, isActive: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return errorResponse("ID and isActive are required");
    }

    const automation = await prisma.automation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!automation) {
      return errorResponse("Automation not found", 404);
    }

    const updated = await prisma.automation.update({
      where: { id },
      data: { isActive },
      include: { actions: { orderBy: { order: "asc" } } },
    });

    return successResponse({ automation: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/automations?id=...
 * Delete an automation.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return errorResponse("Automation ID is required");
    }

    const automation = await prisma.automation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!automation) {
      return errorResponse("Automation not found", 404);
    }

    await prisma.automation.delete({ where: { id } });

    return successResponse({ message: "Automation deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
