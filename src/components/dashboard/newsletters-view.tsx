"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PenSquare,
  Loader2,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Clock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

interface Newsletter {
  id: string;
  subject: string;
  previewText: string | null;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { sends: number };
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Edit className="h-3 w-3" />,
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800",
    icon: <Clock className="h-3 w-3" />,
  },
  SENDING: {
    label: "Sending",
    color: "bg-orange-100 text-orange-800",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  SENT: {
    label: "Sent",
    color: "bg-green-100 text-green-800",
    icon: <Send className="h-3 w-3" />,
  },
};

export function NewslettersView() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchNewsletters = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/newsletters?${params}`);
      const data = await res.json();

      if (data.success) {
        setNewsletters(data.data.newsletters);
      }
    } catch {
      toast.error("Failed to fetch newsletters");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this newsletter?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/newsletters/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Newsletter deleted");
      fetchNewsletters();
    } catch {
      toast.error("Failed to delete newsletter");
    }
  }

  async function handleSend(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to send this newsletter to all active subscribers?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/newsletters/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send");
        return;
      }

      toast.success(data.data.message);
      fetchNewsletters();
    } catch {
      toast.error("Failed to send newsletter");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Newsletters</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and send your newsletters
          </p>
        </div>
        <Link href="/dashboard/newsletters/new">
          <Button className="gap-2">
            <PenSquare className="h-4 w-4" />
            New Newsletter
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(v: string | null) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Drafts</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Newsletter List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : newsletters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Mail className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-1">No newsletters yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first newsletter to get started.
            </p>
            <Link href="/dashboard/newsletters/new">
              <Button className="gap-2">
                <PenSquare className="h-4 w-4" />
                Create Newsletter
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {newsletters.map((newsletter) => {
            const config = statusConfig[newsletter.status] ?? statusConfig.DRAFT;
            return (
              <Card
                key={newsletter.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Link
                          href={
                            newsletter.status === "DRAFT"
                              ? `/dashboard/newsletters/${newsletter.id}/edit`
                              : `/dashboard/newsletters/${newsletter.id}`
                          }
                          className="font-semibold hover:underline truncate"
                        >
                          {newsletter.subject}
                        </Link>
                        <Badge
                          variant="secondary"
                          className={`text-xs shrink-0 gap-1 ${config.color}`}
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                      </div>
                      {newsletter.previewText && (
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {newsletter.previewText}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {newsletter.sentAt && (
                          <span>
                            Sent{" "}
                            {format(
                              new Date(newsletter.sentAt),
                              "MMM d, yyyy 'at' h:mm a"
                            )}
                          </span>
                        )}
                        {newsletter.scheduledAt &&
                          newsletter.status === "SCHEDULED" && (
                            <span>
                              Scheduled for{" "}
                              {format(
                                new Date(newsletter.scheduledAt),
                                "MMM d, yyyy 'at' h:mm a"
                              )}
                            </span>
                          )}
                        {newsletter.status === "DRAFT" && (
                          <span>
                            Updated{" "}
                            {formatDistanceToNow(
                              new Date(newsletter.updatedAt),
                              { addSuffix: true }
                            )}
                          </span>
                        )}
                        {newsletter._count.sends > 0 && (
                          <span>{newsletter._count.sends} recipients</span>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {newsletter.status === "DRAFT" && (
                          <>
                            <DropdownMenuItem
                              render={<Link href={`/dashboard/newsletters/${newsletter.id}/edit`} />}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSend(newsletter.id)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send Now
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {newsletter.status === "SENT" && (
                          <DropdownMenuItem
                            render={<Link href={`/dashboard/newsletters/${newsletter.id}`} />}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Stats
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(newsletter.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
