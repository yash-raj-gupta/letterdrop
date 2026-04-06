"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Eye,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Image,
  AlignLeft,
  AlignCenter,
  Heading1,
  Heading2,
  Quote,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface NewsletterEditorProps {
  newsletterId?: string;
}

export function NewsletterEditor({ newsletterId }: NewsletterEditorProps) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(!!newsletterId);
  const [currentId, setCurrentId] = useState(newsletterId);
  const [activeTab, setActiveTab] = useState("write");

  // Load existing newsletter
  useEffect(() => {
    if (!newsletterId) return;

    async function load() {
      try {
        const res = await fetch(`/api/newsletters/${newsletterId}`);
        const data = await res.json();

        if (data.success) {
          setSubject(data.data.subject);
          setPreviewText(data.data.previewText ?? "");
          setHtmlContent(data.data.htmlContent ?? "");
        } else {
          toast.error("Newsletter not found");
          router.push("/dashboard/newsletters");
        }
      } catch {
        toast.error("Failed to load newsletter");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [newsletterId, router]);

  const handleSave = useCallback(async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject line");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        subject: subject.trim(),
        previewText: previewText.trim() || undefined,
        htmlContent,
        content: { html: htmlContent },
      };

      let res: Response;

      if (currentId) {
        res = await fetch(`/api/newsletters/${currentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/newsletters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }

      if (!currentId) {
        setCurrentId(data.data.id);
        // Update URL without full navigation
        window.history.replaceState(
          null,
          "",
          `/dashboard/newsletters/${data.data.id}/edit`
        );
      }

      toast.success("Newsletter saved");
    } catch {
      toast.error("Failed to save newsletter");
    } finally {
      setIsSaving(false);
    }
  }, [subject, previewText, htmlContent, currentId]);

  async function handleSend() {
    if (!currentId) {
      // Save first
      await handleSave();
      if (!currentId) return;
    }

    const confirmed = window.confirm(
      "Send this newsletter to all active subscribers?"
    );
    if (!confirmed) return;

    setIsSending(true);

    try {
      // Save latest changes first
      if (subject.trim()) {
        await fetch(`/api/newsletters/${currentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: subject.trim(),
            previewText: previewText.trim() || undefined,
            htmlContent,
            content: { html: htmlContent },
          }),
        });
      }

      const res = await fetch(`/api/newsletters/${currentId}/send`, {
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
      router.push("/dashboard/newsletters");
    } catch {
      toast.error("Failed to send newsletter");
    } finally {
      setIsSending(false);
    }
  }

  // Keyboard shortcut for save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/newsletters">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">
            {newsletterId ? "Edit Newsletter" : "New Newsletter"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim()}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </Button>
        </div>
      </div>

      {/* Subject & Preview */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line *</Label>
            <Input
              id="subject"
              placeholder="Your newsletter subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-lg h-12 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preview">
              Preview Text{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="preview"
              placeholder="Brief description shown in email clients..."
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between px-4 pt-4">
              <TabsList>
                <TabsTrigger value="write" className="gap-1.5">
                  <AlignLeft className="h-3.5 w-3.5" />
                  Write
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <Separator className="mt-4" />

            {/* Toolbar */}
            {activeTab === "write" && (
              <>
                <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto border-b">
                  <ToolbarButton icon={Bold} label="Bold" />
                  <ToolbarButton icon={Italic} label="Italic" />
                  <ToolbarButton icon={Underline} label="Underline" />
                  <div className="w-px h-6 bg-border mx-1" />
                  <ToolbarButton icon={Heading1} label="Heading 1" />
                  <ToolbarButton icon={Heading2} label="Heading 2" />
                  <div className="w-px h-6 bg-border mx-1" />
                  <ToolbarButton icon={List} label="Bullet List" />
                  <ToolbarButton icon={ListOrdered} label="Numbered List" />
                  <ToolbarButton icon={Quote} label="Quote" />
                  <div className="w-px h-6 bg-border mx-1" />
                  <ToolbarButton icon={Link2} label="Link" />
                  <ToolbarButton icon={Image} label="Image" />
                  <ToolbarButton icon={Minus} label="Divider" />
                  <div className="w-px h-6 bg-border mx-1" />
                  <ToolbarButton icon={AlignLeft} label="Align Left" />
                  <ToolbarButton icon={AlignCenter} label="Align Center" />
                </div>
              </>
            )}

            <TabsContent value="write" className="mt-0">
              <Textarea
                placeholder="Start writing your newsletter content here...

You can use HTML to format your email content. The toolbar above provides quick formatting options.

Tips:
- Keep your newsletter concise and valuable
- Use headings to break up content
- Include a clear call-to-action
- Add images to make it visually appealing"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="min-h-[500px] border-0 rounded-none focus-visible:ring-0 resize-none text-base leading-relaxed p-6 font-sans"
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div className="p-6 min-h-[500px]">
                <div className="mx-auto max-w-2xl">
                  {/* Email Preview Container */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-6 py-4 border-b">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">
                            Subject:{" "}
                          </span>
                          <span className="font-medium">
                            {subject || "No subject"}
                          </span>
                        </p>
                        {previewText && (
                          <p className="text-sm text-muted-foreground">
                            {previewText}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-6 bg-white">
                      {htmlContent ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No content yet. Switch to the Write tab to start
                          creating your newsletter.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save hint */}
      <p className="text-xs text-center text-muted-foreground">
        Press{" "}
        <kbd className="px-1.5 py-0.5 rounded border bg-muted text-xs">
          Cmd+S
        </kbd>{" "}
        to save draft
      </p>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
