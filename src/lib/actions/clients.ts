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
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClient(formData: FormData) {
  const { business } = await requireBusiness();
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    vatNumber: formData.get("vatNumber") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await db.insert(clients).values({
    businessId: business.id,
    name: parsed.name,
    email: parsed.email || null,
    phone: parsed.phone || null,
    address: parsed.address || null,
    vatNumber: parsed.vatNumber || null,
    notes: parsed.notes || null,
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(clientId: string, formData: FormData) {
  const { business } = await requireBusiness();
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    vatNumber: formData.get("vatNumber") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await db
    .update(clients)
    .set({
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      address: parsed.address || null,
      vatNumber: parsed.vatNumber || null,
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
