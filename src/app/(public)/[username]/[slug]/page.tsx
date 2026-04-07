import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Send, ArrowLeft, Calendar } from "lucide-react";
import { ShareButton } from "@/components/shared/share-button";
import { format } from "date-fns";
import { PublicSubscribeForm } from "@/components/shared/public-subscribe-form";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, brandName: true, name: true },
  });

  if (!user) return { title: "Not Found" };

  const newsletter = await prisma.newsletter.findFirst({
    where: { userId: user.id, slug, status: "SENT" },
    select: { subject: true, previewText: true },
  });

  if (!newsletter) return { title: "Not Found" };

  return {
    title: newsletter.subject,
    description:
      newsletter.previewText ||
      `Read "${newsletter.subject}" by ${user.brandName || user.name}`,
  };
}

export default async function PublicNewsletterPage({ params }: Props) {
  const { username, slug } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      brandName: true,
      username: true,
    },
  });

  if (!user) {
    notFound();
  }

  const newsletter = await prisma.newsletter.findFirst({
    where: {
      userId: user.id,
      slug,
      status: "SENT",
    },
    select: {
      id: true,
      subject: true,
      previewText: true,
      htmlContent: true,
      sentAt: true,
    },
  });

  if (!newsletter) {
    notFound();
  }

  const displayName = user.brandName || user.name || user.username;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="container mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link
            href={`/${username}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {displayName}
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        {/* Newsletter Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {newsletter.subject}
          </h1>
          {newsletter.previewText && (
            <p className="text-lg text-muted-foreground mt-2">
              {newsletter.previewText}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Send className="h-3 w-3 text-primary-foreground" />
              </div>
              {displayName}
            </span>
            {newsletter.sentAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(newsletter.sentAt), "MMMM d, yyyy")}
              </span>
            )}
          </div>
        </div>

        {/* Newsletter Content */}
        <article className="prose prose-lg max-w-none mb-16">
          {newsletter.htmlContent ? (
            <div dangerouslySetInnerHTML={{ __html: newsletter.htmlContent }} />
          ) : (
            <p className="text-muted-foreground">No content available.</p>
          )}
        </article>

        {/* Subscribe CTA */}
        <div className="border-t pt-8">
          <div className="rounded-2xl bg-muted/50 p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold">
              Enjoyed this? Subscribe for more.
            </h2>
            <p className="text-muted-foreground">
              Get {displayName}&apos;s newsletter delivered to your inbox.
            </p>
            <div className="flex justify-center">
              <PublicSubscribeForm username={user.username!} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto max-w-3xl px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <Link href="/" className="underline hover:text-foreground">
              LetterDrop
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
