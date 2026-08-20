"use server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireBusiness } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().optional(),
  vatNumber: z.string().optional(),
  customPaymentTermsDays: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

function parseClientForm(formData: FormData) {
  const customPaymentTerms = formData.get("customPaymentTermsDays");
  return clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    address: formData.get("address") || undefined,
    contactName: formData.get("contactName") || undefined,
    phone: formData.get("phone") || undefined,
    mobile: formData.get("mobile") || undefined,
    website: formData.get("website") || undefined,
    vatNumber: formData.get("vatNumber") || undefined,
    customPaymentTermsDays:
      customPaymentTerms && customPaymentTerms !== "" ? Number(customPaymentTerms) : undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createClient(formData: FormData) {
  const { business } = await requireBusiness();
  const parsed = parseClientForm(formData);

  await db.insert(clients).values({
    businessId: business.id,
    name: parsed.name,
    email: parsed.email || null,
    address: parsed.address || null,
    contactName: parsed.contactName || null,
    phone: parsed.phone || null,
    mobile: parsed.mobile || null,
    website: parsed.website || null,
    vatNumber: parsed.vatNumber || null,
    customPaymentTermsDays: parsed.customPaymentTermsDays ?? null,
    notes: parsed.notes || null,
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(clientId: string, formData: FormData) {
  const { business } = await requireBusiness();
  const parsed = parseClientForm(formData);

  await db
    .update(clients)
    .set({
      name: parsed.name,
      email: parsed.email || null,
      address: parsed.address || null,
      contactName: parsed.contactName || null,
      phone: parsed.phone || null,
      mobile: parsed.mobile || null,
      website: parsed.website || null,
      vatNumber: parsed.vatNumber || null,
      customPaymentTermsDays: parsed.customPaymentTermsDays ?? null,
      notes: parsed.notes || null,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(clients.id, clientId), eq(clients.businessId, business.id)));

  revalidatePath("/clients");
  redirect("/clients");
}

export async function deleteClient(clientId: string) {
  const { business } = await requireBusiness();
  await db
    .delete(clients)
    .where(and(eq(clients.id, clientId), eq(clients.businessId, business.id)));
  revalidatePath("/clients");
}
