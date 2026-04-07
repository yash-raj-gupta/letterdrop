"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Webhook,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastSentAt: string | null;
  failCount: number;
  createdAt: string;
}

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      if (data.success) {
        setWebhooks(data.data.webhooks);
        setAvailableEvents(data.data.availableEvents);
      }
    } catch {
      toast.error("Failed to load webhooks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  function toggleEvent(event: string) {
    const next = new Set(selectedEvents);
    if (next.has(event)) {
      next.delete(event);
    } else {
      next.add(event);
    }
    setSelectedEvents(next);
  }

  async function handleCreate() {
    if (!newUrl.trim() || selectedEvents.size === 0) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          events: Array.from(selectedEvents),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create webhook");
        return;
      }

      setCreatedSecret(data.data.secret);
      fetchWebhooks();
    } catch {
      toast.error("Failed to create webhook");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch("/api/webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });

      if (!res.ok) {
        toast.error("Failed to update webhook");
        return;
      }

      toast.success(isActive ? "Webhook disabled" : "Webhook enabled");
      fetchWebhooks();
    } catch {
      toast.error("Failed to update webhook");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this webhook? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete webhook");
        return;
      }
      toast.success("Webhook deleted");
      fetchWebhooks();
    } catch {
      toast.error("Failed to delete webhook");
    }
  }

  async function handleCopySecret() {
    if (!createdSecret) return;
    await navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  }

  function handleCloseCreate() {
    setIsCreateOpen(false);
    setCreatedSecret(null);
    setCopied(false);
    setNewUrl("");
    setSelectedEvents(new Set());
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Receive real-time notifications when events happen.
            </CardDescription>
          </div>
          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              if (!open) handleCloseCreate();
              else setIsCreateOpen(true);
            }}
          >
            <DialogTrigger render={<Button size="sm" className="gap-1" />}>
              <Plus className="h-3.5 w-3.5" />
              New Webhook
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              {createdSecret ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Webhook Created</DialogTitle>
                    <DialogDescription>
                      Copy the signing secret. It will not be shown again.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Signing Secret</Label>
                      <div className="flex items-center gap-2 rounded-md bg-muted p-3">
                        <code className="flex-1 text-xs break-all font-mono">
                          {createdSecret}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={handleCopySecret}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 rounded-md p-3">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Use this secret to verify webhook signatures via the
                        X-Webhook-Signature header.
                      </span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseCreate}>Done</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create Webhook</DialogTitle>
                    <DialogDescription>
                      Configure a URL to receive event notifications.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Endpoint URL *</Label>
                      <Input
                        id="webhook-url"
                        type="url"
                        placeholder="https://your-app.com/webhook"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Events *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableEvents.map((event) => (
                          <label
                            key={event}
                            className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer text-xs transition-colors ${
                              selectedEvents.has(event)
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={selectedEvents.has(event)}
                              onChange={() => toggleEvent(event)}
                            />
                            {event}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseCreate}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={
                        !newUrl.trim() ||
                        selectedEvents.size === 0 ||
                        isCreating
                      }
                    >
                      {isCreating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Webhook
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : webhooks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No webhooks configured. Create one to receive event notifications.
          </p>
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{wh.url}</p>
                    <Badge
                      variant={wh.isActive ? "default" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {wh.isActive ? "Active" : "Disabled"}
                    </Badge>
                    {wh.failCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs text-red-600 border-red-300 shrink-0"
                      >
                        {wh.failCount} failures
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map((event) => (
                      <Badge
                        key={event}
                        variant="secondary"
                        className="text-xs"
                      >
                        {event}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {wh.lastSentAt
                      ? `Last sent ${formatDistanceToNow(new Date(wh.lastSentAt), { addSuffix: true })}`
                      : "Never sent"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleActive(wh.id, wh.isActive)}
                    title={wh.isActive ? "Disable" : "Enable"}
                  >
                    {wh.isActive ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(wh.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
