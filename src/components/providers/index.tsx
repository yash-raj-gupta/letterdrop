"use client";

import { SessionProvider } from "./session-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

interface Props {
  children: React.ReactNode;
}

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <TooltipProvider delay={0}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </SessionProvider>
  );
}
