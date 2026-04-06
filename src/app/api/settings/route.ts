import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = profileSchema.parse(body);

    // Check username uniqueness if provided
    if (validated.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: validated.username,
          id: { not: session.user.id },
        },
      });

      if (existing) {
        return errorResponse("This username is already taken", 409);
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validated.name,
        username: validated.username,
        brandName: validated.brandName,
        senderName: validated.senderName,
        senderEmail: validated.senderEmail,
        bio: validated.bio,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        brandName: true,
        senderName: true,
        senderEmail: true,
        bio: true,
        plan: true,
      },
    });

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
