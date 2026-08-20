import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Plans that include the "advanced bookkeeping" tier of features — bulk
// document import and (later) QuickBooks/Xero sync.
const PRO_TIER_PLANS = new Set(["Pro", "Business"]);

/** The business's current plan name (e.g. "Starter"), or null if they have no subscription yet. */
export async function getCurrentPlanName(businessId: string): Promise<string | null> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.businessId, businessId),
    orderBy: desc(subscriptions.createdAt),
    with: { plan: true },
  });
  if (!sub || sub.status === "canceled") return null;
  return sub.plan?.name ?? null;
}

/** True if the business is on Pro or Business — gates bulk document import, bookkeeping sync, etc. */
export async function hasProAccess(businessId: string): Promise<boolean> {
  const planName = await getCurrentPlanName(businessId);
  return planName ? PRO_TIER_PLANS.has(planName) : false;
}
