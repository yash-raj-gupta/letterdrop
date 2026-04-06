import type { Metadata } from "next";
import { SettingsView } from "@/components/dashboard/settings-view";
import { getCurrentUser } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return <SettingsView user={user} />;
}
