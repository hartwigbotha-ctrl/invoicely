"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rate-limit";

export type LoginState = { error?: string };

async function rateLimitKey(email: string): Promise<string> {
  const h = await headers();
  // Railway (and most PaaS hosts) sit behind a proxy — the real client IP
  // is in x-forwarded-for, not the TCP connection Next.js sees directly.
  const forwardedFor = h.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : h.get("x-real-ip") ?? "unknown";
  return `${ip}:${email}`;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = ((formData.get("email") as string) ?? "").toLowerCase().trim();
  const key = await rateLimitKey(email);

  const limit = checkRateLimit(key);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil((limit.retryAfterSeconds ?? 60) / 60));
    return { error: `Too many failed login attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      recordFailedAttempt(key);
      return { error: "Invalid email or password." };
    }
    throw err;
  }
}
