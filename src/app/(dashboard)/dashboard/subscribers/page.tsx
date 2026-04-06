import type { Metadata } from "next";
import { SubscribersView } from "@/components/dashboard/subscribers-view";

export const metadata: Metadata = {
  title: "Subscribers",
};

export default function SubscribersPage() {
  return <SubscribersView />;
}
