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
 * GET /api/analytics
 * Fetch analytics data for the current user.
 * Query params: range (7, 30, 90 days)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const userId = session.user.id;
    const range = parseInt(
      request.nextUrl.searchParams.get("range") || "30",
      10
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);

    // Get subscriber growth data (daily new subscribers)
    const subscribers = await prisma.subscriber.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group subscribers by date
    const subscribersByDate: Record<
      string,
      { active: number; unsubscribed: number }
    > = {};
    for (const sub of subscribers) {
      const date = sub.createdAt.toISOString().split("T")[0];
      if (!subscribersByDate[date]) {
        subscribersByDate[date] = { active: 0, unsubscribed: 0 };
      }
      if (sub.status === "ACTIVE") {
        subscribersByDate[date].active++;
      } else {
        subscribersByDate[date].unsubscribed++;
      }
    }

    const subscriberGrowth = Object.entries(subscribersByDate).map(
      ([date, counts]) => ({
        date,
        active: counts.active,
        unsubscribed: counts.unsubscribed,
      })
    );

    // Get newsletter activity (sends over time)
    const newsletters = await prisma.newsletter.findMany({
      where: {
        userId,
        sentAt: { gte: startDate },
        status: "SENT",
      },
      select: {
        sentAt: true,
        _count: { select: { sends: true } },
      },
      orderBy: { sentAt: "asc" },
    });

    const newsletterActivity = newsletters
      .filter((n) => n.sentAt)
      .map((n) => ({
        date: n.sentAt!.toISOString().split("T")[0],
        sent: n._count.sends,
      }));

    // Get engagement stats
    const totalSends = await prisma.send.count({
      where: {
        newsletter: { userId },
        createdAt: { gte: startDate },
      },
    });

    const openedSends = await prisma.send.count({
      where: {
        newsletter: { userId },
        createdAt: { gte: startDate },
        openedAt: { not: null },
      },
    });

    const clickedSends = await prisma.send.count({
      where: {
        newsletter: { userId },
        createdAt: { gte: startDate },
        clickedAt: { not: null },
      },
    });

    const openRate = totalSends > 0 ? (openedSends / totalSends) * 100 : 0;
    const clickRate = totalSends > 0 ? (clickedSends / totalSends) * 100 : 0;
    const unopenedRate = totalSends > 0 ? 100 - openRate : 0;

    // Overall stats
    const totalSubscribers = await prisma.subscriber.count({
      where: { userId, status: "ACTIVE" },
    });

    const totalNewsletters = await prisma.newsletter.count({
      where: { userId, status: "SENT" },
    });

    return successResponse({
      overview: {
        totalSubscribers,
        totalNewsletters,
        totalSends,
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
      },
      subscriberGrowth,
      newsletterActivity,
      engagement: {
        opened: openRate,
        clicked: clickRate,
        unopened: unopenedRate,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
