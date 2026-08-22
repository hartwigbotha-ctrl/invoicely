import { db } from "@/db";
import { subscriptions, invoices, quotes } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { formatISO, startOfMonth } from "date-fns";

// Plans that include the "advanced bookkeeping" tier of features — bulk
// document import and (later) QuickBooks/Xero sync.
const PRO_TIER_PLANS = new Set(["Pro", "Business"]);

/** The business's current plan (name + limits), or null if they have no subscription yet. */
export async function getCurrentPlan(businessId: string) {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.businessId, businessId),
    orderBy: desc(subscriptions.createdAt),
    with: { plan: true },
  });
  if (!sub || sub.status === "canceled") return null;
  return sub.plan ?? null;
}

/** The business's current plan name (e.g. "Starter"), or null if they have no subscription yet. */
export async function getCurrentPlanName(businessId: string): Promise<string | null> {
  const plan = await getCurrentPlan(businessId);
  return plan?.name ?? null;
}

/** True if the business is on Pro or Business — gates bulk document import, bookkeeping sync, etc. */
export async function hasProAccess(businessId: string): Promise<boolean> {
  const planName = await getCurrentPlanName(businessId);
  return planName ? PRO_TIER_PLANS.has(planName) : false;
}

export type DocumentLimitCheck =
  | { ok: true }
  | { ok: false; limit: number; planName: string };

/**
 * Checks whether creating one more invoice/quote would put the business
 * over its plan's combined monthly document limit (Starter = 5 invoices +
 * quotes per calendar month; Pro/Business are unlimited). Call this before
 * inserting a new invoice or quote — never for edits to existing ones.
 *
 * Returns a result instead of throwing: Next.js strips the message off
 * errors thrown inside Server Actions in production builds (replacing it
 * with a generic "Something went wrong"), so a thrown error here would
 * never actually reach the user. The caller should redirect to a page that
 * reads the { ok: false } details and renders a proper upgrade banner.
 */
export async function checkMonthlyDocumentLimit(businessId: string): Promise<DocumentLimitCheck> {
  const plan = await getCurrentPlan(businessId);
  const limit = plan?.invoiceLimit;
  if (limit == null) return { ok: true }; // no plan yet, or plan has no cap — unlimited

  const monthStart = formatISO(startOfMonth(new Date()));

  const [invoiceRows, quoteRows] = await Promise.all([
    db.query.invoices.findMany({
      where: and(eq(invoices.businessId, businessId), gte(invoices.createdAt, monthStart)),
      columns: { id: true },
    }),
    db.query.quotes.findMany({
      where: and(eq(quotes.businessId, businessId), gte(quotes.createdAt, monthStart)),
      columns: { id: true },
    }),
  ]);

  const usedThisMonth = invoiceRows.length + quoteRows.length;
  if (usedThisMonth >= limit) {
    return { ok: false, limit, planName: plan?.name ?? "Starter" };
  }
  return { ok: true };
}
