import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LetterDrop - Simple Newsletter Platform",
    template: "%s | LetterDrop",
  },
  description:
    "The simplest way to build your email audience and send beautiful newsletters. No complexity, just results.",
  keywords: [
    "newsletter",
    "email marketing",
    "email newsletter",
    "newsletter platform",
    "email audience",
  ],
  authors: [{ name: "LetterDrop" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "LetterDrop",
    title: "LetterDrop - Simple Newsletter Platform",
    description:
      "The simplest way to build your email audience and send beautiful newsletters.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LetterDrop - Simple Newsletter Platform",
    description:
      "The simplest way to build your email audience and send beautiful newsletters.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
