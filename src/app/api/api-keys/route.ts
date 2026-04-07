import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

/**
 * Generate a secure API key.
 * Format: ld_<64 hex chars>
 */
function generateApiKey(): { raw: string; hashed: string } {
  const raw = `ld_${randomBytes(32).toString("hex")}`;
  const hashed = createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
}

/**
 * GET /api/api-keys
 * List all API keys for the current user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        // Don't return the actual key hash
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ apiKeys });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/api-keys
 * Create a new API key.
 * Body: { name: string, expiresAt?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { name, expiresAt } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return errorResponse("Name is required");
    }

    // Limit to 10 API keys per user
    const existingCount = await prisma.apiKey.count({
      where: { userId: session.user.id },
    });

    if (existingCount >= 10) {
      return errorResponse("Maximum of 10 API keys allowed");
    }

    const { raw, hashed } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        key: hashed,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Return the raw key only once - it can never be retrieved again
    return successResponse(
      {
        ...apiKey,
        key: raw,
        message:
          "Save this key securely. It will not be shown again.",
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/api-keys?id=...
 * Delete an API key.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return errorResponse("API key ID is required");
    }

    // Verify ownership
    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!apiKey) {
      return errorResponse("API key not found", 404);
    }

    await prisma.apiKey.delete({ where: { id } });

    return successResponse({ message: "API key deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
