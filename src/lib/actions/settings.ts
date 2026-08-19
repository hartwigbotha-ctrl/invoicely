"use server";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireBusiness } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateBusinessSettings(formData: FormData) {
  const { business } = await requireBusiness();

  await db
    .update(businesses)
    .set({
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
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.id, business.id));

  revalidatePath("/settings");
}
