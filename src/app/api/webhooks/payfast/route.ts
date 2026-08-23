import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, subscriptionPayments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyItnSignature, verifyItnWithPayfast } from "@/lib/payfast";
import { addMonths } from "date-fns";

// PayFast's Instant Transaction Notification (ITN) — a server-to-server
// POST PayFast sends whenever a subscription payment succeeds, fails, or a
// subscription is cancelled. This is what actually activates/deactivates a
// business's Nimblo subscription; the browser return_url the customer
// sees after checkout (/billing/success) is just UI, never trusted for
// activation, since a user can hit "back" or close the tab before it loads.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  const fields: Record<string, string> = {};
  for (const [key, value] of params.entries()) fields[key] = value;

  if (!verifyItnSignature(fields)) {
    console.error("[payfast itn] signature mismatch — ignoring", fields.m_payment_id);
    return new NextResponse("invalid signature", { status: 200 });
  }

  const postbackOk = await verifyItnWithPayfast(rawBody);
  if (!postbackOk) {
    console.error("[payfast itn] postback validation failed — ignoring", fields.m_payment_id);
    return new NextResponse("postback validation failed", { status: 200 });
  }

  const businessId = fields.custom_str1;
  const checkoutReference = fields.m_payment_id;
  const paymentStatus = fields.payment_status; // COMPLETE | FAILED | CANCELLED
  const pfPaymentId = fields.pf_payment_id;
  const amountGross = Number(fields.amount_gross || 0);
  const token = fields.token; // PayFast's recurring billing token, present on subscription ITNs

  if (!pfPaymentId) {
    console.error("[payfast itn] missing pf_payment_id, ignoring");
    return new NextResponse("missing pf_payment_id", { status: 200 });
  }

  // Find the subscription this ITN belongs to: prefer the exact checkout
  // reference (first payment), then the recurring token (subsequent
  // monthly charges reuse it), then fall back to the business's most
  // recent subscription row as a last resort.
  let subscription =
    (checkoutReference &&
      (await db.query.subscriptions.findFirst({
        where: eq(subscriptions.checkoutReference, checkoutReference),
      }))) ||
    (token &&
      (await db.query.subscriptions.findFirst({
        where: eq(subscriptions.providerSubscriptionId, token),
      }))) ||
    (businessId &&
      (await db.query.subscriptions.findFirst({
        where: eq(subscriptions.businessId, businessId),
        orderBy: desc(subscriptions.createdAt),
      })));

  if (!subscription) {
    console.error("[payfast itn] no matching subscription found", { businessId, checkoutReference, token });
    return new NextResponse("no matching subscription", { status: 200 });
  }

  // Log the event first, deduped by PayFast's own payment id — PayFast
  // retries ITNs that don't get a fast 200, so replays are expected and
  // must be harmless.
  try {
    await db.insert(subscriptionPayments).values({
      subscriptionId: subscription.id,
      pfPaymentId,
      paymentStatus: paymentStatus || "UNKNOWN",
      amountGross,
      rawPayload: JSON.stringify(fields),
    });
  } catch {
    // Unique constraint on pfPaymentId — we've already processed this
    // exact notification, nothing more to do.
    return new NextResponse("OK (duplicate)", { status: 200 });
  }

  const now = new Date().toISOString();

  if (paymentStatus === "COMPLETE") {
    await db
      .update(subscriptions)
      .set({
        status: "active",
        provider: "payfast",
        providerSubscriptionId: token || subscription.providerSubscriptionId,
        providerCustomerId: fields.email_address || subscription.providerCustomerId,
        currentPeriodStart: now,
        currentPeriodEnd: addMonths(new Date(), 1).toISOString(),
        canceledAt: null,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscription.id));
  } else if (paymentStatus === "FAILED") {
    await db
      .update(subscriptions)
      .set({ status: "past_due", updatedAt: now })
      .where(eq(subscriptions.id, subscription.id));
  } else if (paymentStatus === "CANCELLED") {
    await db
      .update(subscriptions)
      .set({ status: "canceled", canceledAt: now, updatedAt: now })
      .where(eq(subscriptions.id, subscription.id));
  } else {
    console.error("[payfast itn] unrecognised payment_status", paymentStatus);
  }

  return new NextResponse("OK", { status: 200 });
}
