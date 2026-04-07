"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import {
  Tag as TagIcon,
  Plus,
  X,
  Loader2,
  Palette,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { subscribers: number };
}

interface TagManagerProps {
  subscriberId?: string;
  subscriberTags?: { tag: Tag }[];
  onTagsChange?: () => void;
}

const TAG_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#64748b", // slate
];

export function TagManager({
  subscriberId,
  subscriberTags = [],
  onTagsChange,
}: TagManagerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      if (data.success) {
        setAllTags(data.data.tags);
      }
    } catch {
      console.error("Failed to fetch tags");
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create tag");
        return;
      }

      toast.success(`Tag "${newTagName}" created`);
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]);
      setIsCreateOpen(false);
      fetchTags();
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteTag(tagId: string, tagName: string) {
    const confirmed = window.confirm(
      `Delete tag "${tagName}"? This will remove it from all subscribers.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tags?id=${tagId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete tag");
        return;
      }
      toast.success(`Tag "${tagName}" deleted`);
      fetchTags();
      onTagsChange?.();
    } catch {
      toast.error("Failed to delete tag");
    }
  }

  async function handleToggleTag(tagId: string) {
    if (!subscriberId) return;
    setIsLoading(true);

    const hasTag = subscriberTags.some((st) => st.tag.id === tagId);

    try {
      const res = await fetch("/api/tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberId,
          tagId,
          action: hasTag ? "remove" : "add",
        }),
      });

      if (!res.ok) {
        toast.error("Failed to update tag");
        return;
      }

      onTagsChange?.();
    } catch {
      toast.error("Failed to update tag");
    } finally {
      setIsLoading(false);
    }
  }

  // If no subscriberId, show tag management (list all tags)
  if (!subscriberId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            Tags
          </h3>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1" />}>
              <Plus className="h-3.5 w-3.5" />
              New Tag
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tag</DialogTitle>
                <DialogDescription>
                  Create a new tag to organize your subscribers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tag name</Label>
                  <Input
                    id="tag-name"
                    placeholder="e.g., VIP, Newsletter, Beta"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 transition-transform ${
                          newTagColor === color
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
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

        {allTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tags yet. Create your first tag to organize subscribers.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="gap-1.5 pl-2 pr-1 py-1"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: `${tag.color}40`,
                }}
              >
                <Palette className="h-3 w-3" />
                {tag.name}
                {tag._count && (
                  <span className="text-xs opacity-70">
                    ({tag._count.subscribers})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  className="ml-1 rounded-full p-0.5 hover:bg-black/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show tag assignment for a specific subscriber
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Tags</p>
      <div className="flex flex-wrap gap-1.5">
        {subscriberTags.map((st) => (
          <Badge
            key={st.tag.id}
            variant="secondary"
            className="gap-1 text-xs cursor-pointer"
            style={{
              backgroundColor: `${st.tag.color}20`,
              color: st.tag.color,
              borderColor: `${st.tag.color}40`,
            }}
            onClick={() => handleToggleTag(st.tag.id)}
          >
            {st.tag.name}
            <X className="h-3 w-3" />
          </Badge>
        ))}

        {/* Available tags to add */}
        {allTags
          .filter((t) => !subscriberTags.some((st) => st.tag.id === t.id))
          .map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="gap-1 text-xs cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
              onClick={() => handleToggleTag(tag.id)}
            >
              <Plus className="h-3 w-3" />
              {tag.name}
            </Badge>
          ))}

        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    </div>
  );
}
