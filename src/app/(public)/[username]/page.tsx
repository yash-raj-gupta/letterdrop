import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { PublicSubscribeForm } from "@/components/shared/public-subscribe-form";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { brandName: true, name: true, bio: true },
  });

  if (!user) return { title: "Not Found" };

  const title = user.brandName || user.name || username;

  return {
    title: `${title} - Newsletter Archive`,
    description: user.bio || `Read past newsletters from ${title}`,
  };
}

export default async function PublicArchivePage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      brandName: true,
      bio: true,
      image: true,
      username: true,
    },
  });

  if (!user) {
    notFound();
  }

  const newsletters = await prisma.newsletter.findMany({
    where: {
      userId: user.id,
      status: "SENT",
    },
    orderBy: { sentAt: "desc" },
    select: {
      id: true,
      subject: true,
      previewText: true,
      slug: true,
      sentAt: true,
      _count: { select: { sends: true } },
    },
  });

  const subscriberCount = await prisma.subscriber.count({
    where: { userId: user.id, status: "ACTIVE" },
  });

  const displayName = user.brandName || user.name || user.username;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Send className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{displayName}</h1>
              {user.bio && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
        {/* Subscribe Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-semibold">Subscribe to {displayName}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Join {subscriberCount > 0 ? `${subscriberCount}+` : ""}{" "}
                  readers. No spam, unsubscribe anytime.
                </p>
              </div>
              <PublicSubscribeForm username={user.username!} />
            </div>
          </CardContent>
        </Card>

        {/* Newsletter Archive */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Past Issues ({newsletters.length})
          </h2>
          {newsletters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No newsletters published yet.</p>
              <p className="text-sm mt-1">
                Subscribe to be notified when the first issue goes out.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {newsletters.map((newsletter) => (
                <Link
                  key={newsletter.id}
                  href={`/${username}/${newsletter.slug}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {newsletter.subject}
                          </h3>
                          {newsletter.previewText && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {newsletter.previewText}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {newsletter.sentAt
                                ? format(
                                    new Date(newsletter.sentAt),
                                    "MMM d, yyyy"
                                  )
                                : "—"}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
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
