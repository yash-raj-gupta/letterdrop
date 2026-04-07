import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/constants";
import { BillingView } from "@/components/dashboard/billing-view";

export default async function BillingPage() {
  const user = await getCurrentUser();

  // Get usage stats
  const [subscriberCount, newsletterCount, sendCount] = await Promise.all([
    prisma.subscriber.count({
      where: { userId: user.id, status: "ACTIVE" },
    }),
    prisma.newsletter.count({
      where: { userId: user.id, status: "SENT" },
    }),
    prisma.send.count({
      where: {
        newsletter: { userId: user.id },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  const plan = user.plan as keyof typeof PLAN_LIMITS;
  const planLimits = PLAN_LIMITS[plan];

  return (
    <BillingView
      user={{
        plan,
        email: user.email,
      }}
      usage={{
        subscribers: subscriberCount,
        maxSubscribers: planLimits.maxSubscribers,
        emailsSentThisMonth: sendCount,
        maxEmailsPerMonth: planLimits.maxEmailsPerMonth,
        newslettersSent: newsletterCount,
      }}
    />
  );
}
