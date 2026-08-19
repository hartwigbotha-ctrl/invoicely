"use server";

import { db } from "@/db";
import { items } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireBusiness } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const itemSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  defaultPrice: z.number().min(0).default(0),
});

export async function createItem(formData: FormData) {
  const { business } = await requireBusiness();
  const parsed = itemSchema.parse({
    code: (formData.get("code") as string) || undefined,
    name: formData.get("name"),
    defaultPrice: Number(formData.get("defaultPrice") || 0),
  });

  await db.insert(items).values({
    businessId: business.id,
    code: parsed.code || null,
    name: parsed.name,
    defaultPrice: parsed.defaultPrice,
  });

  revalidatePath("/items");
  redirect("/items");
}

export async function updateItem(itemId: string, formData: FormData) {
  const { business } = await requireBusiness();
  const parsed = itemSchema.parse({
    code: (formData.get("code") as string) || undefined,
    name: formData.get("name"),
    defaultPrice: Number(formData.get("defaultPrice") || 0),
  });

  await db
    .update(items)
    .set({
      code: parsed.code || null,
      name: parsed.name,
      defaultPrice: parsed.defaultPrice,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(items.id, itemId), eq(items.businessId, business.id)));

  revalidatePath("/items");
  redirect("/items");
}

export async function deleteItem(itemId: string) {
  const { business } = await requireBusiness();
  await db.delete(items).where(and(eq(items.id, itemId), eq(items.businessId, business.id)));
  revalidatePath("/items");
}
