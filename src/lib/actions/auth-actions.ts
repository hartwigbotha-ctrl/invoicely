"use server";

import { db } from "@/db";
import { businesses, users, subscriptions, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { addDays, formatISO } from "date-fns";

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

  // Enroll in the free/starter plan with a 14-day trial by default.
  const starterPlan =
    (await db.query.plans.findFirst({ where: eq(plans.name, "Starter") })) ??
    (await db.query.plans.findFirst());

  if (starterPlan) {
    const now = new Date();
    await db.insert(subscriptions).values({
      businessId,
      planId: starterPlan.id,
      status: "trialing",
      trialEndsAt: formatISO(addDays(now, 14)),
      currentPeriodStart: formatISO(now),
      currentPeriodEnd: formatISO(addDays(now, 14)),
    });
  }

  await signIn("credentials", {
    email: normalizedEmail,
    password,
    redirectTo: "/dashboard",
  });

  return {};
}
