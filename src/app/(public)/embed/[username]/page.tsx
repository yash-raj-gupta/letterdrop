import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicSubscribeForm } from "@/components/shared/public-subscribe-form";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { brandName: true, name: true },
  });

  return {
    title: user
      ? `Subscribe to ${user.brandName || user.name || username}`
      : "Subscribe",
  };
}

export default async function EmbedSubscribePage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      brandName: true,
      username: true,
      bio: true,
    },
  });

  if (!user || !user.username) {
    notFound();
  }

  const displayName = user.brandName || user.name || user.username;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          {user.bio && (
            <p className="text-muted-foreground text-sm">{user.bio}</p>
          )}
        </div>

        <div className="rounded-lg border p-6 bg-card space-y-4">
          <p className="text-sm font-medium">
            Subscribe to get the latest updates
          </p>
          <PublicSubscribeForm username={user.username} />
        </div>

        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href={process.env.NEXT_PUBLIC_APP_URL || "/"}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            LetterDrop
          </a>
        </p>
      </div>
    </div>
  );
}
