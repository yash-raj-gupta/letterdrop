import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribed",
};

export default function UnsubscribedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">You&apos;ve been unsubscribed</h1>
          <p className="text-muted-foreground">
            You will no longer receive newsletters. If this was a mistake, you
            can re-subscribe anytime from the newsletter page.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Send className="h-4 w-4" />
            Back to LetterDrop
          </Button>
        </Link>
      </div>
    </div>
  );
}
