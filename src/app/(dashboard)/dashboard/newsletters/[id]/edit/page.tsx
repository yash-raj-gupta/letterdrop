import type { Metadata } from "next";
import { NewsletterEditor } from "@/components/dashboard/newsletter-editor";

export const metadata: Metadata = {
  title: "Edit Newsletter",
};

export default async function EditNewsletterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NewsletterEditor newsletterId={id} />;
}
