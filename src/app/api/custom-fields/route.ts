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
 * GET /api/custom-fields
 * List all custom fields for the current user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const fields = await prisma.customField.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { values: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse({ fields });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/custom-fields
 * Create a new custom field.
 * Body: { name: string, key: string, type: string, required?: boolean, options?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { name, key, type, required, options } = body;

    if (!name || !key || !type) {
      return errorResponse("Name, key, and type are required");
    }

    // Validate key format (lowercase, alphanumeric, underscores)
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      return errorResponse(
        "Key must start with a letter and contain only lowercase letters, numbers, and underscores"
      );
    }

    const validTypes = [
      "TEXT",
      "NUMBER",
      "DATE",
      "SELECT",
      "MULTISELECT",
      "BOOLEAN",
    ];
    if (!validTypes.includes(type)) {
      return errorResponse(`Invalid type. Must be one of: ${validTypes.join(", ")}`);
    }

    // Check for duplicate key
    const existing = await prisma.customField.findFirst({
      where: { userId: session.user.id, key },
    });

    if (existing) {
      return errorResponse(`A custom field with key "${key}" already exists`);
    }

    // Limit to 20 custom fields per user
    const count = await prisma.customField.count({
      where: { userId: session.user.id },
    });

    if (count >= 20) {
      return errorResponse("Maximum of 20 custom fields allowed");
    }

    const field = await prisma.customField.create({
      data: {
        userId: session.user.id,
        name,
        key,
        type: type as "TEXT" | "NUMBER" | "DATE" | "SELECT" | "MULTISELECT" | "BOOLEAN",
        required: required || false,
        options: options || null,
      },
    });

    return successResponse({ field }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/custom-fields?id=...
 * Delete a custom field and all its values.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return errorResponse("Field ID is required");
    }

    const field = await prisma.customField.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!field) {
      return errorResponse("Custom field not found", 404);
    }

    await prisma.customField.delete({ where: { id } });

    return successResponse({ message: "Custom field deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
