import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { errorResponse, handleApiError } from "@/lib/api-response";

/**
 * Authenticate via session or API key.
 * Returns the user ID if authenticated.
 */
async function authenticateRequest(
  request: NextRequest
): Promise<string | null> {
  // Try session auth first
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return session.user.id;
  }

  // Try API key auth
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const rawKey = authHeader.substring(7);
    const hashedKey = createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      select: { userId: true, expiresAt: true },
    });

    if (apiKey) {
      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return null;
      }

      // Update last used
      await prisma.apiKey.update({
        where: { key: hashedKey },
        data: { lastUsedAt: new Date() },
      });

      return apiKey.userId;
    }
  }

  return null;
}

/**
 * GET /api/export/subscribers
 * Export subscribers to CSV or JSON.
 * Query params: format (csv|json), status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return errorResponse("Unauthorized", 401);
    }

    const format = request.nextUrl.searchParams.get("format") || "csv";
    const status = request.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const subscribers = await prisma.subscriber.findMany({
      where,
      include: {
        tags: {
          include: { tag: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "json") {
      const data = subscribers.map((sub) => ({
        email: sub.email,
        name: sub.name,
        status: sub.status,
        source: sub.source,
        tags: sub.tags.map((st) => st.tag.name),
        subscribedAt: sub.subscribedAt.toISOString(),
        createdAt: sub.createdAt.toISOString(),
      }));

      return NextResponse.json(data, {
        headers: {
          "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }

    // Default: CSV format
    const headers = [
      "email",
      "name",
      "status",
      "source",
      "tags",
      "subscribed_at",
      "created_at",
    ];

    const rows = subscribers.map((sub) => [
      sub.email,
      sub.name || "",
      sub.status,
      sub.source,
      sub.tags.map((st) => st.tag.name).join(";"),
      sub.subscribedAt.toISOString(),
      sub.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
