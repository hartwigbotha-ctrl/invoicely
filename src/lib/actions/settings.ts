"use server";

import { db } from "@/db";
import { businesses, subscriptions, plans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireBusiness } from "@/lib/session";
import { revalidatePath } from "next/cache";

const MAX_LOGO_BYTES = 500 * 1024; // 500KB — keeps the PDF/email fast, plenty for a logo

export async function updateBusinessSettings(formData: FormData) {
  const { business } = await requireBusiness();

  const update: Record<string, unknown> = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || null,
    address: (formData.get("address") as string) || null,
    vatNumber: (formData.get("vatNumber") as string) || null,
    regNumber: (formData.get("regNumber") as string) || null,
    invoicePrefix: (formData.get("invoicePrefix") as string) || "INV",
    quotePrefix: (formData.get("quotePrefix") as string) || "QUO",
    currency: (formData.get("currency") as string) || "ZAR",
    defaultTaxRate: Number(formData.get("defaultTaxRate") || 0),
    paymentTermsDays: Number(formData.get("paymentTermsDays") || 7),
    bankDetails: (formData.get("bankDetails") as string) || null,
    brandColor: (formData.get("brandColor") as string) || "#111827",
    pdfTemplate: (formData.get("pdfTemplate") as string) || "modern",
    updatedAt: new Date().toISOString(),
  };

  // "Next invoice/quote number" — lets a business migrating from an old
  // system (spreadsheets, another tool) continue their existing numbering
  // instead of resetting to 0001. Only touch it if a valid positive number
  // was submitted, so leaving the field alone never breaks numbering.
  const nextInvoiceSeq = Number(formData.get("nextInvoiceSeq"));
  if (Number.isFinite(nextInvoiceSeq) && nextInvoiceSeq >= 1) {
    update.nextInvoiceSeq = Math.floor(nextInvoiceSeq);
  }
  const nextQuoteSeq = Number(formData.get("nextQuoteSeq"));
  if (Number.isFinite(nextQuoteSeq) && nextQuoteSeq >= 1) {
    update.nextQuoteSeq = Math.floor(nextQuoteSeq);
  }

  // Logo upload is optional on every save — only touch logoUrl if a new
  // file was actually picked, or if the user explicitly asked to remove it.
  const removeLogo = formData.get("removeLogo") === "1";
  const logoFile = formData.get("logo");
  if (removeLogo) {
    update.logoUrl = null;
  } else if (logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_BYTES) {
      throw new Error("Logo image is too large — please use one under 500KB.");
    }
    if (!logoFile.type.startsWith("image/")) {
      throw new Error("Logo must be an image file.");
    }
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    update.logoUrl = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
  }

  await db.update(businesses).set(update).where(eq(businesses.id, business.id));

  revalidatePath("/settings");
  revalidatePath("/invoices");
}

/**
 * Manual plan switch — admin/testing fallback ONLY, from before PayFast was
 * wired up. Real billing is live now (see build notes), so this can no
 * longer be reachable in production: it would let any logged-in business
 * grant themselves an "active" subscription without ever paying, which is
 * exactly the "you can access the whole app without subscribing" bug
 * Hartwig flagged. Restricted to non-production so it still works for local
 * testing/demoing Pro/Business features.
 */
export async function setPlanManually(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Manual plan switching is disabled in production. Subscribe via PayFast instead.");
  }

  const { business } = await requireBusiness();
  const planName = formData.get("planName") as string;

  const plan = await db.query.plans.findFirst({ where: eq(plans.name, planName) });
  if (!plan) throw new Error("Unknown plan");

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.businessId, business.id),
    orderBy: desc(subscriptions.createdAt),
  });

  const now = new Date().toISOString();
  if (existing) {
    await db
      .update(subscriptions)
      .set({ planId: plan.id, status: "active", canceledAt: null, updatedAt: now })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      businessId: business.id,
      planId: plan.id,
      status: "active",
    });
  }

  revalidatePath("/settings");
  revalidatePath("/imports");
}
