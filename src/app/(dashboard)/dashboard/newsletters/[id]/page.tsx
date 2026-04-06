import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Users,
  MousePointerClick,
  Eye,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Newsletter Details",
};

export default async function NewsletterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const newsletter = await prisma.newsletter.findFirst({
    where: { id, userId: user.id },
    include: {
      _count: { select: { sends: true } },
    },
  });

  if (!newsletter) {
    redirect("/dashboard/newsletters");
  }

  // Get send stats
  const [totalSends, openedSends, clickedSends] = await Promise.all([
    prisma.send.count({ where: { newsletterId: id } }),
    prisma.send.count({
      where: { newsletterId: id, openedAt: { not: null } },
    }),
    prisma.send.count({
      where: { newsletterId: id, clickedAt: { not: null } },
    }),
  ]);

  const openRate = totalSends > 0 ? Math.round((openedSends / totalSends) * 100) : 0;
  const clickRate = totalSends > 0 ? Math.round((clickedSends / totalSends) * 100) : 0;

  const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    SENDING: "bg-orange-100 text-orange-800",
    SENT: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/newsletters">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight truncate">
              {newsletter.subject}
            </h1>
            <Badge
              variant="secondary"
              className={statusColors[newsletter.status] ?? ""}
            >
              {newsletter.status.toLowerCase()}
            </Badge>
          </div>
          {newsletter.sentAt && (
            <p className="text-sm text-muted-foreground mt-1">
              Sent on {format(newsletter.sentAt, "MMMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recipients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSends}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSends}</div>
            <p className="text-xs text-muted-foreground mt-1">100% delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opens
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {openedSends} of {totalSends}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clicks
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clickRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {clickedSends} of {totalSends}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-6 py-3 border-b text-sm">
              <span className="text-muted-foreground">Subject: </span>
              <span className="font-medium">{newsletter.subject}</span>
            </div>
            <div className="p-6 bg-white min-h-[200px]">
              {newsletter.htmlContent ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: newsletter.htmlContent }}
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No content
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-xs text-muted-foreground">
                  {format(newsletter.createdAt, "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            {newsletter.sentAt && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <Send className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sent</p>
                  <p className="text-xs text-muted-foreground">
                    {format(newsletter.sentAt, "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
