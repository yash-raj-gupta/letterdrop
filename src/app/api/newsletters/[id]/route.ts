import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;

    const newsletter = await prisma.newsletter.findFirst({
      where: { id, userId: session.user.id },
      include: {
        _count: { select: { sends: true } },
      },
    });

    if (!newsletter) {
      return errorResponse("Newsletter not found", 404);
    }

    return successResponse(newsletter);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const validated = newsletterSchema.partial().parse(body);

    // Verify ownership
    const existing = await prisma.newsletter.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return errorResponse("Newsletter not found", 404);
    }

    if (existing.status === "SENT" || existing.status === "SENDING") {
      return errorResponse("Cannot edit a sent newsletter", 400);
    }

    const newsletter = await prisma.newsletter.update({
      where: { id },
      data: {
        ...(validated.subject && { subject: validated.subject }),
        ...(validated.previewText !== undefined && {
          previewText: validated.previewText,
        }),
        ...(validated.content !== undefined && { content: validated.content }),
        ...(validated.htmlContent !== undefined && {
          htmlContent: validated.htmlContent,
        }),
      },
    });

    return successResponse(newsletter);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;

    const existing = await prisma.newsletter.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return errorResponse("Newsletter not found", 404);
    }

    if (existing.status === "SENDING") {
      return errorResponse("Cannot delete a newsletter that is currently sending", 400);
    }

    await prisma.newsletter.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
