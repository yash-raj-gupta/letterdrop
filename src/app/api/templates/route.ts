import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { templateSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const templates = await prisma.template.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return successResponse(templates);
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
    const validated = templateSchema.parse(body);

    const template = await prisma.template.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        content: validated.content,
      },
    });

    return successResponse(template, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
