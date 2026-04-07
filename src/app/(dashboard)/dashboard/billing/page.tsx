import { requireAuth } from "@/lib/auth-helpers";

export default async function BillingPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing details
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <div className="rounded-lg border p-6 space-y-4">
          <h3 className="font-semibold">Current Plan</h3>
          <p className="text-sm text-muted-foreground">
            Your billing information and plan details are managed through Stripe.
            Use the buttons below to upgrade your plan or manage your subscription.
          </p>
          <div className="flex gap-3">
            <form action="/api/stripe/checkout-session" method="POST">
              <input type="hidden" name="plan" value="STARTER" />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Upgrade Plan
              </button>
            </form>
            <form action="/api/billing/portal" method="POST">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Manage Subscription
              </button>
            </form>
          </div>
        </div>

        {/* Plan Features */}
        <div className="rounded-lg border p-6 space-y-4">
          <h3 className="font-semibold">Plan Tiers</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Free</span>
              <span className="text-muted-foreground">500 subscribers</span>
            </div>
            <div className="flex justify-between">
              <span>Starter - $9/mo</span>
              <span className="text-muted-foreground">2,500 subscribers</span>
            </div>
            <div className="flex justify-between">
              <span>Growth - $29/mo</span>
              <span className="text-muted-foreground">10,000 subscribers</span>
            </div>
            <div className="flex justify-between">
              <span>Pro - $79/mo</span>
              <span className="text-muted-foreground">50,000 subscribers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
