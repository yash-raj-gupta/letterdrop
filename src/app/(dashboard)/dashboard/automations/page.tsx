import { requireAuth } from "@/lib/auth-helpers";
import { AutomationsView } from "@/components/dashboard/automations-view";

export default async function AutomationsPage() {
  await requireAuth();

  return <AutomationsView />;
}
