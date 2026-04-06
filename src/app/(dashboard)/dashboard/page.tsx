import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Mail,
  MousePointerClick,
  TrendingUp,
  PenSquare,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getDashboardStats(userId: string) {
  const [
    totalSubscribers,
    activeSubscribers,
    totalNewsletters,
    sentNewsletters,
    recentNewsletters,
    recentSubscribers,
  ] = await Promise.all([
    prisma.subscriber.count({ where: { userId } }),
    prisma.subscriber.count({
      where: { userId, status: "ACTIVE" },
    }),
    prisma.newsletter.count({ where: { userId } }),
    prisma.newsletter.count({
      where: { userId, status: "SENT" },
    }),
    prisma.newsletter.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        subject: true,
        status: true,
        sentAt: true,
        createdAt: true,
        _count: { select: { sends: true } },
      },
    }),
    prisma.subscriber.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        source: true,
        createdAt: true,
      },
    }),
  ]);

  // Calculate open rate from sends
  const sendStats = await prisma.send.aggregate({
    where: {
      newsletter: { userId },
      status: { in: ["SENT", "DELIVERED"] },
    },
    _count: true,
  });

  const openedSends = await prisma.send.count({
    where: {
      newsletter: { userId },
      openedAt: { not: null },
    },
  });

  const openRate =
    sendStats._count > 0
      ? Math.round((openedSends / sendStats._count) * 100)
      : 0;

  return {
    totalSubscribers,
    activeSubscribers,
    totalNewsletters,
    sentNewsletters,
    recentNewsletters,
    recentSubscribers,
    openRate,
    totalSends: sendStats._count,
  };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  SENDING: "bg-orange-100 text-orange-800",
  SENT: "bg-green-100 text-green-800",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const stats = await getDashboardStats(user.id);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your newsletter.
          </p>
        </div>
        <Link href="/dashboard/newsletters/new">
          <Button className="gap-2">
            <PenSquare className="h-4 w-4" />
            New Newsletter
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscribers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeSubscribers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Newsletters Sent
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentNewsletters}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalNewsletters} total created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Open Rate
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalSends} total sends
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{stats.activeSubscribers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              subscribers this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Newsletters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Newsletters</CardTitle>
            <Link href="/dashboard/newsletters">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentNewsletters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No newsletters yet</p>
                <Link href="/dashboard/newsletters/new">
                  <Button variant="link" size="sm" className="mt-2">
                    Create your first newsletter
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentNewsletters.map((newsletter) => (
                  <Link
                    key={newsletter.id}
                    href={`/dashboard/newsletters/${newsletter.id}`}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {newsletter.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${statusColors[newsletter.status] ?? ""}`}
                        >
                          {newsletter.status.toLowerCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(newsletter.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    {newsletter._count.sends > 0 && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {newsletter._count.sends} sent
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Subscribers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Subscribers</CardTitle>
            <Link href="/dashboard/subscribers">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentSubscribers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No subscribers yet</p>
                <Link href="/dashboard/subscribers">
                  <Button variant="link" size="sm" className="mt-2">
                    Add your first subscriber
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentSubscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {subscriber.name ?? subscriber.email}
                      </p>
                      {subscriber.name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {subscriber.email}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(subscriber.createdAt, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
