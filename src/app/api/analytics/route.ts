import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-response";
import { subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30");
    const startDate = subDays(new Date(), days);

    const [
      subscriberGrowth,
      newsletterStats,
      totalSends,
      openedSends,
      clickedSends,
      subscriberCount,
      newsletterCount,
    ] = await Promise.all([
      // Subscriber growth over time
      prisma.subscriber.groupBy({
        by: ["createdAt"],
        where: {
          userId: session.user.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Newsletter sends over time
      prisma.newsletter.groupBy({
        by: ["sentAt"],
        where: {
          userId: session.user.id,
          status: "SENT",
          sentAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Total sends count
      prisma.send.count({
        where: {
          newsletter: { userId: session.user.id },
        },
      }),

      // Total opens count
      prisma.send.count({
        where: {
          newsletter: { userId: session.user.id },
          openedAt: { not: null },
        },
      }),

      // Total clicks count
      prisma.send.count({
        where: {
          newsletter: { userId: session.user.id },
          clickedAt: { not: null },
        },
      }),

      // Current subscriber count
      prisma.subscriber.count({
        where: { userId: session.user.id, status: "ACTIVE" },
      }),

      // Sent newsletter count
      prisma.newsletter.count({
        where: { userId: session.user.id, status: "SENT" },
      }),
    ]);

    // Calculate rates
    const openRate = totalSends > 0 ? (openedSends / totalSends) * 100 : 0;
    const clickRate = totalSends > 0 ? (clickedSends / totalSends) * 100 : 0;

    return successResponse({
      summary: {
        subscribers: subscriberCount,
        newsletters: newsletterCount,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
      },
      subscriberGrowth: subscriberGrowth.map((s) => ({
        date: s.createdAt.toISOString().split("T")[0],
        count: s._count.id,
      })),
      newsletterSends: newsletterStats.map((n) => ({
        date: n.sentAt?.toISOString().split("T")[0] || "",
        count: n._count.id,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
