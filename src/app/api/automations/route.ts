import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { z } from "zod";
import { AutomationTrigger, AutomationActionType } from "@/generated/prisma/enums";

const automationSchema = z.object({
  name: z.string().min(1, "Automation name is required").max(100),
  trigger: z.enum([
    "SUBSCRIBE",
    "UNSUBSCRIBE",
    "TAG_ADDED",
    "TAG_REMOVED",
    "EMAIL_OPENED",
    "LINK_CLICKED",
    "DATE_REACHED",
  ]),
  triggerData: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
  actions: z
    .array(
      z.object({
        type: z.enum(["SEND_EMAIL", "ADD_TAG", "REMOVE_TAG", "WAIT", "WEBHOOK"]),
        order: z.number().int().min(0),
        delayHours: z.number().int().min(0).default(0),
        config: z.record(z.any()),
      })
    )
    .min(1, "At least one action is required"),
});

export async function GET(request: NextRequest) {
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

    return successResponse(automations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = automationSchema.parse(body);

    const automation = await prisma.$transaction(async (tx) => {
      const created = await tx.automation.create({
        data: {
          userId: session.user.id,
          name: validated.name,
          trigger: validated.trigger,
          triggerData: validated.triggerData,
          isActive: validated.isActive,
        },
      });

      await tx.automationAction.createMany({
        data: validated.actions.map((action) => ({
          automationId: created.id,
          type: action.type,
          order: action.order,
          delayHours: action.delayHours,
          config: action.config,
        })),
      });

      return created;
    });

    const automationWithActions = await prisma.automation.findUnique({
      where: { id: automation.id },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
      },
    });

    return successResponse(automationWithActions, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return errorResponse("Automation ID is required", 400);
    }

    const existing = await prisma.automation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return errorResponse("Automation not found", 404);
    }

    const updated = await prisma.automation.update({
      where: { id },
      data: {
        name: updates.name,
        isActive: updates.isActive,
      },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("Automation ID is required", 400);
    }

    const existing = await prisma.automation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return errorResponse("Automation not found", 404);
    }

    await prisma.automation.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
