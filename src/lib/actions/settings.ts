"use server";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    currency: (formData.get("currency") as string) || "ZAR",
    defaultTaxRate: Number(formData.get("defaultTaxRate") || 0),
    paymentTermsDays: Number(formData.get("paymentTermsDays") || 7),
    bankDetails: (formData.get("bankDetails") as string) || null,
    brandColor: (formData.get("brandColor") as string) || "#111827",
    pdfTemplate: (formData.get("pdfTemplate") as string) || "modern",
    updatedAt: new Date().toISOString(),
  };

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
