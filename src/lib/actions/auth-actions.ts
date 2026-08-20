"use server";

import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/lib/auth";

const registerSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  name: z.string().min(2, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function registerBusiness(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    businessName: formData.get("businessName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { businessName, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const business = await db
    .insert(businesses)
    .values({ name: businessName, email: normalizedEmail })
    .returning();

  const businessId = business[0].id;

  await db.insert(users).values({
    businessId,
    name,
    email: normalizedEmail,
    passwordHash,
    role: "owner",
  });

  // No free tier and no trial — the business has no subscription until they
  // check out with a card (PayFast integration pending). Until then their
  // plan shows as "No active plan" in Settings, where they can also set a
  // plan manually while billing isn't wired up yet.

  await signIn("credentials", {
    email: normalizedEmail,
    password,
    redirectTo: "/dashboard",
  });

  return {};
}
