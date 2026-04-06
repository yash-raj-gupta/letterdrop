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

const customFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").max(50),
  key: z
    .string()
    .min(1, "Key is required")
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Key can only contain letters, numbers, and underscores"),
  type: z.enum(["TEXT", "NUMBER", "DATE", "SELECT", "MULTISELECT", "BOOLEAN"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const fields = await prisma.customField.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(fields);
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
    const validated = customFieldSchema.parse(body);

    // Validate options for select fields
    if (
      (validated.type === "SELECT" || validated.type === "MULTISELECT") &&
      (!validated.options || validated.options.length === 0)
    ) {
      return errorResponse("Options are required for select fields", 400);
    }

    const field = await prisma.customField.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        key: validated.key,
        type: validated.type,
        required: validated.required,
        options: validated.options ? JSON.stringify(validated.options) : null,
      },
    });

    return successResponse(field, 201);
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
      return errorResponse("Field ID is required", 400);
    }

    const existing = await prisma.customField.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return errorResponse("Custom field not found", 404);
    }

    await prisma.customField.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
