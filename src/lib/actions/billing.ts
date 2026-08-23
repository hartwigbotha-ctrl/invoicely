"use server";

import { db } from "@/db";
import { subscriptions, plans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireBusiness } from "@/lib/session";
import { redirect } from "next/navigation";
import { buildSubscribeUrl, cancelPayfastSubscription } from "@/lib/payfast";
import { revalidatePath } from "next/cache";

/**
 * Kicks off a PayFast subscription checkout for the given plan. Creates (or
 * reuses) a "incomplete" subscription row with a fresh checkout reference,
 * then redirects the browser straight to PayFast — the ITN webhook is what
 * actually flips the row to "active" once PayFast confirms the first
 * payment (see /api/webhooks/payfast).
 */
export async function startSubscriptionCheckout(formData: FormData) {
  const { business } = await requireBusiness();
  const planName = formData.get("planName") as string;

  const plan = await db.query.plans.findFirst({ where: eq(plans.name, planName) });
  if (!plan) throw new Error("Unknown plan");

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.businessId, business.id),
    orderBy: desc(subscriptions.createdAt),
  });

  const checkoutReference = crypto.randomUUID();

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        planId: plan.id,
        status: "incomplete",
        checkoutReference,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      businessId: business.id,
      planId: plan.id,
      status: "incomplete",
      checkoutReference,
    });
  }

  const url = buildSubscribeUrl({
    businessId: business.id,
    businessEmail: business.email,
    businessName: business.name,
    planName: plan.name,
    amountMonthly: plan.priceMonthly,
    checkoutReference,
  });

  redirect(url);
}

export type CancelSubscriptionResult = { ok: true } | { ok: false; error: string };

/** Cancels the business's active PayFast recurring subscription.
 *
 * Originally this only marked the row "canceled" once PayFast confirmed via
 * an ITN (payment_status=CANCELLED), on the theory that the ITN is always
 * the more trustworthy source. That reasoning holds for activation (an
 * unauthenticated incoming request claiming "payment succeeded" needs that
 * extra verification), but it doesn't apply here: a successful response
 * from cancelPayfastSubscription() IS PayFast directly, synchronously,
 * authenticating our own signed request and confirming the cancellation —
 * there's nothing left to double-check. Waiting on the ITN anyway left
 * cancellations stuck showing "active" whenever that follow-up webhook's
 * postback validation had a hiccup, even though PayFast had already
 * cancelled the subscription. So we flip the status here, synchronously,
 * the moment PayFast's API confirms it. The ITN handler still does the
 * same update if a CANCELLED notification does arrive later — harmless,
 * since it's the same status either way. */
export async function cancelSubscription(): Promise<CancelSubscriptionResult> {
  const { business } = await requireBusiness();

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.businessId, business.id),
    orderBy: desc(subscriptions.createdAt),
  });

  if (!subscription || !subscription.providerSubscriptionId) {
    return { ok: false, error: "No active PayFast subscription found to cancel." };
  }

  const ok = await cancelPayfastSubscription(subscription.providerSubscriptionId);
  if (!ok) {
    return {
      ok: false,
      error: "Couldn't cancel with PayFast right now. Please try again, or cancel directly from your PayFast account.",
    };
  }

  await db
    .update(subscriptions)
    .set({ status: "canceled", canceledAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(subscriptions.id, subscription.id));

  revalidatePath("/settings");
  return { ok: true };
}
