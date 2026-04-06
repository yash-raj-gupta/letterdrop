import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "csv";
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (status) where.status = status;

    const subscribers = await prisma.subscriber.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "json") {
      const data = subscribers.map((s) => ({
        email: s.email,
        name: s.name,
        status: s.status,
        source: s.source,
        tags: s.tags.map((t) => t.tag.name),
        subscribedAt: s.subscribedAt,
        unsubscribedAt: s.unsubscribedAt,
      }));

      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="subscribers-${Date.now()}.json"`,
        },
      });
    }

    // CSV format
    const headers = ["Email", "Name", "Status", "Source", "Tags", "Subscribed At"];
    const rows = subscribers.map((s) => [
      s.email,
      s.name || "",
      s.status,
      s.source,
      s.tags.map((t) => t.tag.name).join(";"),
      s.subscribedAt ? new Date(s.subscribedAt).toISOString() : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subscribers-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
