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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ListFilter,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CustomField {
  id: string;
  name: string;
  key: string;
  type: string;
  required: boolean;
  options: string[] | null;
  _count: { values: number };
}

const FIELD_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Select (single)" },
  { value: "MULTISELECT", label: "Multi-select" },
  { value: "BOOLEAN", label: "Boolean (yes/no)" },
];

export function CustomFieldsManager() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newType, setNewType] = useState("TEXT");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");

  const fetchFields = useCallback(async () => {
    try {
      const res = await fetch("/api/custom-fields");
      const data = await res.json();
      if (data.success) {
        setFields(data.data.fields);
      }
    } catch {
      toast.error("Failed to load custom fields");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // Auto-generate key from name
  function handleNameChange(value: string) {
    setNewName(value);
    const key = value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/^[^a-z]/, "");
    setNewKey(key);
  }

  async function handleCreate() {
    if (!newName.trim() || !newKey.trim()) return;
    setIsCreating(true);

    try {
      const body: Record<string, unknown> = {
        name: newName.trim(),
        key: newKey.trim(),
        type: newType,
        required: newRequired,
      };

      if (
        (newType === "SELECT" || newType === "MULTISELECT") &&
        newOptions.trim()
      ) {
        body.options = newOptions
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
      }

      const res = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create field");
        return;
      }

      toast.success(`Field "${newName}" created`);
      setIsCreateOpen(false);
      resetForm();
      fetchFields();
    } catch {
      toast.error("Failed to create field");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete custom field "${name}"? All associated data will be lost.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/custom-fields?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete field");
        return;
      }
      toast.success(`Field "${name}" deleted`);
      fetchFields();
    } catch {
      toast.error("Failed to delete field");
    }
  }

  function resetForm() {
    setNewName("");
    setNewKey("");
    setNewType("TEXT");
    setNewRequired(false);
    setNewOptions("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListFilter className="h-5 w-5" />
              Custom Fields
            </CardTitle>
            <CardDescription>
              Define custom data fields for your subscribers.
            </CardDescription>
          </div>
          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger render={<Button size="sm" className="gap-1" />}>
              <Plus className="h-3.5 w-3.5" />
              New Field
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Field</DialogTitle>
                <DialogDescription>
                  Add a new data field to collect from subscribers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="field-name">Display Name *</Label>
                  <Input
                    id="field-name"
                    placeholder="e.g., Company, Role"
                    value={newName}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-key">Field Key *</Label>
                  <Input
                    id="field-key"
                    placeholder="e.g., company, role"
                    value={newKey}
                    onChange={(e) =>
                      setNewKey(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "")
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and underscores only.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v ?? "TEXT")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(newType === "SELECT" || newType === "MULTISELECT") && (
                  <div className="space-y-2">
                    <Label htmlFor="field-options">
                      Options (comma-separated)
                    </Label>
                    <Input
                      id="field-options"
                      placeholder="Option 1, Option 2, Option 3"
                      value={newOptions}
                      onChange={(e) => setNewOptions(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="field-required"
                    checked={newRequired}
                    onChange={(e) => setNewRequired(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="field-required" className="text-sm">
                    Required field
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    !newName.trim() || !newKey.trim() || isCreating
                  }
                >
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Field
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No custom fields yet. Create one to collect extra data from
            subscribers.
          </p>
        ) : (
          <div className="space-y-3">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{field.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {field.type.toLowerCase()}
                    </Badge>
                    {field.required && (
                      <Badge
                        variant="outline"
                        className="text-xs text-amber-600 border-amber-300"
                      >
                        required
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Key: {field.key}</span>
                    <span>{field._count.values} values set</span>
                    {field.options && Array.isArray(field.options) && (
                      <span>
                        Options: {(field.options as string[]).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(field.id, field.name)}
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
