"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Crown } from "lucide-react";
import { toast } from "sonner";
import { PLAN_LIMITS } from "@/lib/constants";

interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  brandName: string | null;
  senderName: string | null;
  senderEmail: string | null;
  bio: string | null;
  plan: keyof typeof PLAN_LIMITS;
}

interface SettingsViewProps {
  user: User;
}

export function SettingsView({ user }: SettingsViewProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(user.name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [brandName, setBrandName] = useState(user.brandName ?? "");
  const [senderName, setSenderName] = useState(user.senderName ?? "");
  const [senderEmail, setSenderEmail] = useState(user.senderEmail ?? "");
  const [bio, setBio] = useState(user.bio ?? "");

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim() || undefined,
          brandName: brandName.trim() || undefined,
          senderName: senderName.trim() || undefined,
          senderEmail: senderEmail.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save settings");
        return;
      }

      // Update the session with new name
      await update({ name: name.trim() });

      toast.success("Settings saved successfully");
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  const planInfo = PLAN_LIMITS[user.plan];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and newsletter preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your personal information and public profile details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                letterdrop.com/
              </span>
              <Input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                }
                placeholder="your-username"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This is your public newsletter URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your readers about yourself..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Newsletter Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Settings</CardTitle>
          <CardDescription>
            Configure how your newsletters appear to subscribers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand / Newsletter Name</Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="My Newsletter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="John Doe"
              />
              <p className="text-xs text-muted-foreground">
                Displayed as &ldquo;From&rdquo; in emails
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderEmail">Sender Email</Label>
            <Input
              id="senderEmail"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="hello@yourdomain.com"
            />
            <p className="text-xs text-muted-foreground">
              You&apos;ll need to verify this domain before sending. See the
              setup guide for details.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan</CardTitle>
              <CardDescription>
                Your current plan and usage limits.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Crown className="h-3 w-3" />
              {user.plan}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Max Subscribers</p>
              <p className="text-2xl font-bold mt-1">
                {planInfo.maxSubscribers.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Emails / Month
              </p>
              <p className="text-2xl font-bold mt-1">
                {planInfo.maxEmailsPerMonth === -1
                  ? "Unlimited"
                  : planInfo.maxEmailsPerMonth.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Features</p>
              <p className="text-sm mt-1">{planInfo.features.length} included</p>
            </div>
          </div>
          {user.plan === "FREE" && (
            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium">Need more?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade your plan to unlock more subscribers, unlimited emails,
                and premium features.
              </p>
              <Button size="sm" className="mt-3 gap-1">
                <Crown className="h-3.5 w-3.5" />
                Upgrade Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
