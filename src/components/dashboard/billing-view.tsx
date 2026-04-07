"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  Users,
  Mail,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface BillingViewProps {
  user: {
    plan: string;
    email: string;
  };
  usage: {
    subscribers: number;
    maxSubscribers: number;
    emailsSentThisMonth: number;
    maxEmailsPerMonth: number;
    newslettersSent: number;
  };
}

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: 0,
    subscribers: 500,
    emails: "1,000/mo",
    features: ["Basic editor", "Public archive", "Email support"],
  },
  {
    key: "STARTER",
    name: "Starter",
    price: 9,
    subscribers: 2500,
    emails: "Unlimited",
    features: [
      "Everything in Free",
      "Custom templates",
      "Scheduling",
      "CSV import",
    ],
  },
  {
    key: "GROWTH",
    name: "Growth",
    price: 29,
    subscribers: 10000,
    emails: "Unlimited",
    features: [
      "Everything in Starter",
      "Advanced analytics",
      "Priority support",
      "Tags & segments",
    ],
    popular: true,
  },
  {
    key: "PRO",
    name: "Pro",
    price: 79,
    subscribers: 50000,
    emails: "Unlimited",
    features: [
      "Everything in Growth",
      "Custom domain",
      "API access",
      "Dedicated support",
    ],
  },
];

export function BillingView({ user, usage }: BillingViewProps) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  const subscriberPercent = Math.min(
    (usage.subscribers / usage.maxSubscribers) * 100,
    100
  );

  const emailPercent =
    usage.maxEmailsPerMonth === -1
      ? 0
      : Math.min(
          (usage.emailsSentThisMonth / usage.maxEmailsPerMonth) * 100,
          100
        );

  async function handleUpgrade(plan: string) {
    setIsUpgrading(plan);
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout");
        return;
      }

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setIsUpgrading(null);
    }
  }

  async function handleManageSubscription() {
    setIsManaging(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to open billing portal");
        return;
      }

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setIsManaging(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Current Plan + Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <Badge variant="secondary" className="gap-1">
                <Crown className="h-3 w-3" />
                {user.plan}
              </Badge>
            </div>
            <CardDescription>
              {user.plan === "FREE"
                ? "You're on the free plan. Upgrade to unlock more features."
                : "Your subscription is active."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.plan !== "FREE" && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleManageSubscription}
                disabled={isManaging}
              >
                {isManaging ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Your current usage this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Subscribers
                </span>
                <span>
                  {usage.subscribers.toLocaleString()} /{" "}
                  {usage.maxSubscribers.toLocaleString()}
                </span>
              </div>
              <Progress value={subscriberPercent} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Emails this month
                </span>
                <span>
                  {usage.emailsSentThisMonth.toLocaleString()} /{" "}
                  {usage.maxEmailsPerMonth === -1
                    ? "Unlimited"
                    : usage.maxEmailsPerMonth.toLocaleString()}
                </span>
              </div>
              {usage.maxEmailsPerMonth !== -1 && (
                <Progress value={emailPercent} className="h-2" />
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {usage.newslettersSent} newsletters sent total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === user.plan;

            return (
              <Card
                key={plan.key}
                className={`relative ${
                  plan.popular
                    ? "border-primary shadow-md"
                    : ""
                } ${isCurrent ? "bg-primary/5" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      Popular
                    </span>
                  </div>
                )}
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold">
                        ${plan.price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-muted-foreground">
                          /mo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{plan.subscribers.toLocaleString()} subscribers</p>
                    <p>{plan.emails} emails</p>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.key === "FREE" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Free
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={isUpgrading !== null}
                    >
                      {isUpgrading === plan.key ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Upgrade
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
