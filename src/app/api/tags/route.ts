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

const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be under 50 characters")
    .transform((v) => v.trim()),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format")
    .optional()
    .default("#6366f1"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { subscribers: true } },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(tags);
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
    const validated = tagSchema.parse(body);

    // Check uniqueness
    const existing = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: validated.name,
        },
      },
    });

    if (existing) {
      return errorResponse("A tag with this name already exists", 409);
    }

    const tag = await prisma.tag.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        color: validated.color,
      },
      include: {
        _count: { select: { subscribers: true } },
      },
    });

    return successResponse(tag, 201);
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
      return errorResponse("Tag ID is required", 400);
    }

    const existing = await prisma.tag.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return errorResponse("Tag not found", 404);
    }

    await prisma.tag.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
