"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  Power,
  PowerOff,
  ArrowRight,
  Mail,
  Tag,
  Clock,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AutomationAction {
  id: string;
  type: string;
  order: number;
  delayHours: number;
  config: Record<string, unknown>;
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  triggerData: Record<string, unknown>;
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: string;
}

const TRIGGERS = [
  {
    value: "SUBSCRIBE",
    label: "Subscribe",
    description: "When someone subscribes",
  },
  {
    value: "UNSUBSCRIBE",
    label: "Unsubscribe",
    description: "When someone unsubscribes",
  },
  {
    value: "TAG_ADDED",
    label: "Tag Added",
    description: "When a tag is added to a subscriber",
  },
  {
    value: "TAG_REMOVED",
    label: "Tag Removed",
    description: "When a tag is removed from a subscriber",
  },
  {
    value: "EMAIL_OPENED",
    label: "Email Opened",
    description: "When a subscriber opens your email",
  },
  {
    value: "LINK_CLICKED",
    label: "Link Clicked",
    description: "When a subscriber clicks a link",
  },
  {
    value: "DATE_REACHED",
    label: "Date Reached",
    description: "At a specific date and time",
  },
];

const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Send Email", icon: Mail },
  { value: "ADD_TAG", label: "Add Tag", icon: Tag },
  { value: "REMOVE_TAG", label: "Remove Tag", icon: Tag },
  { value: "WAIT", label: "Wait", icon: Clock },
  { value: "WEBHOOK", label: "Webhook", icon: Webhook },
];

interface ActionConfig {
  type: string;
  delayHours: number;
  config: Record<string, string>;
}

export function AutomationsView() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("SUBSCRIBE");
  const [newActions, setNewActions] = useState<ActionConfig[]>([
    { type: "SEND_EMAIL", delayHours: 0, config: { subject: "", html: "" } },
  ]);

  const fetchAutomations = useCallback(async () => {
    try {
      const res = await fetch("/api/automations");
      const data = await res.json();
      if (data.success) {
        setAutomations(data.data.automations);
      }
    } catch {
      toast.error("Failed to load automations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  function addAction() {
    setNewActions([
      ...newActions,
      { type: "SEND_EMAIL", delayHours: 0, config: { subject: "", html: "" } },
    ]);
  }

  function removeAction(index: number) {
    setNewActions(newActions.filter((_, i) => i !== index));
  }

  function updateAction(index: number, updates: Partial<ActionConfig>) {
    setNewActions(
      newActions.map((a, i) => (i === index ? { ...a, ...updates } : a))
    );
  }

  function updateActionConfig(index: number, key: string, value: string) {
    const action = newActions[index];
    setNewActions(
      newActions.map((a, i) =>
        i === index ? { ...a, config: { ...action.config, [key]: value } } : a
      )
    );
  }

  async function handleCreate() {
    if (!newName.trim() || newActions.length === 0) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          trigger: newTrigger,
          triggerData: {},
          actions: newActions.map((a, i) => ({
            type: a.type,
            order: i,
            delayHours: a.delayHours,
            config: a.config,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create automation");
        return;
      }

      toast.success("Automation created");
      handleCloseCreate();
      fetchAutomations();
    } catch {
      toast.error("Failed to create automation");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      const res = await fetch("/api/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });

      if (!res.ok) {
        toast.error("Failed to update automation");
        return;
      }

      toast.success(isActive ? "Automation paused" : "Automation activated");
      fetchAutomations();
    } catch {
      toast.error("Failed to update automation");
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete automation "${name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/automations?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete automation");
        return;
      }
      toast.success("Automation deleted");
      fetchAutomations();
    } catch {
      toast.error("Failed to delete automation");
    }
  }

  function handleCloseCreate() {
    setIsCreateOpen(false);
    setNewName("");
    setNewTrigger("SUBSCRIBE");
    setNewActions([
      { type: "SEND_EMAIL", delayHours: 0, config: { subject: "", html: "" } },
    ]);
  }

  function getTriggerLabel(trigger: string) {
    return TRIGGERS.find((t) => t.value === trigger)?.label ?? trigger;
  }

  function getActionLabel(type: string) {
    return ACTION_TYPES.find((a) => a.value === type)?.label ?? type;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground mt-1">
            Set up automated workflows triggered by subscriber actions
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseCreate();
            else setIsCreateOpen(true);
          }}
        >
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="h-4 w-4" />
            New Automation
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Automation</DialogTitle>
              <DialogDescription>
                Define a trigger and actions for your automation workflow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="auto-name">Name *</Label>
                <Input
                  id="auto-name"
                  placeholder="e.g., Welcome Series, Re-engagement"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              {/* Trigger */}
              <div className="space-y-2">
                <Label>Trigger *</Label>
                <Select value={newTrigger} onValueChange={(v) => setNewTrigger(v ?? "SUBSCRIBE")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map((trigger) => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        <div>
                          <span>{trigger.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            - {trigger.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Actions</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAction}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Action
                  </Button>
                </div>

                {newActions.map((action, index) => (
                  <div
                    key={index}
                    className="rounded-md border p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Step {index + 1}
                      </span>
                      {newActions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeAction(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <Select
                      value={action.type}
                      onValueChange={(v) =>
                        updateAction(index, { type: v ?? "SEND_EMAIL" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {action.type === "SEND_EMAIL" && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Email subject"
                          value={action.config.subject || ""}
                          onChange={(e) =>
                            updateActionConfig(
                              index,
                              "subject",
                              e.target.value
                            )
                          }
                        />
                        <Input
                          placeholder="HTML body (or simple text)"
                          value={action.config.html || ""}
                          onChange={(e) =>
                            updateActionConfig(index, "html", e.target.value)
                          }
                        />
                      </div>
                    )}

                    {(action.type === "ADD_TAG" ||
                      action.type === "REMOVE_TAG") && (
                      <Input
                        placeholder="Tag ID"
                        value={action.config.tagId || ""}
                        onChange={(e) =>
                          updateActionConfig(index, "tagId", e.target.value)
                        }
                      />
                    )}

                    {action.type === "WEBHOOK" && (
                      <Input
                        placeholder="Webhook URL"
                        value={action.config.url || ""}
                        onChange={(e) =>
                          updateActionConfig(index, "url", e.target.value)
                        }
                      />
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">
                        Delay (hours, 0 = immediate)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={action.delayHours}
                        onChange={(e) =>
                          updateAction(index, {
                            delayHours: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseCreate}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !newName.trim() || newActions.length === 0 || isCreating
                }
              >
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Automation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-1">No automations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first automation to set up workflows.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <Card
              key={automation.id}
              className={`transition-shadow hover:shadow-md ${
                !automation.isActive ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{automation.name}</h3>
                      <Badge
                        variant={automation.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {automation.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>

                    {/* Trigger & Actions flow */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline" className="gap-1">
                        <Zap className="h-3 w-3" />
                        {getTriggerLabel(automation.trigger)}
                      </Badge>
                      {automation.actions.map((action, i) => (
                        <span key={action.id} className="flex items-center gap-1">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            {action.delayHours > 0 && (
                              <span className="mr-1">
                                +{action.delayHours}h
                              </span>
                            )}
                            {getActionLabel(action.type)}
                          </Badge>
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {formatDistanceToNow(new Date(automation.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        handleToggle(automation.id, automation.isActive)
                      }
                      title={automation.isActive ? "Pause" : "Activate"}
                    >
                      {automation.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() =>
                        handleDelete(automation.id, automation.name)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
