import type { Metadata } from "next";
import { NewslettersView } from "@/components/dashboard/newsletters-view";

export const metadata: Metadata = {
  title: "Newsletters",
};

export default function NewslettersPage() {
  return <NewslettersView />;
}
