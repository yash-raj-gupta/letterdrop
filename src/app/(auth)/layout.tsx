import Link from "next/link";
import { Send } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary-foreground/10 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              <Send className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold">LetterDrop</span>
          </Link>
          <div className="space-y-6">
            <blockquote className="text-2xl font-medium leading-relaxed">
              &ldquo;LetterDrop made it incredibly easy to start my newsletter.
              I went from zero to 1,000 subscribers in just two months.&rdquo;
            </blockquote>
            <div>
              <p className="font-semibold">Sarah Chen</p>
              <p className="text-primary-foreground/60">
                Creator, The Weekly Brief
              </p>
            </div>
          </div>
          <p className="text-sm text-primary-foreground/40">
            &copy; 2024 LetterDrop. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Send className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LetterDrop</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
