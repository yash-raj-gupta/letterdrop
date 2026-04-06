import type { Metadata } from "next";
import { NewsletterEditor } from "@/components/dashboard/newsletter-editor";

export const metadata: Metadata = {
  title: "New Newsletter",
};

export default function NewNewsletterPage() {
  return <NewsletterEditor />;
}
