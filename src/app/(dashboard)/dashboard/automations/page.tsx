import { requireAuth } from "@/lib/auth-helpers";

export default async function AutomationsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
        <p className="text-muted-foreground mt-1">
          Set up automated workflows triggered by subscriber actions
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold">Available Triggers</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border p-4 space-y-1">
            <p className="font-medium text-sm">Subscribe</p>
            <p className="text-xs text-muted-foreground">
              When someone subscribes to your newsletter
            </p>
          </div>
          <div className="rounded-md border p-4 space-y-1">
            <p className="font-medium text-sm">Unsubscribe</p>
            <p className="text-xs text-muted-foreground">
              When someone unsubscribes from your newsletter
            </p>
          </div>
          <div className="rounded-md border p-4 space-y-1">
            <p className="font-medium text-sm">Tag Added</p>
            <p className="text-xs text-muted-foreground">
              When a tag is added to a subscriber
            </p>
          </div>
          <div className="rounded-md border p-4 space-y-1">
            <p className="font-medium text-sm">Email Opened</p>
            <p className="text-xs text-muted-foreground">
              When a subscriber opens your email
            </p>
          </div>
          <div className="rounded-md border p-4 space-y-1">
            <p className="font-medium text-sm">Link Clicked</p>
            <p className="text-xs text-muted-foreground">
              When a subscriber clicks a link in your email
            </p>
          </div>
          <div className="rounded-md border p-4 space-y-1">
            <p className="font-medium text-sm">Date Reached</p>
            <p className="text-xs text-muted-foreground">
              At a specific date and time
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Use the API at <code>/api/automations</code> to create and manage automations programmatically.
        </p>
      </div>
    </div>
  );
}
