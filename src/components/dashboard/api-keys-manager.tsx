"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Key,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/api-keys");
      const data = await res.json();
      if (data.success) {
        setKeys(data.data.apiKeys);
      }
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          expiresAt: newKeyExpiry || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create API key");
        return;
      }

      setCreatedKey(data.data.key);
      setNewKeyName("");
      setNewKeyExpiry("");
      fetchKeys();
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete API key "${name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete API key");
        return;
      }
      toast.success("API key deleted");
      fetchKeys();
    } catch {
      toast.error("Failed to delete API key");
    }
  }

  async function handleCopyKey() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  }

  function handleCloseCreate() {
    setIsCreateOpen(false);
    setCreatedKey(null);
    setCopied(false);
    setNewKeyName("");
    setNewKeyExpiry("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for programmatic access to your data.
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            if (!open) handleCloseCreate();
            else setIsCreateOpen(true);
          }}>
            <DialogTrigger render={<Button size="sm" className="gap-1" />}>
              <Plus className="h-3.5 w-3.5" />
              New Key
            </DialogTrigger>
            <DialogContent>
              {createdKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>
                      Copy this key now. It will not be shown again.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2 rounded-md bg-muted p-3">
                      <code className="flex-1 text-xs break-all font-mono">
                        {createdKey}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={handleCopyKey}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 rounded-md p-3">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Store this key securely. You won&apos;t be able to see
                        it again.
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
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Generate a new API key for programmatic access.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="key-name">Name *</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., Production, CI/CD"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="key-expiry">Expiration (optional)</Label>
                      <Input
                        id="key-expiry"
                        type="date"
                        value={newKeyExpiry}
                        onChange={(e) => setNewKeyExpiry(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseCreate}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!newKeyName.trim() || isCreating}
                    >
                      {isCreating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Key
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
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No API keys yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{key.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Created{" "}
                      {formatDistanceToNow(new Date(key.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {key.lastUsedAt && (
                      <span>
                        Last used{" "}
                        {formatDistanceToNow(new Date(key.lastUsedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                    {key.expiresAt && (
                      <span>
                        Expires{" "}
                        {formatDistanceToNow(new Date(key.expiresAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(key.id, key.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
