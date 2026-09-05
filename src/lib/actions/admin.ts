"use server";

import { db } from "@/db";
import { businesses, subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireBusiness } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { revalidatePath } from "next/cache";

type DeleteBusinessResult = { ok: true } | { ok: false; error: string };

/**
 * Permanently deletes a business and everything that belongs to it
 * (clients, invoices, quotes, items, recurring schedules, subscriptions,
 * support tickets — every table with a businessId foreign key cascades,
 * see src/db/schema.ts). There is no undo.
 *
 * Admin-only (same ADMIN_EMAIL gate as /admin), and requires the caller to
 * have typed the business's exact name as a confirmation — a click alone
 * isn't enough for something this destructive. Also refuses to delete a
 * business with a currently *active* paying subscription, so a fat-fingered
 * click on a real paying customer can't wipe their data; cancel the
 * subscription first (or use PayFast directly) if it really needs to go.
 */
export async function deleteBusinessAction(
  businessId: string,
  confirmName: string
): Promise<DeleteBusinessResult> {
  const { session } = await requireBusiness();
  const userEmail = session.user?.email ?? null;

  if (!isAdminEmail(userEmail)) {
    return { ok: false, error: "Not authorized." };
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
  });
  if (!business) {
    return { ok: false, error: "Business not found — it may already be deleted." };
  }

  if (confirmName.trim() !== business.name.trim()) {
    return { ok: false, error: "Business name didn't match — nothing was deleted." };
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.businessId, businessId),
    orderBy: desc(subscriptions.createdAt),
  });
  if (subscription?.status === "active") {
    return {
      ok: false,
      error:
        "This business has an active paying subscription — cancel it first (in PayFast or from Settings as that business) before deleting.",
    };
  }

  await db.delete(businesses).where(eq(businesses.id, businessId));

  revalidatePath("/admin");
  return { ok: true };
}
