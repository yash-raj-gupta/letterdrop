import { requireAuth } from "@/lib/auth-helpers";
import { AnalyticsView } from "@/components/dashboard/analytics-view";

export default async function AnalyticsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <AnalyticsView />
    </div>
  );
}
