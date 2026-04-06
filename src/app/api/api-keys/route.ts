import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import crypto from "crypto";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";

// Generate a secure API key
function generateApiKey(): string {
  const prefix = "ld_";
  const randomBytes = crypto.randomBytes(32).toString("hex");
  return `${prefix}${randomBytes}`;
}

// Hash the API key for storage
function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function GET(request: NextRequest) {
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
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(apiKeys);
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
    const { name, expiresInDays } = body;

    if (!name || name.trim().length === 0) {
      return errorResponse("API key name is required", 400);
    }

    const key = generateApiKey();
    const hashedKey = hashApiKey(key);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        key: hashedKey,
        expiresAt,
      },
    });

    // Return the unhashed key only once
    return successResponse({
      key,
      name: name.trim(),
      expiresAt,
      message:
        "This is the only time you'll see this key. Copy it now!",
    });
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
      return errorResponse("API key ID is required", 400);
    }

    await prisma.apiKey.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
