"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  Mail,
  MousePointerClick,
  Eye,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  overview: {
    totalSubscribers: number;
    totalNewsletters: number;
    totalSends: number;
    openRate: number;
    clickRate: number;
  };
  subscriberGrowth: Array<{
    date: string;
    active: number;
    unsubscribed: number;
  }>;
  newsletterActivity: Array<{
    date: string;
    sent: number;
  }>;
  engagement: {
    opened: number;
    clicked: number;
    unopened: number;
  };
}

const COLORS = ["#22c55e", "#3b82f6", "#ef4444"];

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState("30");

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        toast.error("Failed to load analytics");
      }
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No analytics data available</p>
        <p className="text-sm mt-1">Send your first newsletter to see analytics.</p>
      </div>
    );
  }

  const engagementData = [
    { name: "Opened", value: data.engagement.opened },
    { name: "Clicked", value: data.engagement.clicked },
    { name: "Unopened", value: data.engagement.unopened },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your newsletter performance
          </p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v ?? "30")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscribers</p>
                <p className="text-2xl font-bold">
                  {data.overview.totalSubscribers.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
                <p className="text-2xl font-bold">
                  {data.overview.totalSends.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold">{data.overview.openRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <MousePointerClick className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Click Rate</p>
                <p className="text-2xl font-bold">{data.overview.clickRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscriber Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscriber Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {data.subscriberGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.subscriberGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => {
                      const date = new Date(d);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                  />
                  <Legend />
                  <Bar
                    dataKey="active"
                    name="New Active"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="unsubscribed"
                    name="Unsubscribed"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                No subscriber data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Newsletter Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Newsletter Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.newsletterActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.newsletterActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => {
                      const date = new Date(d);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    name="Emails Sent"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                No newsletter activity for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engagement Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {engagementData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ResponsiveContainer width={250} height={250}>
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {engagementData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {engagementData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">
                      {entry.name}:{" "}
                      <span className="font-medium">
                        {entry.value.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
              No engagement data for this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
