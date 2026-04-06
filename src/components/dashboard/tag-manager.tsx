"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, X, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count: { subscribers: number };
}

interface TagManagerProps {
  onTagCreated?: (tag: Tag) => void;
}

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#84cc16", // Lime
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#64748b", // Slate
];

export function TagManager({ onTagCreated }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      if (data.success) {
        setTags(data.data);
      }
    } catch {
      console.error("Failed to fetch tags");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  async function handleCreateTag() {
    if (!newTagName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: selectedColor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create tag");
        return;
      }

      toast.success(`Tag "${newTagName}" created`);
      setTags([...tags, data.data]);
      onTagCreated?.(data.data);
      setNewTagName("");
      setSelectedColor(PRESET_COLORS[0]);
      setIsDialogOpen(false);
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteTag(id: string, name: string) {
    const confirmed = window.confirm(`Delete tag "${name}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tags?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete tag");
        return;
      }
      toast.success("Tag deleted");
      setTags(tags.filter((t) => t.id !== id));
    } catch {
      toast.error("Failed to delete tag");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Tags</span>
          <Badge variant="secondary" className="text-xs">
            {tags.length}
          </Badge>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={<Button variant="ghost" size="sm" className="h-7 px-2" />}
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
              <DialogDescription>
                Tags help you organize and segment your subscribers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  placeholder="e.g. VIP, Newsletter, Customers..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        selectedColor === color
                          ? "ring-2 ring-offset-2 ring-foreground scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || isCreating}
              >
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading tags...
        </div>
      ) : tags.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No tags yet. Create tags to organize your subscribers.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="group cursor-pointer gap-1 pr-1 hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                borderColor: tag.color,
              }}
              onClick={() => {}}
            >
              {tag.name}
              <span className="text-[10px] opacity-60">({tag._count.subscribers})</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTag(tag.id, tag.name);
                }}
                className="ml-0.5 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
