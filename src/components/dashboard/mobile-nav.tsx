"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  LayoutDashboard,
  Mail,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  PenSquare,
  BarChart3,
  CreditCard,
  Zap,
} from "lucide-react";

interface MobileNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Newsletters", href: "/dashboard/newsletters", icon: Mail },
  { label: "Subscribers", href: "/dashboard/subscribers", icon: Users },
  { label: "Templates", href: "/dashboard/templates", icon: FileText },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Automations", href: "/dashboard/automations", icon: Zap },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-16 items-center gap-2 px-6 border-b">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Send className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">LetterDrop</span>
          </div>

          <div className="px-4 pt-6 pb-2">
            <Link
              href="/dashboard/newsletters/new"
              onClick={() => setOpen(false)}
            >
              <Button className="w-full justify-start gap-2" size="sm">
                <PenSquare className="h-4 w-4" />
                New Newsletter
              </Button>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Separator />

          <div className="p-4 space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.name ?? "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Send className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="font-bold">LetterDrop</span>
      </Link>
    </header>
  );
}
